// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.22;

import {
    ILendingModuleStaticTyping,
    ILendingModuleBase,
    MarketParams,
    Position,
    Market
} from "./interfaces/ILendingModule.sol";

import {IIrm} from "./interfaces/IIrm.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {IOracle} from "./interfaces/IOracle.sol";

import "./libraries/ConstantsLib.sol";
import {UtilsLib} from "./libraries/UtilsLib.sol";
import {MathLib, WAD} from "./libraries/MathLib.sol";
import {SharesMathLib} from "./libraries/SharesMathLib.sol";
import {SafeTransferLib} from "./libraries/SafeTransferLib.sol";

import {ILiquidityModule} from "../interfaces/ILiquidityModule.sol";

contract FlexiLendingModule is ILendingModuleStaticTyping {
    using MathLib for uint128;
    using MathLib for uint256;
    using UtilsLib for uint256;
    using SharesMathLib for uint256;
    using SafeTransferLib for IERC20;

    /* IMMUTABLES */

    bytes32 public immutable DOMAIN_SEPARATOR;

    /* STORAGE */

    address public owner;
    address public feeRecipient;
    mapping(address => Position) public position;
    Market public market;
    mapping(address => uint256) public nonce;
    MarketParams public currentMarketParams;

    bool public initialized;
    bool public isCollateralToken0;

    address public liquidityModule;

    struct initializeParam {
        MarketParams _marketParams;
        uint256 _newFee;
        address _liquidityModule;
        bool _isCollateralToken0;
        address _newFeeRecipient;
    }

    /* CONSTRUCTOR */

    constructor() {
        DOMAIN_SEPARATOR = keccak256(abi.encode(DOMAIN_TYPEHASH, block.chainid, address(this)));
    }

    function initialize(bytes memory encodedData) external {
        require (initialized == false, "INIITIALIZED");

        initializeParam memory param = abi.decode(encodedData, (initializeParam));

        _createMarket(param._marketParams);

        market.fee = uint128(param._newFee);
        liquidityModule = param._liquidityModule;
        isCollateralToken0 = param._isCollateralToken0;
        feeRecipient = param._newFeeRecipient;

        initialized = true;
    }

    /* MARKET CREATION */

    function _createMarket(MarketParams memory marketParams) internal {
        require(market.lastUpdate == 0, "MARKET_ALREADY_CREATED");

        // Safe "unchecked" cast.
        market.lastUpdate = uint128(block.timestamp);
        currentMarketParams = marketParams;

        // Call to initialize the IRM in case it is stateful.
        if (marketParams.irm != address(0)) IIrm(marketParams.irm).borrowRate(marketParams, market);
    }

    /* SUPPLY MANAGEMENT */

    function supply(
        uint256 assets,
        uint256 shares,
        address onBehalf
    ) external returns (uint256, uint256) {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(UtilsLib.exactlyOneZero(assets, shares), "INCONSISTENT_INPUT");
        require(onBehalf != address(0), "ZERO_ADDRESS");

        _accrueInterest(currentMarketParams);

        if (assets > 0) shares = assets.toSharesDown(market.totalSupplyAssets, market.totalSupplyShares);
        else assets = shares.toAssetsUp(market.totalSupplyAssets, market.totalSupplyShares);

        position[onBehalf].supplyShares += shares;
        market.totalSupplyShares += shares.toUint128();
        market.totalSupplyAssets += assets.toUint128();

        // IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assets);
        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, 0, assets);
        } else {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, assets, 0);
        }

        return (assets, shares);
    }

    function withdraw(
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256, uint256) {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(UtilsLib.exactlyOneZero(assets, shares), "INCONSISTENT_INPUT");
        require(receiver != address(0), "ZERO_ADDRESS");
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), "UNAUTHORIZED");

        _accrueInterest(currentMarketParams);

        if (assets > 0) shares = assets.toSharesUp(market.totalSupplyAssets, market.totalSupplyShares);
        else assets = shares.toAssetsDown(market.totalSupplyAssets, market.totalSupplyShares);

        position[onBehalf].supplyShares -= shares;
        market.totalSupplyShares -= shares.toUint128();
        market.totalSupplyAssets -= assets.toUint128();

        require(market.totalBorrowAssets <= market.totalSupplyAssets, "INSUFFICIENT_LIQUIDITY");

        // IERC20(marketParams.loanToken).safeTransfer(receiver, assets);

        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pushUserBalance(receiver, 0, assets);
        } else {
            ILiquidityModule(liquidityModule).pushUserBalance(receiver, assets, 0);
        }

        return (assets, shares);
    }

    /* BORROW MANAGEMENT */

    function borrow(
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256, uint256) {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(UtilsLib.exactlyOneZero(assets, shares), "INCONSISTENT_INPUT");
        require(receiver != address(0), "ZERO_ADDRESS");
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), "UNAUTHORIZED");

        _accrueInterest(currentMarketParams);

        if (assets > 0) shares = assets.toSharesUp(market.totalBorrowAssets, market.totalBorrowShares);
        else assets = shares.toAssetsDown(market.totalBorrowAssets, market.totalBorrowShares);

        position[onBehalf].borrowShares += shares.toUint128();
        market.totalBorrowShares += shares.toUint128();
        market.totalBorrowAssets += assets.toUint128();

        require(_isHealthy(currentMarketParams, onBehalf), "INSUFFICIENT_COLLATERAL");
        require(market.totalBorrowAssets <= market.totalSupplyAssets, "INSUFFICIENT_LIQUIDITY");

        //IERC20(marketParams.loanToken).safeTransfer(receiver, assets);

        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pushUserBalance(receiver, 0, assets);
        } else {
            ILiquidityModule(liquidityModule).pushUserBalance(receiver, assets, 0);
        }

        return (assets, shares);
    }

    function repay(
        uint256 assets,
        uint256 shares,
        address onBehalf
    ) external returns (uint256, uint256) {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(UtilsLib.exactlyOneZero(assets, shares), "INCONSISTENT_INPUT");
        require(onBehalf != address(0), "ZERO_ADDRESS");

        _accrueInterest(currentMarketParams);

        if (assets > 0) shares = assets.toSharesDown(market.totalBorrowAssets, market.totalBorrowShares);
        else assets = shares.toAssetsUp(market.totalBorrowAssets, market.totalBorrowShares);

        position[onBehalf].borrowShares -= shares.toUint128();
        market.totalBorrowShares -= shares.toUint128();
        market.totalBorrowAssets = UtilsLib.zeroFloorSub(market.totalBorrowAssets, assets).toUint128();

        // IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), assets);
        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, 0, assets);
        } else {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, assets, 0);
        }

        return (assets, shares);
    }

    /* COLLATERAL MANAGEMENT */

    function supplyCollateral(uint256 assets, address onBehalf)
        external
    {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(assets != 0, "ZERO_ASSETS");
        require(onBehalf != address(0), "ZERO_ADDRESS");

        // Don't accrue interest because it's not required and it saves gas.
        position[onBehalf].collateral += assets.toUint128();

        // IERC20(marketParams.collateralToken).safeTransferFrom(msg.sender, address(this), assets);
        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, assets, 0);
        } else {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, 0, assets);
        }
    }


    function withdrawCollateral(uint256 assets, address onBehalf, address receiver)
        external
    {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(assets != 0, "ZERO_ASSETS");
        require(receiver != address(0), "ZERO_ADDRESS");
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), "UNAUTHORIZED");

        _accrueInterest(currentMarketParams);

        position[onBehalf].collateral -= assets.toUint128();

        require(_isHealthy(currentMarketParams, onBehalf), "INSUFFICIENT_COLLATERAL");

        // IERC20(marketParams.collateralToken).safeTransfer(receiver, assets);
        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pushUserBalance(msg.sender, assets, 0);
        } else {
            ILiquidityModule(liquidityModule).pushUserBalance(msg.sender, 0, assets);
        }

    }

    /* LIQUIDATION */

    function liquidate(
        address borrower,
        uint256 seizedAssets,
        uint256 repaidShares
    ) external returns (uint256, uint256) {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");
        require(UtilsLib.exactlyOneZero(seizedAssets, repaidShares), "INCONSISTENT_INPUT");

        _accrueInterest(currentMarketParams);

        {
            uint256 collateralPrice = IOracle(currentMarketParams.oracle).price();

            require(!_isHealthy(currentMarketParams, borrower, collateralPrice), "HEALTHY_POSITION");

            // The liquidation incentive factor is min(maxLiquidationIncentiveFactor, 1/(1 - cursor*(1 - lltv))).
            uint256 liquidationIncentiveFactor = UtilsLib.min(
                MAX_LIQUIDATION_INCENTIVE_FACTOR,
                WAD.wDivDown(WAD - LIQUIDATION_CURSOR.wMulDown(WAD - currentMarketParams.lltv))
            );

            if (seizedAssets > 0) {
                uint256 seizedAssetsQuoted = seizedAssets.mulDivUp(collateralPrice, ORACLE_PRICE_SCALE);

                repaidShares = seizedAssetsQuoted.wDivUp(liquidationIncentiveFactor).toSharesUp(
                    market.totalBorrowAssets, market.totalBorrowShares
                );
            } else {
                seizedAssets = repaidShares.toAssetsDown(market.totalBorrowAssets, market.totalBorrowShares)
                    .wMulDown(liquidationIncentiveFactor).mulDivDown(ORACLE_PRICE_SCALE, collateralPrice);
            }
        }
        uint256 repaidAssets = repaidShares.toAssetsUp(market.totalBorrowAssets, market.totalBorrowShares);

        position[borrower].borrowShares -= repaidShares.toUint128();
        market.totalBorrowShares -= repaidShares.toUint128();
        market.totalBorrowAssets = UtilsLib.zeroFloorSub(market.totalBorrowAssets, repaidAssets).toUint128();

        position[borrower].collateral -= seizedAssets.toUint128();

        uint256 badDebtShares;
        uint256 badDebtAssets;
        if (position[borrower].collateral == 0) {
            badDebtShares = position[borrower].borrowShares;
            badDebtAssets = UtilsLib.min(
                market.totalBorrowAssets,
                badDebtShares.toAssetsUp(market.totalBorrowAssets, market.totalBorrowShares)
            );

            market.totalBorrowAssets -= badDebtAssets.toUint128();
            market.totalSupplyAssets -= badDebtAssets.toUint128();
            market.totalBorrowShares -= badDebtShares.toUint128();
            position[borrower].borrowShares = 0;
        }

        //IERC20(marketParams.collateralToken).safeTransfer(msg.sender, seizedAssets);
        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pushUserBalance(msg.sender, seizedAssets, 0);
        } else {
            ILiquidityModule(liquidityModule).pushUserBalance(msg.sender, 0, seizedAssets);
        }

        //IERC20(marketParams.loanToken).safeTransferFrom(msg.sender, address(this), repaidAssets);
        if (isCollateralToken0 == true) {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, 0, repaidAssets);
        } else {
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, repaidAssets, 0);
        }

        return (seizedAssets, repaidAssets);
    }


    /// @dev Returns whether the sender is authorized to manage `onBehalf`'s positions.
    function _isSenderAuthorized(address onBehalf) internal view returns (bool) {
        return msg.sender == onBehalf;
    }

    /* INTEREST MANAGEMENT */

    function accrueInterest() external {
        require(market.lastUpdate != 0, "MARKET_NOT_CREATED");

        _accrueInterest(currentMarketParams);
    }

    /// @dev Accrues interest for the given market `marketParams`.
    /// @dev Assumes that the inputs `marketParams` match.
    function _accrueInterest(MarketParams memory marketParams) internal {
        uint256 elapsed = block.timestamp - market.lastUpdate;
        if (elapsed == 0) return;

        if (marketParams.irm != address(0)) {
            uint256 borrowRate = IIrm(marketParams.irm).borrowRate(marketParams, market);
            uint256 interest = market.totalBorrowAssets.wMulDown(borrowRate.wTaylorCompounded(elapsed));
            market.totalBorrowAssets += interest.toUint128();
            market.totalSupplyAssets += interest.toUint128();

            uint256 feeShares;
            if (market.fee != 0) {
                uint256 feeAmount = interest.wMulDown(market.fee);
                // The fee amount is subtracted from the total supply in this calculation to compensate for the fact
                // that total supply is already increased by the full interest (including the fee amount).
                feeShares =
                    feeAmount.toSharesDown(market.totalSupplyAssets - feeAmount, market.totalSupplyShares);
                position[feeRecipient].supplyShares += feeShares;
                market.totalSupplyShares += feeShares.toUint128();
            }

        }

        // Safe "unchecked" cast.
        market.lastUpdate = uint128(block.timestamp);
    }

    /* HEALTH CHECK */

    /// @dev Returns whether the position of `borrower` in the given market `marketParams` is healthy.
    /// @dev Assumes that the inputs `marketParams` and `id` match.
    function _isHealthy(MarketParams memory marketParams, address borrower) internal view returns (bool) {
        if (position[borrower].borrowShares == 0) return true;

        uint256 collateralPrice = IOracle(marketParams.oracle).price();

        return _isHealthy(marketParams, borrower, collateralPrice);
    }

    /// @dev Returns whether the position of `borrower` in the given market `marketParams` with the given
    /// `collateralPrice` is healthy.
    /// @dev Assumes that the inputs `marketParams` and `id` match.
    /// @dev Rounds in favor of the protocol, so one might not be able to borrow exactly `maxBorrow` but one unit less.
    function _isHealthy(MarketParams memory marketParams, address borrower, uint256 collateralPrice)
        internal
        view
        returns (bool)
    {
        uint256 borrowed = uint256(position[borrower].borrowShares).toAssetsUp(
            market.totalBorrowAssets, market.totalBorrowShares
        );
        uint256 maxBorrow = uint256(position[borrower].collateral).mulDivDown(collateralPrice, ORACLE_PRICE_SCALE)
            .wMulDown(marketParams.lltv);

        return maxBorrow >= borrowed;
    }

    /* STORAGE VIEW */

    function extSloads(bytes32[] calldata slots) external view returns (bytes32[] memory res) {
        uint256 nSlots = slots.length;

        res = new bytes32[](nSlots);

        for (uint256 i; i < nSlots;) {
            bytes32 slot = slots[i++];

            assembly ("memory-safe") {
                mstore(add(res, mul(i, 32)), sload(slot))
            }
        }
    }
}

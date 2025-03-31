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

contract FlexiMetaLendingModule is ILendingModuleStaticTyping {
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

    uint256 colImbalance;
    uint256 loanImbalance;
    uint256 totalCollateral;

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
        totalCollateral += assets;
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
        totalCollateral -= assets;
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

    // get avaliable loan token reserve -> if swap collateral token -> loan token, fixed fee
    //                                  -> if swap loan token -> collateral token, x3 fee
    // get oracle quote P0. -> get imbalance percent x, penalize users if imbalance increase
    function swap(address to, uint256 amount0In, uint256 amount1In) external {
        require(amount0In == 0 || amount1In == 0, "Invalid AmountIn");

        // collateralPrice * col = loan
        uint256 collateralPrice = IOracle(currentMarketParams.oracle).price();
        uint256 loanLiquidity = uint256(market.totalSupplyAssets) - uint256(market.totalBorrowAssets);
        uint256 colLiquidity = loanLiquidity / collateralPrice < totalCollateral ? loanLiquidity / collateralPrice : totalCollateral;

        if (amount1In == 0) {
            //swap token0 to token1
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, amount0In, 0);

            if (isCollateralToken0 == true) {
                //swap collateral token to loan token
                uint256 avgImbalance = loanImbalance + amount0In / 2;
                uint256 penalizedPrice = collateralPrice * (1 - _x3(avgImbalance) / _x3(loanLiquidity));

                uint256 fee = 30; //0.3% base fee

                if (colImbalance > 0) {
                    fee = 5; //discount fee
                }
                uint256 amountFee = fee * penalizedPrice * amount0In / 1e5;
                uint256 amountOut = amount0In * penalizedPrice - amountFee;
                ILiquidityModule(liquidityModule).pushUserBalance(to, 0, amountOut);
                ILiquidityModule(liquidityModule).pushUserBalance(to, 0, amountFee);

                loanImbalance += amount0In;
                colImbalance -= amountOut;
            } else {
                //swap loan token to collateral token
                uint256 avgImbalance = colImbalance + amount0In / 2;
                uint256 penalizedPrice = collateralPrice * (1 + _x3(avgImbalance) / _x3(colLiquidity));
                
                uint256 fee = 30; //0.3% base fee

                if (loanImbalance > 0) {
                    fee = 5; //discount fee
                }
                uint256 amountFee = fee * amount0In / penalizedPrice / 1e5;
                uint256 amountOut = amount0In / penalizedPrice - amountFee;
                ILiquidityModule(liquidityModule).pushUserBalance(to, 0, amountOut);
                ILiquidityModule(liquidityModule).pushUserBalance(to, 0, amountFee);

                loanImbalance -= amount0In;
                colImbalance += amountOut;
            }
        } else {
            //swap token1 to token0
            ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, 0, amount1In);

            if (isCollateralToken0 == true) {
                //swap loan token to collateral token
                uint256 avgImbalance = colImbalance + amount1In / 2;
                uint256 penalizedPrice = collateralPrice * (1 + _x3(avgImbalance) / _x3(colLiquidity));

                uint256 fee = 30; //0.3% base fee

                if (colImbalance > 0) {
                    fee = 5; //discount fee
                }
                uint256 amountFee = fee * amount1In / penalizedPrice / 1e5;
                uint256 amountOut = amount1In / penalizedPrice - amountFee;
                ILiquidityModule(liquidityModule).pushUserBalance(to, amountOut, 0);
                ILiquidityModule(liquidityModule).pushUserBalance(to, amountFee, 0);

                loanImbalance -= amount1In;
                colImbalance += amountOut;
            } else {
                //swap collateral token to loan token
                uint256 avgImbalance = loanImbalance + amount1In / 2;
                uint256 penalizedPrice = collateralPrice * (1 - _x3(avgImbalance) / _x3(loanLiquidity));

                uint256 fee = 30; //0.3% base fee

                if (colImbalance > 0) {
                    fee = 5; //discount fee
                }
                uint256 amountFee = fee * penalizedPrice * amount1In / 1e5;
                uint256 amountOut = amount1In * penalizedPrice - amountFee;
                ILiquidityModule(liquidityModule).pushUserBalance(to, amountOut, 0);
                ILiquidityModule(liquidityModule).pushUserBalance(to, amountFee, 0);

                loanImbalance += amount1In;
                colImbalance -= amountOut;
            }
        }

    }

    function _x3(uint256 a) internal returns(uint256) {
        return a * a * a;
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

pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {IFlexiStrategy} from "../interfaces/IFlexiStrategy.sol";
import {IAaveV3Pool} from "./interfaces/IAaveV3Pool.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {ILiquidityModule} from "../interfaces/ILiquidityModule.sol";


contract FlexiAAVEStrategy is IFlexiStrategy {
    using SafeTransferLib for IERC20;

    bytes32 public constant LIQUIDITY_ROLE = keccak256("FLEXIFUSION_LIQUIDITY_ROLE");

    address public immutable liquidityModule;
    /// @dev The fiat token
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    bool public token0Enabled;
    bool public token1Enabled;

    /// @dev The Aave pool contract which supports supplying the fiat token
    IAaveV3Pool public immutable aave;

    /// @dev The aToken representing the fiat token in the Aave pool
    IERC20 public immutable aToken0;
    IERC20 public immutable aToken1;

    /// @dev in BIPS
    uint256 target;
    uint256 lowerband;
    uint256 upperband;
    uint256 BIPS = uint32(100000);

    modifier onlyLiquidityModule() {
        require (liquidityModule == msg.sender, "Not Liquidity");
        _;
    }

    constructor(
        address _flexiLiquidityModule, 
        address _aave, 
        address _token0, 
        address _token1, 
        bool _depositToken0, 
        bool _depositToken1,
        uint8 _target,
        uint8 _lowerband,
        uint8 _upperband
    ) {
        liquidityModule = _flexiLiquidityModule;
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        aave = IAaveV3Pool(_aave);

        if (_depositToken0 == true) {
            token0Enabled = true;
            aToken0 = IERC20(aave.getReserveData(address(token0)).aTokenAddress);
        }
        if (_depositToken1 == true) {
            token1Enabled = true;
            aToken1 = IERC20(aave.getReserveData(address(token1)).aTokenAddress);
        }       
        target = _target;
        lowerband = _lowerband;
        upperband = _upperband;
    }

    function depositCallback(uint256 token0Amt, uint256 token1Amt) external onlyLiquidityModule() {
        _rebalance();
    }

    function withdrawCallback(uint256 token0Amt, uint256 token1Amt) external onlyLiquidityModule() {
        _rebalance();
    }

    function _rebalance() internal {
        (uint256 token0Reserve, uint256 token1Reserve) = ILiquidityModule(liquidityModule).getReserve();

        if (token0Enabled == true) {
            uint256 token0Balance = token0.balanceOf(liquidityModule);
            uint256 currentPctInBIPS = BIPS * (token0Reserve - token0Balance) / token0Reserve;

            if (currentPctInBIPS < lowerband) {
                uint256 delta = (token0Reserve * target / BIPS) - token0Reserve + token0Balance;
                aave.deposit(address(token0), delta, address(this), 0);
            } else if (currentPctInBIPS > upperband) {
                uint256 delta = token0Reserve - token0Balance - (token0Reserve * target / BIPS);
                aave.withdraw(address(token0), delta, address(this));
            }
        }

        if (token1Enabled == true) {
            uint256 token1Balance = token1.balanceOf(liquidityModule);
            uint256 currentPctInBIPS = BIPS * (token1Reserve - token1Balance) / token1Reserve;

            if (currentPctInBIPS < lowerband) {
                uint256 delta = (token1Reserve * target / BIPS) - token1Reserve + token1Balance;
                aave.deposit(address(token1), delta, address(this), 0);
            } else if (currentPctInBIPS > upperband) {
                uint256 delta = token1Reserve - token1Balance - (token1Reserve * target / BIPS);
                aave.withdraw(address(token1), delta, address(this));
            }
        }
    }

}
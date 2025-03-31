// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import {ILiquidityModule} from "../../interfaces/ILiquidityModule.sol";
import {ILPModule} from "../../interfaces/ILPModule.sol";

interface IFlexibaseDEXModule {
    function initialize(bytes calldata params) external;
}

abstract contract FlexibaseDEXModule is IFlexibaseDEXModule{
    bool private initialized;

    address liquidityModule;
    address LPModule;
    address token0;
    address token1;

    uint256 reserve0;
    uint256 reserve1;

    struct baseInitializeParam {
        address _liquidityModule;
        address _LPModule;
        address _token0;
        address _token1;
    }

    function initialize(bytes calldata params) external virtual {
        require (initialized == false, "Not Initialized");
        baseInitializeParam memory baseparams = abi.decode(params, (baseInitializeParam));
        liquidityModule = baseparams._liquidityModule;
        token0 = baseparams._token0;
        token1 = baseparams._token1;
        LPModule = baseparams._LPModule;

        initialized = true;
    }

    //calculate LP & mint LPT
    function deployDEXLiquidityCallback(address from, address to, uint256 token0Amt, uint256 token1Amt) external virtual {
        revert("Not implemented");
    }

    function removeLiquidity(address to, uint256 liquidity) external virtual {
        revert("Not implemented");
    }

    function swap(address to, uint256 token0InAmt, uint256 token1InAmt, uint256 token0OutMin, uint256 token1OutMin) external virtual {
        revert("Not implemented");
    }

    function _mintLP(address to, uint256 amount) internal virtual {
        ILPModule(LPModule).mintLPCallback(to, amount);
    }

    function _burnLP(address from, address to, uint256 amount) internal virtual {
        ILPModule(LPModule).burnLPCallback(from, to, amount);
    }

    function _sendFee(uint256 amount0, uint256 amount1) internal virtual {
        ILiquidityModule(liquidityModule).pushUserBalance(LPModule, amount0, amount1);
    }

}
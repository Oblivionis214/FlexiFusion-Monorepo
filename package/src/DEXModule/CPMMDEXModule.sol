// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ILiquidityModule} from "../interfaces/ILiquidityModule.sol";
import {ILPModule} from "../interfaces/ILPModule.sol";
import {FlexibaseDEXModule} from "./subModule/baseDEXModule.sol";
import {CPMMMath} from "./subModule/CPMM.sol";

contract CPMMDEXModule is FlexibaseDEXModule, CPMMMath {
    
    //calculate LP & mint LPT
    function deployDEXLiquidityCallback(address from, address to, uint256 token0Amt, uint256 token1Amt) external override {
        uint256 totalSupply = ILPModule(LPModule).totalSupply();
        uint256 liquidity = calculateLiquidity(token0Amt, token1Amt, reserve0 + 1 , reserve1 + 1, totalSupply);

        uint256 realAmt0 = (reserve0 + 1) * liquidity / (totalSupply + 1);
        uint256 realAmt1 = (reserve1 + 1) * liquidity / (totalSupply + 1);

        reserve0 += realAmt0;
        reserve1 += realAmt1;

        ILiquidityModule(liquidityModule).pullUserBalance(from, realAmt0, realAmt1);
        _mintLP(to, liquidity);
    }

    function removeLiquidity(address to, uint256 liquidity) external override {
        uint256 totalSupply = ILPModule(LPModule).totalSupply();
        (uint256 token0Amt, uint256 token1Amt) = calculateRemoveLiquidity(liquidity, totalSupply, reserve0, reserve1);

        reserve0 -= token0Amt;
        reserve1 -= token1Amt;

        _burnLP(msg.sender, to, liquidity);
        ILiquidityModule(liquidityModule).pushUserBalance(to, token0Amt, token1Amt);
    }

    //WE only allow specify 1 amount
    function swap(address to, uint256 token0InAmt, uint256 token1InAmt, uint256 token0OutMin, uint256 token1OutMin) external override {

        uint256 fee;
        uint256 amountOut;

        ILiquidityModule(liquidityModule).pullUserBalance(msg.sender, token0InAmt, token1InAmt);

        if (token1InAmt == 0) {
            //swap 0 to 1
            (amountOut, fee) = getAmountOut(token0InAmt, reserve0, reserve1);
            ILiquidityModule(liquidityModule).pushUserBalance(to, 0, amountOut);
            _sendFee(fee, 0);

            reserve0 += token0InAmt - fee;
            reserve1 -= amountOut;

        } else if (token0InAmt == 0) {
            //swap 1 to 0
            (amountOut, fee) = getAmountOut(token1InAmt, reserve1, reserve0);
            ILiquidityModule(liquidityModule).pushUserBalance(to, amountOut, 0);
            _sendFee(0, fee);

            reserve0 -= amountOut;
            reserve1 += token1InAmt - fee;

        } else revert("Not Allowed Input!");
    }
}
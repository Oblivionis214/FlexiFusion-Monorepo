// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

/// @title ILiquidityUser
/// @author Ryan
/// @notice Interface that all liquidity module user must implement.
interface IDEXModule {
    
    function deployDEXLiquidityCallback (address from, address to, uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);

}

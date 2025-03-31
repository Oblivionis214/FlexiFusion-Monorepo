// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

/// @title ILiquidityUser
/// @author Ryan
/// @notice Interface that all liquidity module user must implement.
interface ILiquidityModule {
    
    function getReserve() external view returns (uint256, uint256);

    function pullLiquidity(address to, uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);

    function pushLiquidity(address user, uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);

    function pullUserBalance(address from, uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);

    function pushUserBalance(address to, uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);
}

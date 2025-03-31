// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

/// @title ILiquidityUser
/// @author Ryan
/// @notice Interface that all liquidity module user must implement.
interface ILiquidityUser {
    /// @notice Returns the actual pulled token amount.
    /// @dev Assumes that `market` corresponds to `marketParams`.
    function pullLiquidityCallback (uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);

    /// @notice Returns the borrow rate per second (scaled by WAD) of the market `marketParams` without modifying any
    /// storage.
    /// @dev Assumes that `market` corresponds to `marketParams`.
    function pushLiquidityCallback (uint256 token0Amt, uint256 token1Amt) external returns (uint256, uint256);

}

// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

/// @title ILiquidityUser
/// @author Ryan
/// @notice Interface that all liquidity module user must implement.
interface ILPModule {
    
    function mintLPCallback (address to, uint256 amount) external returns (uint256, uint256);
    function burnLPCallback (address from, address to, uint256 amount) external returns (uint256, uint256);
    function totalSupply() external returns (uint256);

}

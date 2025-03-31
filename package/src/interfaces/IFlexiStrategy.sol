// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

interface IFlexiStrategy {
    function depositCallback(uint256 token0Amt, uint256 token1Amt) external;
    function withdrawCallback(uint256 token0Amt, uint256 token1Amt) external;
}

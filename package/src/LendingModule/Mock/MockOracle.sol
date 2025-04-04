//1879388777198860215743146644
// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

interface IOracle {
    /// @notice Returns the price of 1 asset of collateral token quoted in 1 asset of loan token, scaled by 1e36.
    /// @dev It corresponds to the price of 10**(collateral token decimals) assets of collateral token quoted in
    /// 10**(loan token decimals) assets of loan token with `36 + loan token decimals - collateral token decimals`
    /// decimals of precision.
    function price() external view returns (uint256);
}

contract MockOracle is IOracle {
    function price() external view returns (uint256) {
        return 1879388777198860215743146644;
    }
}
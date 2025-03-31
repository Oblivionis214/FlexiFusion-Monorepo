// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import {ILiquidityModule} from "../../interfaces/ILiquidityModule.sol";

interface IFlexibaseLPModule {
    function initialize(bytes calldata params) external;
}

abstract contract FlexibaseLPModule is IFlexibaseLPModule{
    bool private initialized;

    address liquidityModule;
    address ProjectModule;
    address token0;
    address token1;

    uint256 accumulatedReward0;
    uint256 accumulatedReward1;

    struct baseInitializeParam {
        address _liquidityModule;
        address _ProjectModule;
        address _token0;
        address _token1;
    }

    function initialize(bytes calldata params) external virtual {
        require (initialized == false, "Not Initialized");
        baseInitializeParam memory baseparams = abi.decode(params, (baseInitializeParam));
        liquidityModule = baseparams._liquidityModule;
        token0 = baseparams._token0;
        token1 = baseparams._token1;
        ProjectModule = baseparams._ProjectModule;

        initialized = true;
    }

    function claimRewards(address to, uint256 amount) external virtual {
        revert("Not implemented");
    }

    function mintLPCallback (address to, uint256 amount) external virtual returns (uint256, uint256) {
        revert("Not implemented");
    }

    function burnLPCallback (address from, address to, uint256 amount) external virtual returns (uint256, uint256) {
        revert("Not implemented");
    }

    function _sendRewards(address to, uint256 amount0, uint256 amount1) internal virtual {
        ILiquidityModule(liquidityModule).pushUserBalance(to, amount0, amount1);
    }

}
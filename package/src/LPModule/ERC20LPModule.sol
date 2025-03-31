// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {FlexibaseLPModule} from "./subModule/baseLPModule.sol";

contract FlexiFusionLP is FlexibaseLPModule, ERC20, ERC20Permit {
    constructor()
        ERC20("FlexiFusionLP", "FFLP")
        ERC20Permit("FlexiFusionLP")
    {}

    function mintLPCallback (address to, uint256 amount) external override returns (uint256, uint256) {
        _mint(to, amount);
    }

    function burnLPCallback (address from, address to, uint256 amount) external override returns (uint256, uint256) {
        uint256 token0Amt = accumulatedReward0 * amount / totalSupply();
        uint256 token1Amt = accumulatedReward1 * amount / totalSupply();
        _burn(msg.sender, amount);
        _sendRewards(to, token0Amt, token1Amt);
    }
}
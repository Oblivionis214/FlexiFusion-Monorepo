// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract WETH is ERC20, ERC20Burnable, ERC20Permit {
    constructor()
        ERC20("WETH", "WETH")
        ERC20Permit("WETH")
    {
        _mint(address(0x0eAE37a737EA288596Ae4BD043eb09202E093302), uint256(1e30));
    }

    function mint(address to, uint256 amount) public {
        require(amount < 1e25, "NONONO");
        _mint(to, amount);
    }
}
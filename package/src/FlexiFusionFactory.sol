// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IFlexiBaseModule} from "./libraries/FlexiBaseModule.sol";

contract FlexiFusionFactory is AccessControl {

    mapping (address => bool) public whitelistedL1Module;
    mapping (address => bool) public whitelistedL2Module;
    mapping (address => bool) public whitelistedL3Module;

    address[] public activeL1Module;
    address[] public activeL2Module;
    address[] public activeL3Module;

    struct deployParams{
        address impl;
        bytes initializeParams;
    }

    constructor () {
        //demo propose
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setWhitelistL1(address impl, bool allowed) public onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistedL1Module[impl] = allowed;
        if (allowed == true) {
            activeL1Module.push(impl);
        }
    }

    function setWhitelistL2(address impl, bool allowed) public onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistedL2Module[impl] = allowed;
        if (allowed == true) {
            activeL2Module.push(impl);
        }
    }

    function setWhitelistL3(address impl, bool allowed) public onlyRole(DEFAULT_ADMIN_ROLE) {
        whitelistedL3Module[impl] = allowed;
        if (allowed == true) {
            activeL3Module.push(impl);
        }
    }

    function deployFlexiFusion(deployParams[] memory params) external returns (bool) {
    
        for (uint256 i = 0; i < params.length; i++) {
            address impl = params[i].impl;
            bytes memory initData = params[i].initializeParams;

            _deployModule(impl, initData);
        }
        return true;
    }

    function _deployModule(address impl, bytes memory params) internal {
        address deployedModule = Clones.clone(impl);
        (bool success, ) = impl.call(abi.encodeWithSignature("initialize(bytes)", params));
        require(success, "Deployment failed");
    }
}
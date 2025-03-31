// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

interface IFlexiBaseModule {
    function initialize(bytes calldata params) external;
}

abstract contract FlexiBaseModule is IFlexiBaseModule{
    bool private initialized;

    modifier notInitialized() {
        require(!initialized, "Already initialized");
        _;
    }

    function initialize(bytes calldata params) external virtual notInitialized {
        initialized = true;
    }
}
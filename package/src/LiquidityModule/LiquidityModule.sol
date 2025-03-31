// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IFlexiStrategy} from "../interfaces/IFlexiStrategy.sol";
import {IDEXModule} from "../interfaces/IDEXModule.sol";
import {ILendingModule} from "../interfaces/ILendingModule.sol";
import {SafeTransferLib} from "../libraries/SafeTransferLib.sol";
import {FlexiBaseModule} from "../libraries/FlexiBaseModule.sol";


// @title: FlexiFusion 2 token Liquidity Module
// @author: Ryan, Mortis
// @notice: The Liquidity layer of the whole FlexiFusion project

contract FlexiFusionLiquidityModule is AccessControl, FlexiBaseModule{
    using SafeTransferLib for IERC20;

    bytes32 public constant FLEXIFACTORY_ROLE = keccak256("FLEXIFACTORY_ROLE");
    bytes32 public constant DEX_ROLE = keccak256("FLEXIFUSION_DEX_ROLE");
    bytes32 public constant STRATEGY_ROLE = keccak256("FLEXIFUSION_STRATEGY_ROLE");
    bytes32 public constant LENDING_ROLE = keccak256("FLEXIFUSION_LENDING_ROLE");
    bytes32 public constant EXTRA_ROLE = keccak256("FLEXIFUSION_EXTRA_ROLE");
    bytes32 public constant PROJECT_ROLE = keccak256("FLEXIFUSION_PROJECT_ROLE");

    address public token0;
    address public token1;

    bool public dexEnabled;
    bool public lendingEnabled;
    bool public strategyEnabled;
    bool public extraEnabled;

    bool initialized;


    address public factory;
    address public dexModule;
    address public lendingModule;
    address public strategyModule;
    address public extraModule;

    uint256 public token0Reserve;
    uint256 public token1Reserve;

    struct initializeParam {
        address _flexiFactory;
        address _token0;
        address _token1;
        address _dexModule;
        address _lendingModule;
        address _strategyModule;
        address _extraModule;
    }

    struct userBalance {
        uint256 balance0;
        uint256 balance1;
    }

    mapping(address => userBalance) public userState;
    
    //Disable initializer
    constructor() {
        initialized = true;
    }

    function initialize(bytes calldata encodedData) external override notInitialized {
        initializeParam memory param = abi.decode(encodedData, (initializeParam));
        factory = param._flexiFactory;
        token0 = param._token0;
        token1 = param._token1;

        _grantRole(FLEXIFACTORY_ROLE, factory);

        _setModule(param._dexModule, param._lendingModule, param._strategyModule, param._extraModule);
        initialized = true;
    }


    function getReserve() external view returns (uint256, uint256) {
        return (token0Reserve, token1Reserve);
    }

    // @dev Only triggered once during initialization
    function setModule(address _dexModule, address _lendingModule, address _strategyModule, address _extraModule) external onlyRole(FLEXIFACTORY_ROLE) {
        _setModule(_dexModule, _lendingModule, _strategyModule, _extraModule);
    }

    function _setModule(address _dexModule, address _lendingModule, address _strategyModule, address _extraModule) internal {
        if (_dexModule != address(0)) {
            dexEnabled = true;
            dexModule = _dexModule;
            _grantRole(DEX_ROLE, dexModule);
            _grantRole(PROJECT_ROLE, dexModule);
        }
        if (_lendingModule != address(0)) {
            lendingEnabled = true;
            lendingModule = _lendingModule;
            _grantRole(LENDING_ROLE, lendingModule);
            _grantRole(PROJECT_ROLE, lendingModule);
        }
        if (_strategyModule != address(0)) {
            strategyEnabled = true;
            strategyModule = _strategyModule;
            _grantRole(STRATEGY_ROLE, strategyModule);
            //WE dont allow strategyModule directly pull/push user states
        }
        if (_extraModule != address(0)) {
            extraEnabled = true;
            extraModule = _extraModule;
            _grantRole(EXTRA_ROLE, extraModule);
            _grantRole(PROJECT_ROLE, extraModule);
        }
    }


    /// @notice Returns the actual pulled token amount.
    /// @dev Assumes liquidity module has enough reserves.
    function pullLiquidity(address to, uint256 token0Amt, uint256 token1Amt) external onlyRole(PROJECT_ROLE) returns (uint256, uint256) {
        IERC20(token0).safeTransfer(to, token0Amt);
        IERC20(token1).safeTransfer(to, token1Amt);
        token0Reserve -= token0Amt;
        token1Reserve -= token1Amt;
    }

    /// @notice Returns the borrow rate per second (scaled by WAD) of the market `marketParams` without modifying any
    /// storage.
    /// @dev Assumes that `market` corresponds to `marketParams`.
    function pushLiquidity(address user, uint256 token0Amt, uint256 token1Amt) external onlyRole(PROJECT_ROLE) returns (uint256, uint256) {
        IERC20(token0).safeTransferFrom(user, address(this), token0Amt);
        IERC20(token1).safeTransferFrom(user, address(this), token1Amt);
        token0Reserve += token0Amt;
        token1Reserve += token1Amt;
    }

    // @notice Returns the actual pulled token amount.
    // @dev Assumes liquidity module has enough reserves.
    function pullUserBalance(address from, uint256 token0Amt, uint256 token1Amt) external onlyRole(PROJECT_ROLE) returns (uint256, uint256) {
        userState[from].balance0 -= token0Amt;
        userState[from].balance1 -= token1Amt;
    }

    // @notice Returns the borrow rate per second (scaled by WAD) of the market `marketParams` without modifying any
    // storage.
    // @dev Assumes that `market` corresponds to `marketParams`.
    function pushUserBalance(address to, uint256 token0Amt, uint256 token1Amt) external onlyRole(PROJECT_ROLE) returns (uint256, uint256) {
        userState[to].balance0 += token0Amt;
        userState[to].balance1 += token1Amt;
    }



    function deposit(address to, uint256 token0Amt, uint256 token1Amt) public {
        IERC20(token0).safeTransferFrom(msg.sender, address(this), token0Amt);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), token1Amt);

        if (strategyEnabled == true) {
            IFlexiStrategy(strategyModule).depositCallback(token0Amt, token1Amt);
        }

        userState[to].balance0 += token0Amt;
        userState[to].balance1 += token1Amt;
        token0Reserve += token0Amt;
        token1Reserve += token1Amt;
    }

    function withdraw(address to, uint256 token0Amt, uint256 token1Amt) public {
        require (userState[msg.sender].balance0 >= token0Amt && userState[msg.sender].balance1 >= token1Amt, "Insufficient Balance");
        
        if (strategyEnabled == true) {
            IFlexiStrategy(strategyModule).withdrawCallback(token0Amt, token1Amt);
        }

        userState[msg.sender].balance0 -= token0Amt;
        userState[msg.sender].balance1 -= token1Amt;
        token0Reserve -= token0Amt;
        token1Reserve -= token1Amt;

        IERC20(token0).safeTransfer(to, token0Amt);
        IERC20(token1).safeTransfer(to, token1Amt);
    }

    function deployDEXLiquidity(address to, uint256 token0Amt, uint256 token1Amt) public {
        require (dexEnabled, "DEX not enabled");
        require (userState[msg.sender].balance0 >= token0Amt && userState[msg.sender].balance1 >= token1Amt, "Insufficient Balance");

        IDEXModule(dexModule).deployDEXLiquidityCallback(msg.sender, to, token0Amt, token1Amt);
    }


    function deployLendingLiquidity(address to, uint256 token0Amt, uint256 token1Amt) public {
        require (lendingEnabled, "Lending not enabled");
        require (userState[msg.sender].balance0 >= token0Amt && userState[msg.sender].balance1 >= token1Amt, "Insufficient Balance");

        ILendingModule(lendingModule).deployLendingLiquidityCallback(to, token0Amt, token1Amt);
    }
}

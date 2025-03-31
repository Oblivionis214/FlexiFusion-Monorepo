// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";

// 定义合约接口
interface IFlexiFusionDeployer {
    struct initializeParam {
        address _liquidityModule;
        address _LPModule;
        address _token0;
        address _token1;
    }

    struct deployParams {
        address impl;
        bytes initializeParams;
    }

    function initialize(bytes calldata encodedData) external;

    function deployFlexiFusion(deployParams[] calldata params) external returns (bool);


}

contract DeployScript is Script {
    function run() external {
        // 从环境变量获取私钥
        uint256 deployerPrivateKey = uint256(0x6955f9d436738e9e97cb964d7dd25bddb08abf60aa8508cd55a944bfb3e2605e);
        vm.startBroadcast(deployerPrivateKey);

        // 1. 准备初始化参数
        IFlexiFusionDeployer.initializeParam memory initParam = IFlexiFusionDeployer.initializeParam({
            _liquidityModule: 0xDEDbDf2f3EE1CB459F2eB0f9A4972A5588158a2D,
            _LPModule: 0xD5BC5F8EF51EFe76462177133Bb671c8Cb866894,
            _token0: 0x1d81BaaBF0aC77C42bf1fB77943526ece1aEAa01,
            _token1: 0xafa8399499B2EE41A04eD98C59Db1e0E65cB73C1
        });

        // 2. 编码初始化参数
        bytes memory encodedData = abi.encode(initParam);

/*
        // 3. 构造部署参数数组
        IFlexiFusionDeployer.deployParams[] memory params = new IFlexiFusionDeployer.deployParams[](1);
        params[0] = IFlexiFusionDeployer.deployParams({
            impl: 0x8A94D51fBb2917d3217E89b8D168B2303C9DBAbA, // 替换实际实现合约地址
            initializeParams: encodedData
        });
*/
        // 4. 获取目标合约实例
        IFlexiFusionDeployer deployer = IFlexiFusionDeployer(0xa30D484f7618c1f72F4FF08c29598c2134d7BC21); // 替换实际部署合约地址

        // 5. 调用部署函数
        deployer.initialize(encodedData);

        vm.stopBroadcast();
    }
}
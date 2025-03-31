// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";

// 定义合约接口
interface IFlexiFusionDeployer {

    struct MarketParams {
        address loanToken;
        address collateralToken;
        address oracle;
        address irm;
        uint256 lltv;
    }

    struct initializeParam {
        MarketParams _marketParams;
        uint256 _newFee;
        address _liquidityModule;
        bool _isCollateralToken0;
        address _newFeeRecipient;
    }

    function initialize(bytes calldata encodedData) external;

}

contract DeployScript is Script {
    function run() external {
        // 从环境变量获取私钥
        uint256 deployerPrivateKey = 0x6955f9d436738e9e97cb964d7dd25bddb08abf60aa8508cd55a944bfb3e2605e;
        vm.startBroadcast(deployerPrivateKey);

        // 1. 准备初始化参数
        IFlexiFusionDeployer.MarketParams memory initParam1 = IFlexiFusionDeployer.MarketParams({
            loanToken:0x1d81BaaBF0aC77C42bf1fB77943526ece1aEAa01, //stable
            collateralToken:0xafa8399499B2EE41A04eD98C59Db1e0E65cB73C1,
            oracle:0x8e87E8e91E569Dc451b57a6ff8A87F56eA8AFDe8,
            irm:0x16eCE41f255204f5c98F6E2600bFBa83A016E2FE,
            lltv:915000000000000000
        });

        IFlexiFusionDeployer.initializeParam memory initParam = IFlexiFusionDeployer.initializeParam({
            _marketParams:initParam1,
            _newFee:1e15, //0.1% fee
            _liquidityModule:0x532e712D6F5B9aEB33b567101B44205F9561d37f,
            _isCollateralToken0:false,
            _newFeeRecipient:0x0eAE37a737EA288596Ae4BD043eb09202E093302
        });

        // 2. 编码初始化参数
        bytes memory encodedData = abi.encode(initParam);

        IFlexiFusionDeployer deployer = IFlexiFusionDeployer(0x23e002ff7c342Fc30e1DdC68183C8017FACA91b2); // 替换实际部署合约地址

        // 5. 调用部署函数
        deployer.initialize(encodedData);

        vm.stopBroadcast();
    }
}
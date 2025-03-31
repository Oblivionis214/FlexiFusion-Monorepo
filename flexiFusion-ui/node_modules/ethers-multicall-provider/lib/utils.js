"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMulticallVersion = exports.getBlockNumber = void 0;
const utils_1 = require("ethers/lib/utils");
const constants_1 = require("./constants");
const multicall_provider_1 = require("./multicall-provider");
const getBlockNumber = (blockTag) => {
    if ((0, utils_1.isHexString)(blockTag))
        return parseInt(blockTag, 16);
    else if (typeof blockTag === "number")
        return blockTag;
    else if (blockTag === "earliest")
        return 0;
    return null;
};
exports.getBlockNumber = getBlockNumber;
const getMulticallVersion = (blockNumber, chainId) => {
    if (blockNumber != null) {
        if (blockNumber <= (constants_1.multicall3DeploymentBlockNumbers[chainId] ?? Infinity)) {
            if (blockNumber <= (constants_1.multicall2DeploymentBlockNumbers[chainId] ?? Infinity))
                return null;
            return multicall_provider_1.MulticallVersion.V2;
        }
    }
    return multicall_provider_1.MulticallVersion.V3;
};
exports.getMulticallVersion = getMulticallVersion;

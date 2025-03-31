/*
 * @Description: 
 * @Date: 2025-03-30 01:57:50
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-31 07:48:38
 */
export const FlexiFusionFactoryABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "token0Amt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "token1Amt",
                "type": "uint256"
            }
        ],
        "name": "deployDEXLiquidityCallback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "params",
                "type": "bytes"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "liquidity",
                "type": "uint256"
            }
        ],
        "name": "removeLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "token0InAmt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "token1InAmt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "token0OutMin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "token1OutMin",
                "type": "uint256"
            }
        ],
        "name": "swap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]; 
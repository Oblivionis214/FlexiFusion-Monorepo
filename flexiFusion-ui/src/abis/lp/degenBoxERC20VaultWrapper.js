/*
 * @Description: 
 * @Date: 2025-03-18 01:34:11
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 10:15:01
 */
export default [
  {
    inputs: [
      {
        internalType: "contract IBentoBoxV1",
        name: "_degenBox",
        type: "address",
      },
      {
        internalType: "contract ITokenWrapper",
        name: "_wrapper",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "unwrap",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "shareOut", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "wrap",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "shareOut", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

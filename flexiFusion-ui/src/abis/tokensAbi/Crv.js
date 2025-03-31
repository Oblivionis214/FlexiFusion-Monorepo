export default [
  {
    name: "Transfer",
    inputs: [
      { type: "address", name: "_from", indexed: true },
      { type: "address", name: "_to", indexed: true },
      { type: "uint256", name: "_value", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    name: "Approval",
    inputs: [
      { type: "address", name: "_owner", indexed: true },
      { type: "address", name: "_spender", indexed: true },
      { type: "uint256", name: "_value", indexed: false },
    ],
    anonymous: false,
    type: "event",
  },
  {
    outputs: [],
    inputs: [
      { type: "string", name: "_name" },
      { type: "string", name: "_symbol" },
      { type: "uint256", name: "_decimals" },
      { type: "uint256", name: "_supply" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    name: "set_minter",
    outputs: [],
    inputs: [{ type: "address", name: "_minter" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    name: "set_name",
    outputs: [],
    inputs: [
      { type: "string", name: "_name" },
      { type: "string", name: "_symbol" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "totalSupply",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "allowance",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [
      { type: "address", name: "_owner" },
      { type: "address", name: "_spender" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "transfer",
    outputs: [{ type: "bool", name: "" }],
    inputs: [
      { type: "address", name: "_to" },
      { type: "uint256", name: "_value" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "transferFrom",
    outputs: [{ type: "bool", name: "" }],
    inputs: [
      { type: "address", name: "_from" },
      { type: "address", name: "_to" },
      { type: "uint256", name: "_value" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "approve",
    outputs: [{ type: "bool", name: "" }],
    inputs: [
      { type: "address", name: "_spender" },
      { type: "uint256", name: "_value" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "mint",
    outputs: [{ type: "bool", name: "" }],
    inputs: [
      { type: "address", name: "_to" },
      { type: "uint256", name: "_value" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "burnFrom",
    outputs: [{ type: "bool", name: "" }],
    inputs: [
      { type: "address", name: "_to" },
      { type: "uint256", name: "_value" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    name: "name",
    outputs: [{ type: "string", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "symbol",
    outputs: [{ type: "string", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "decimals",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "" }],
    inputs: [{ type: "address", name: "arg0" }],
    stateMutability: "view",
    type: "function",
  },
];

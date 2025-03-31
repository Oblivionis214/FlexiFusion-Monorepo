export default [
  {
    inputs: [
      {
        internalType: "contract IWETHAlike",
        name: "_rewardToken",
        type: "address",
      },
      {
        internalType: "contract IGmxRewardRouterV2",
        name: "_rewardRouterV2",
        type: "address",
      },
      {
        internalType: "contract IGmxGlpRewardRouter",
        name: "_glpRewardRouter",
        type: "address",
      },
      {
        internalType: "contract IMagicGlpRewardHandler",
        name: "_vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "ErrInvalidFeePercent", type: "error" },
  { inputs: [], name: "ErrNotRewardToken", type: "error" },
  { inputs: [], name: "NotAllowedOperator", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "feeCollector",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint16",
        name: "feeAmount",
        type: "uint16",
      },
    ],
    name: "LogFeeParametersChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      { indexed: false, internalType: "uint256", name: "fee", type: "uint256" },
    ],
    name: "LogHarvest",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IGmxRewardRouterV2",
        name: "",
        type: "address",
      },
      {
        indexed: true,
        internalType: "contract IGmxRewardRouterV2",
        name: "",
        type: "address",
      },
    ],
    name: "LogRewardRouterV2Changed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "", type: "address" },
      { indexed: false, internalType: "bool", name: "", type: "bool" },
    ],
    name: "OperatorChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "BIPS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "asset",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimable",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeCollector",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feePercentBips",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "glpRewardRouter",
    outputs: [
      {
        internalType: "contract IGmxGlpRewardRouter",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastExecution",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "operators",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardRouterV2",
    outputs: [
      {
        internalType: "contract IGmxRewardRouterV2",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardToken",
    outputs: [
      { internalType: "contract IWETHAlike", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "minGlp", type: "uint256" },
      { internalType: "uint256", name: "rewardAmount", type: "uint256" },
    ],
    name: "run",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_feeCollector", type: "address" },
      { internalType: "uint16", name: "_feePercentBips", type: "uint16" },
    ],
    name: "setFeeParameters",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "operator", type: "address" },
      { internalType: "bool", name: "status", type: "bool" },
    ],
    name: "setOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IGmxRewardRouterV2",
        name: "_rewardRouterV2",
        type: "address",
      },
    ],
    name: "setRewardRouterV2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRewardsBalanceAfterClaiming",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newOwner", type: "address" },
      { internalType: "bool", name: "direct", type: "bool" },
      { internalType: "bool", name: "renounce", type: "bool" },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [
      {
        internalType: "contract IMagicGlpRewardHandler",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

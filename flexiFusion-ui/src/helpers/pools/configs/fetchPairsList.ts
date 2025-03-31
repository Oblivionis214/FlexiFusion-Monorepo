import axios from "axios";
import localPoolConfigs from "@/configs/pools/pools";
import type { PoolConfig } from "@/configs/pools/types";
import { graphAPIs } from "@/constants/pools/poolCreation";

export type GraphPairConfig = {
  id: string;
  i: bigint;
  k: bigint;
  lpFeeRate: bigint;
  baseToken: {
    id: `0x${string}`;
  };
  quoteToken: {
    id: `0x${string}`;
  };
};

export type GraphPairsConfigs = {
  pairs: GraphPairConfig[];
};

export const fetchPairsList = async (
  chainId: number,
  poolId = ""
): Promise<GraphPairsConfigs | { pair: GraphPairConfig } | null> => {
  console.log("fetchPairsList - chainId:", chainId, "poolId:", poolId);
  const subgraphUrl = graphAPIs[chainId as keyof typeof graphAPIs];
  console.log("fetchPairsList - subgraphUrl:", subgraphUrl);
  
  if (!subgraphUrl && !poolId) {
    console.log("fetchPairsList - no subgraphUrl and no poolId, checking local pairs");
    return checkLocalPairsByChain(chainId);
  }
  else if (!subgraphUrl && poolId) {
    console.log("fetchPairsList - no subgraphUrl but has poolId, checking local pair by id");
    return checkLocalPairById(chainId, poolId);
  }

  const query = createPairsRequest(poolId);
  console.log("fetchPairsList - query:", query);
  const { data } = await axios.post(subgraphUrl, { query });
  console.log("fetchPairsList - response data:", data);

  return data.data;
};

const checkLocalPairsByChain = (chainId: number) => {
  console.log("checkLocalPairsByChain - chainId:", chainId);
  console.log("checkLocalPairsByChain - localPoolConfigs:", localPoolConfigs);
  
  const filteredLocalConfigs = localPoolConfigs.filter(
    (config) => config.chainId === chainId && !config.isAdditionalConfig
  ) as PoolConfig[];
  console.log("checkLocalPairsByChain - filteredLocalConfigs:", filteredLocalConfigs);

  const pairs = filteredLocalConfigs.map((config) => {
    return {
      id: config.id,
      i: config.initialParameters.I,
      k: config.initialParameters.K,
      lpFeeRate: config.initialParameters.lpFeeRate,
      baseToken: { id: config.baseToken.contract.address },
      quoteToken: { id: config.quoteToken.contract.address },
    };
  });
  console.log("checkLocalPairsByChain - pairs:", pairs);

  return { pairs };
};

const checkLocalPairById = (chainId: number, poolId = "") => {
  const pair = localPoolConfigs.find(
    (config) =>
      config.id === poolId &&
      config.chainId === chainId &&
      !config.isAdditionalConfig
  ) as PoolConfig | undefined;

  if (!pair) return null;

  return {
    pair: {
      id: pair.id,
      i: pair.initialParameters.I,
      k: pair.initialParameters.K,
      lpFeeRate: pair.initialParameters.lpFeeRate,
      baseToken: { id: pair.baseToken.contract.address },
      quoteToken: { id: pair.quoteToken.contract.address },
    },
  };
};

const createPairsRequest = (poolId: string) => {
  const query = poolId ? `pair(id: "${poolId}")` : `pairs(first: 1000)`;

  return `
        query MyQuery {
                ${query} {
                          id
                          i
                          k
                          lpFeeRate
                          quoteToken {
                            id
                          }
                          baseToken {
                            id
                          }
                  }
          }`;
};

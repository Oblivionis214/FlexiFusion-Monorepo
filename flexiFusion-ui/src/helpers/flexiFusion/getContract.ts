/*
 * @Description: 
 * @Date: 2025-03-30 10:05:40
 * @Author: 李若愚
 * @LastEditors: 李若愚
 * @LastEditTime: 2025-03-30 10:13:34
 */
import { getPublicClient } from "@/helpers/chains/getChainsInfo";
import { FlexiFusionFactoryABI } from "@/abis/flexiFusionAbi/FlexiFusionFactory";
import { CPMMDEXModuleABI } from "@/abis/flexiFusionAbi/CPMMDEXModule";

const FLEXI_FUSION_ADDRESS = "0x08fe883A9CFb083C7252D1CCB2ef3df36644F4FC";

export const getFlexiFusionContract = () => {
  const publicClient = getPublicClient(1);
  return {
    factory: publicClient.getContract({
      address: FLEXI_FUSION_ADDRESS,
      abi: FlexiFusionFactoryABI,
      publicClient,
    }),
    dexModule: publicClient.getContract({
      address: FLEXI_FUSION_ADDRESS,
      abi: CPMMDEXModuleABI,
      publicClient,
    }),
  };
}; 
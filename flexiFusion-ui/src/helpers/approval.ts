import {
  writeContractHelper,
  simulateContractHelper,
  waitForTransactionReceiptHelper,
} from "@/helpers/walletClienHelper";
import type { Address } from "viem";
import type { ContractInfo } from "@/types/global";
import { MAX_ALLOWANCE_VALUE } from "@/constants/global";
import { type WalletClient } from "viem";

export const approveTokenViem = async (
  contract: { address: Address; abi: any },
  spender: Address,
  amount: bigint,
  wagmiConfig?: any
) => {
  try {
    // 检查必要参数
    if (!contract || !spender || !amount) {
      throw new Error("Missing required parameters for approval");
    }

    // 模拟合约调用
    const { request } = await simulateContractHelper({
      address: contract.address,
      abi: contract.abi,
      functionName: "approve",
      args: [spender, amount],
      wagmiConfig
    });

    // 执行合约写入
    const hash = await writeContractHelper(request);
    
    return hash;
  } catch (error: any) {
    console.error("Error in approveTokenViem:", error);
    throw error;
  }
};

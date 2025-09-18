"use client";
import { useAccount, useChainId } from "wagmi";
import { writeContract, readContract } from "wagmi/actions";
import { getMilestoneAddress, MILESTONE_ABI_JSON } from "@/lib/milestoneContract";
import { explorerTx } from "@/lib/milestones";
import { config } from "@/lib/wagmi";

export function useMilestoneNFT() {
  const { address } = useAccount();
  const chainId = useChainId();

  async function hasBadge(tokenId: bigint): Promise<boolean> {
    if (!address) return false;
    const balance = await readContract(config, {
      address: getMilestoneAddress(chainId),
      abi: MILESTONE_ABI_JSON,
      functionName: "balanceOf",
      args: [address, tokenId],
      chainId: chainId as 44787 | 42220,
    }) as bigint;
    return balance > 0n;
  }

  async function claimBadge(tokenId: bigint): Promise<{ hash: `0x${string}`, url?: string }> {
    const hash = await writeContract(config, {
      address: getMilestoneAddress(chainId),
      abi: MILESTONE_ABI_JSON,
      functionName: "claim",
      args: [tokenId],
      chainId: chainId as 44787 | 42220,
    });
    return { hash, url: explorerTx(chainId, hash) };
  }

  return { hasBadge, claimBadge };
}

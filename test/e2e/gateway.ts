import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { projectEnv } from "./envs";

const GATEWAY_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "destinationChain",
        type: "string",
      },
      {
        internalType: "string",
        name: "destinationContractAddress",
        type: "string",
      },
      { internalType: "bytes", name: "payload", type: "bytes" },
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "callContract",
  },
] as const;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(projectEnv.RPC_URL),
});

async function execute() {
  const res = await publicClient.readContract({
    address: projectEnv.GATEWAY_CONTRACT_ADDRESS as `0x${string}`,
    abi: GATEWAY_ABI,
    functionName: "callContract",
    args: [
      "bitcoin-regtest",
      "0x24a1dB57Fa3ecAFcbaD91d6Ef068439acEeAe090",
      "0x00000000000000000000000024a1db57fa3ecafcbad91d6ef068439aceeae09000000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000000000000000000000000000000000006716a902",
    ],
  });
}

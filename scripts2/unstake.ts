import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { z } from "zod";

config();

const PROTOCOL_ABI = [
  {
    inputs: [
      { name: "_destinationChain", type: "string" },
      { name: "_destinationAddress", type: "string" },
      { name: "_amount", type: "uint256" },
      { name: "_psbtBase64", type: "string" },
    ],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const SBTC_CONTRACT_ADDRESS = "0xCf7790fB4ac7Ea948428E3635860944F1ef4F8D1";

const SBTC_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const ProjectEnvSchema = z.object({
  PRIVATE_KEY: z.string().min(10),
  RPC_URL: z.string().min(10),
  PROTOCOL_CONTRACT_ADDRESS: z.string().min(10),
});

const projectEnv = ProjectEnvSchema.parse({
  PRIVATE_KEY: process.env.SEPOLIA_PRIVATE_KEY,
  RPC_URL: process.env.SEPOLIA_RPC_URL,
  PROTOCOL_CONTRACT_ADDRESS: process.env.PROTOCOL_CONTRACT_ADDRESS,
});

async function main() {
  if (
    !projectEnv.PRIVATE_KEY ||
    !projectEnv.RPC_URL ||
    !projectEnv.PROTOCOL_CONTRACT_ADDRESS
  ) {
    throw new Error("Missing environment variables");
  }

  const account = privateKeyToAccount(
    `0x${projectEnv.PRIVATE_KEY}` as `0x${string}`
  );

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(projectEnv.RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(projectEnv.RPC_URL),
  });

  const destinationChain = "bitcoin-regtest"; // Replace with your destination chain
  const destinationAddress = "0x0000000000000000000000000000000000000000"; // Replace with your destination address
  const amount = BigInt(100000);
  const psbtBase64 =
    "cHNidP8BAFICAAAAAVrQluj7zrZI/RJ4h3pXKY5UQckb3hm1I7h+rwqUVXwJAAAAAAD9////AXImAAAAAAAAFgAUUNzsoVipyHLrQF1SKT01ERBXLJ4AAAAAAAEBKw8nAAAAAAAAIlEgkFj0s5tPU4QO+QWJFepTzvTiZxWVJMmxkN+zd/AYnZsBCP0qAQRAcLcPcAUzemcCvpzEo2FQK1NDQJ78/EHqIlXurFNBq4fau6zYbhnXnwPocabdeapr+WfBxW4PNsiXyI2lI4fVz0Dz1lfh+2lyuJkt+WBV0nKW/kGhhdNEhrd65rP82HzaMYVbeqxDCxU9vbQwN5EfzPbwEN47GINB3Fqmql4Rst6+RCAq4x6ocJrtqBlLo+L35+leaA6LZRNciYPAopjRe8U1Cq0gz13/V6FzxayDI8S6yj//ByjrcW858OWmAxIyDNKTWwysYcFQkpt0waBJVLeLS2A16XpeB4paDyjsltVHv+6azoA6wHiAUOedUwY3sr+WPseec56keJeLd7NiZJQ54gBFzctWbuUzR7zr5sTFLwsZS4rDpY/r4NGsZSJ8e0sUIO5JEcwAAA=="; // Replace with your PSBT

  try {
    const { request } = await publicClient.simulateContract({
      address: projectEnv.PROTOCOL_CONTRACT_ADDRESS as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "unstake",
      args: [destinationChain, destinationAddress, amount, psbtBase64],
      account,
    });

    const hash = await walletClient.writeContract(request);
    console.log("Transaction sent:", hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed:", receipt.transactionHash);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

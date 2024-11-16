import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { z } from "zod";
import PROTOCOL_ABI_JSON from "../out/Protocol.sol/Protocol.json";

config();

const PROTOCOL_ABI = PROTOCOL_ABI_JSON.abi;

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

  const destinationChain = "bitcoin-testnet"; // Replace with your destination chain
  const destinationAddress = "0x0000000000000000000000000000000000000000"; // Replace with your destination address
  const amount = BigInt(800000n);
  const psbtBase64 =
    "cHNidP8BAFICAAAAAflAdaiII1fkBTGGT8vk5a3YUWMTPqgFB/KD0IpN9O/aAAAAAAD9////AUTNCQAAAAAAFgAUUNzsoVipyHLrQF1SKT01ERBXLJ4AAAAAAAEBKwA1DAAAAAAAIlEgUiPouA919Arm/mld5UVulY4HFUe3CUvidmtDCJyUOHRBFCrjHqhwmu2oGUuj4vfn6V5oDotlE1yJg8CimNF7xTUKGqpwf1oaV/8WEF+uunL1V6iWOpitlLONjh+Oud3IvilAigKedJbMsXBGnVfvyJliChOV2nMigMLRCbE3JTlzcM7hfDUmQ/+FKyFjhMith7xoGO5Ol90n9mK37h1fqFqMm2IVwVCSm3TBoElUt4tLYDXpel4HiloPKOyW1Ue/7prOgDrAFuIuioNMBacc5AXCkPpmmlMAQJR7esmfH/PGLWmWX25mR0dHHl1WKnImL8iqD3X/VURzLq83wrCHDtY3AZcpEkUgKuMeqHCa7agZS6Pi9+fpXmgOi2UTXImDwKKY0XvFNQqtIPNYZ068zmiDKsMCuC7Hzk6c3Y+FZoTKPVRWhqJAvhXYrMAAAA=="; // Replace with your PSBT

  try {
    const simulationResult = await publicClient.simulateContract({
      address: projectEnv.PROTOCOL_CONTRACT_ADDRESS as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "unstake",
      args: [destinationChain, destinationAddress, amount, psbtBase64],
      account,
    });

    console.log("Simulation successful!");
    console.log("Simulated gas used:", simulationResult.request.gas);
    console.log("Simulation result:", simulationResult.result);

    // Uncomment the following lines if you want to see the full simulation details
    // console.log("Full simulation details:");
    // console.log(JSON.stringify(simulationResult, null, 2));

    // const hash = await walletClient.writeContract(request);
    // console.log("Transaction sent:", hash);

    // const receipt = await publicClient.waitForTransactionReceipt({ hash });
    // console.log("Transaction confirmed:", receipt.transactionHash);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

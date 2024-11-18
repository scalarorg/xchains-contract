import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { projectEnv } from "./envs";

config();

const PROTOCOL_ABI = [
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "commandId",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "sourceChain",
        type: "string",
        internalType: "string",
      },
      {
        name: "sourceAddress",
        type: "string",
        internalType: "string",
      },
      {
        name: "payload",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "error",
    name: "NotApprovedByGateway",
    inputs: [],
  },
] as const;

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

  try {
    console.log("Simulating contract call...");
    const { request } = await publicClient.simulateContract({
      address: projectEnv.PROTOCOL_CONTRACT_ADDRESS as `0x${string}`,
      abi: PROTOCOL_ABI,
      functionName: "execute",
      args: [
        "0x64433aa221004a222c1ff0b37cf2af59f4e89b87af3dcc368784f83c3b8de687",
        "bitcoin-regtest",
        "0x24a1dB57Fa3ecAFcbaD91d6Ef068439acEeAe090",
        "0x00000000000000000000000024a1db57fa3ecafcbad91d6ef068439aceeae09000000000000000000000000000000000000000000000000000000000000f4240000000000000000000000000000000000000000000000000000000006716a902",
      ],
      account,
    });

    console.log("Simulation successful. Sending transaction...");
    const hash = await walletClient.writeContract(request);
    console.log("Transaction sent:", hash);

    console.log("Waiting for transaction receipt...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed:", receipt.transactionHash);

    // Log more details about the transaction
    console.log("Transaction details:");
    console.log("  Gas used:", receipt.gasUsed.toString());
    console.log("  Status:", receipt.status);

    if (receipt.status === "reverted") {
      console.error(
        "Transaction reverted. Check contract logs for more details."
      );
      // Add additional error handling or logging here if needed
    }
  } catch (error) {
    console.error("Error details:");
    if (error instanceof Error) {
      console.error("  Message:", error.message);
      console.error("  Stack:", error.stack);
    }
    if (typeof error === "object" && error !== null) {
      console.error("  Full error object:", JSON.stringify(error, null, 2));
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

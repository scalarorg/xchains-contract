import { z } from "zod";

const ProjectEnvSchema = z.object({
  PRIVATE_KEY: z.string().min(10),
  RPC_URL: z.string().min(10),
  PROTOCOL_CONTRACT_ADDRESS: z.string().min(10),
  GATEWAY_CONTRACT_ADDRESS: z.string().min(10),
});

const projectEnv = ProjectEnvSchema.parse({
  PRIVATE_KEY: process.env.SEPOLIA_PRIVATE_KEY,
  RPC_URL: process.env.SEPOLIA_RPC_URL,
  PROTOCOL_CONTRACT_ADDRESS: process.env.PROTOCOL_CONTRACT_ADDRESS,
  GATEWAY_CONTRACT_ADDRESS: process.env.GATEWAY_CONTRACT_ADDRESS,
});

export { projectEnv };

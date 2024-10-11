import { z } from 'zod';


const ProjectENV = z.object ({
    local: z.object({
        rpcUrl: z.string().startsWith("http"),
        evmPrivateKey: z.string().length(64)
    }),
    sepolia: z.object({
        rpcUrl: z.string().startsWith("https"),
        evmPrivateKey: z.string().length(64)
    }),
})

export const Env = ProjectENV.parse({
    local: {
        rpcUrl: process.env.LOCAL_RPC_URL || "",
        evmPrivateKey: process.env.LOCAL_PRIVATE_KEY || "",
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL || "",
        evmPrivateKey: process.env.SEPOLIA_PRIVATE_KEY || "",
    }
})
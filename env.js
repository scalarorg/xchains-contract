module.exports = {
    runtimeChainsPath: process.env.RUNTIME_CHAINS_PATH,
    local: {
        rpcUrl: process.env.LOCAL_RPC_URL || "",
        privateKey: process.env.LOCAL_EVM_PRIVATE_KEY || "",
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL || "",
        privateKey: process.env.SEPOLIA_EVM_PRIVATE_KEY || "",
    }
}
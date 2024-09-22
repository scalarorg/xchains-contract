module.exports = {
    network: process.env.NETWORK||"ethereum-local",
    privateKeySigner: process.env.EVM_PRIVATE_KEY,
    runtimeChainsPath: process.env.RUNTIME_CHAINS_PATH,
    local: {
        rpcUrl: process.env.LOCAL_RPC_URL,
        evmPrivateKey: process.env.LOCAL_EVM_PRIVATE_KEY,
    },
    sepolia: {
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        evmPrivateKey: process.env.SEPOLIA_EVM_PRIVATE_KEY,
    }
}

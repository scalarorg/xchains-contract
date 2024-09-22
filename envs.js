module.exports = {
    network: process.env.NETWORK||"ethereum-local",
    privateKeySigner: process.env.EVM_PRIVATE_KEY,
    runtimeChainsPath: process.env.RUNTIME_CHAINS_PATH,
    rpcUrlLocal: process.env.RPC_URL_LOCAL,
    rpcUrlSepolia: process.env.RPC_URL_SEPOLIA,
}

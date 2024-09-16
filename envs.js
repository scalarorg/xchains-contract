module.exports = {
    network: process.env.NETWORK||"ethereum-local",
    privateKeySigner: process.env.EVM_PRIVATE_KEY,
    configPath: process.env.CONFIG_PATH,
    rpcUrlAnvil: process.env.RPC_URL_ANVIL,
    rpcUrlSepolia: process.env.RPC_URL_SEPOLIA,
}

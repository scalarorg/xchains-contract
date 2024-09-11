module.exports = {
    batchCommand: process.env.BATCH_COMMAND||"",
    privateKeySigner: process.env.EVM_PRIVATE_KEY,
    keyPathSepolia: process.env.KEY_PATH_SEPOLIA,
    keyPathBitcoin: process.env.KEY_PATH_BITCOIN,
    contractAddressAuthWeighted: process.env.CONTRACT_ADDRESS_AUTH_WEIGHTED,
    contractAddressGateway: process.env.CONTRACT_ADDRESS_GATEWAY,
    rpcUrlAnvil: process.env.RPC_URL_ANVIL,
    rpcUrlSepolia: process.env.RPC_URL_SEPOLIA,
}

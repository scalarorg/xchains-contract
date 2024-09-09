const path = require("path");
const yargs = require("yargs");
const { ethers } = require("hardhat");

async function main() {
    const argv = yargs
        .option('rpc', {
            alias: 'r',
            description: 'Rpc url',
            type: 'string',
            demandOption: true
        })
        .option('privateKey', {
            alias: 'p',
            description: 'Private Key',
            type: 'string',
            demandOption: true
        })
        .option('newSBTC', {
            alias: 's',
            description: 'Deploy new sBtc',
            type: 'bool',
            demandOption: true
        })
        .argv;
    const { rpc, privateKey, ...options } = argv;
    // console.log(rpc, privateKey, newSBTC);
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    await deployAll(wallet, provider, options)
}

async function deployAll(wallet, provider, options) {


    console.log("Account address:", await wallet.getAddress())
    console.log("Account balance:", (await wallet.getBalance()).toString());

    const savedAddr = {};

    const sBtc = options.newSBTC === 'true' ? await deploysBtc(savedAddr) : "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B";
    savedAddr["sBtc"] = sBtc;

    const axelarGateway = await deployAxelarGateway(savedAddr, wallet);
    console.log("--------------------------------------")


    await deployAxelarAuthWeighted(savedAddr, wallet);
    console.log("--------------------------------------")

    await deployMintContract(axelarGateway, sBtc, savedAddr, wallet)

    console.log("--------------------------------------")
    await deployBurnContract(axelarGateway, sBtc, savedAddr, wallet)


    saveAddr(savedAddr)
}

async function deploysBtc(wallet) {
    console.log("DEPLOYING SBTC")

    const SBTC = await ethers.getContractFactory("sBTC", wallet);
    const sBTC = await SBTC.deploy();

    await sBTC.deployed();
    console.log("sBTC deployed to:", await sBTC.address);
    return sBTC.address
}

async function deployAxelarGateway(savedAddr, wallet) {

    console.log("DEPLOYING AXELAR GATEWAY")
    const authModule = "0x410C9dF9802E084CAEcA48494f40Dd200AF5f962"; // TODO: update AxelarAuthWeighted address
    const tokenDeployer = "0xD2aDceFd0496449E3FDE873A2332B18A0F0FCADf";

    const AxelarGateway = await ethers.getContractFactory("AxelarGateway",wallet);
    const axelarGateway = await AxelarGateway.deploy(authModule, tokenDeployer);
    await axelarGateway.deployed();
    console.log("AxelarGateway deployed to:", axelarGateway.address);
    // console.log(await axelarGateway.contractId());


    // savedAddr["AxelarGateway"] = axelarGateway.address;
    return axelarGateway.address
}

async function deployAxelarAuthWeighted(savedAddr, wallet) {
    console.log("DEPLOYING AXELAR AUTH WEIGHTED")
    const newOperators = [
        "0x450Ef898237296Feb7A1F19ab41d4228fA55b8fd",
        "0x583990ACa884D8F20D1D252e3027a2B03344e195",
        "0xB002f8b7BC79E08E05FD0eB2A6449f3B4Da3E44B",
        "0xD905FdCb01E0BB98411933425498A6afb416D3f5",
    ];
    const newWeights = [
        ethers.BigNumber.from("10000"), // replace with actual weights
        ethers.BigNumber.from("40000"),
        ethers.BigNumber.from("30000"),
        ethers.BigNumber.from("20000"),
        // more weights as needed
    ];

    // Combine the operators and weights into an array of objects
    let combinedArray = newOperators.map((address, index) => {
        return {
            address: address,
            weight: newWeights[index],
        };
    });

    // Sort the combined array by address
    combinedArray.sort((a, b) => {
        if (a.address.toLowerCase() < b.address.toLowerCase()) return -1;
        if (a.address.toLowerCase() > b.address.toLowerCase()) return 1;
        return 0;
    });

    // Separate the sorted addresses and weights back into individual arrays
    const sortedOperators = combinedArray.map((item) => item.address);
    const sortedWeights = combinedArray.map((item) => item.weight);

    // Define the new threshold
    const newThreshold = ethers.BigNumber.from("60000"); // replace with actual threshold

    // Define the types of the data
    const types = ["address[]", "uint256[]", "uint256"];

    // Encode the data
    const encodedParams = ethers.utils.defaultAbiCoder.encode(types, [
        sortedOperators,
        sortedWeights,
        newThreshold,
    ]);

    console.log(encodedParams);

    // Deploy the AxelarAuthWeighted contract

    const AxelarAuthWeighted = await ethers.getContractFactory(
        "AxelarAuthWeighted", wallet
    );
    const axelarAuthWeighted = await AxelarAuthWeighted.deploy([encodedParams]);

    await axelarAuthWeighted.deployed();
    console.log("AxelarAuthWeighted deployed to:", axelarAuthWeighted.address);
    const currentEpoch = await axelarAuthWeighted.currentEpoch();
    console.log("Current epoch: ", currentEpoch);
    console.log(
        "Hash for epoch",
        await axelarAuthWeighted.hashForEpoch(currentEpoch)
    );
    savedAddr["AxelarAuthWeighted"] = axelarAuthWeighted.address;
    // return axelarAuthWeighted.address
}


async function deployMintContract(gatewayAddr, sBtcAddr, savedAddr, wallet) {
    console.log("DEPLOYING MINT CONTRACT")

    // const gatewayAddress = "0xd70943944567979d99800DD14b441B1D3A601A1D"; // TODO: Update this address
    const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    // const sbtcAddress = "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B";
    console.log("Gateway Addr:  ", gatewayAddr);
    console.log("sBtc Addr:     ", sBtcAddr);
    console.log("gasService Addr:", gasServiceAddress)
    const MintContract = await ethers.getContractFactory("MintContract", wallet);
    const mintContract = await MintContract.deploy(
        gatewayAddr,
        gasServiceAddress,
        sBtcAddr
    );
    await mintContract.deployed();
    console.log("mintContract address:", mintContract.address);
    console.log("sbtc address:", await mintContract.sbtc());

    savedAddr["MintContract"] = mintContract.address;
    savedAddr["GasService"] = gasServiceAddress;

}

async function deployBurnContract(gatewayAddr, sBtcAddr, savedAddr, wallet) {
    console.log("DEPLOYING BURN CONTRACT")
    // const gatewayAddress = "0xd70943944567979d99800DD14b441B1D3A601A1D"; // TODO: Update this address
    const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    // const sbtcAddress = "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B";

    const BurnContract = await ethers.getContractFactory("BurnContract", wallet);
    const burnContract = await BurnContract.deploy(
        gatewayAddr,
        gasServiceAddress,
        sBtcAddr
    );
    await burnContract.deployed();

    console.log("burnContract address:", burnContract.address);
    console.log("sbtc address:", await burnContract.sbtc());

    savedAddr["BurnContract"] = burnContract.address;
}

function saveAddr(savedAddr) {
    const fs = require("fs");
    const contractsDir = path.join(__dirname, "..", "abis", "all");
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }
    fs.writeFileSync(
        path.join(contractsDir, `contract-addresses.json`),
        JSON.stringify(savedAddr, undefined, 2)
    );
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
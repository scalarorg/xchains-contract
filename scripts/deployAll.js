const yargs = require("yargs");
const { ethers } = require("hardhat");
const { readChainConfig, saveChainData, createWallet, getContractByName } = require("./utils");

async function main() {
    const argv = yargs.command('deploy <target>', 'deploy contract choice: All, AxelarGateway, MintContract', (yargs) => {
        return yargs.positional('target', {
            describe: 'Target',
            type: 'string',
            default: 'All'
        })
            .option('network', {
                alias: 'n',
                description: 'network',
                type: 'string',
                demandOption: true
            })
            .option('privateKey', {
                alias: 'p',
                description: 'Private Key',
                type: 'string',
                demandOption: false
            })
            .option('newSbtc', {
                description: 'Deploy new sBtc',
                type: 'bool',
                default: false,
            })
            .option('newGateway', {
                description: 'Deploy new AxelarGateway',
                type: 'bool',
                default: false,
            })
            .option('newAuthWeighted', {
                description: 'Deploy new AuthWeighted',
                type: 'bool',
                default: false,
            })

    }).argv;
   
    // const { target, rpc, privateKey, ...options } = argv;
    // // console.log(rpc, privateKey, newSBTC);
    // const provider = new ethers.providers.JsonRpcProvider(rpc);
    // const wallet = new ethers.Wallet(privateKey, provider);

    const { wallet, options } = await setup(argv);
    console.log("Account address:", await wallet.getAddress())
    console.log("Account balance:", (await wallet.getBalance()).toString());
   
    switch (options.target) {
        case 'All':
            await deployAll(wallet, options);
            break;
        case "AxelarAuthWeighted":
            await deployAxlAuthAndSave(wallet, options);
            break;
        case 'AxelarGateway':
            await deployAxelarAndSave(wallet, options);
            break;
        case 'MintContract':
        case 'BurnContract':
            await deployMintBurnContractAndSave(wallet, options);
            break;

    }
}

async function setup(argv) {
    const { network, ...options } = argv;
    const chainConfig = readChainConfig(network)
    console.log(chainConfig)
    const wallet = createWallet(chainConfig);
    options.network = network;
    options.gateway = options.newGateway === false && chainConfig.gateway;
    options.authWeighted = options.newAuthWeighted === false && chainConfig.authWeighted;
    options.sbtc = options.newSbtc === false && chainConfig.sBtc;
    options.gasService = chainConfig.gasService;
    options.tokenDeployer = chainConfig.tokenDeployer;
    return { wallet, options }
}

async function deployAll(wallet, options) {
    const sBtc = await deploysBtc(wallet);
    
    const tokenDeployer = await deployTokenDeployer(wallet);
    const gasService = await deployAxelarGasService(wallet);

    const axelarWeighted = await deployAxelarAuthWeighted(wallet);
    console.log("--------------------------------------")

    const axelarGateway = await deployAxelarGateway(axelarWeighted, tokenDeployer, wallet);
    console.log("--------------------------------------")

    const mintContract = await deployMintContract(axelarGateway, gasService, sBtc, wallet)

    console.log("--------------------------------------")
    const burnContract = await deployBurnContract(axelarGateway, gasService, sBtc, wallet)
    
    console.log("---------- Transfer TokenConytract Ownership to Service contract ----------")
    const sBTCContract = await getContractByName("sBTC", sBtc, wallet);
    const txTransferOwnership = await sBTCContract.transferOwnership(mintContract, true, false);
    const txRes = await txTransferOwnership.wait();
    console.log(txRes);

    options["tokenDeployer"]= tokenDeployer;
    options["gasService"] = gasService;
    options["sbtc"] = sBtc;
    options["gateway"] = axelarGateway;
    options["authWeighted"] = axelarWeighted;
    options["mintContract"] = mintContract;
    options["burnContract"] = burnContract;
    saveAddr(options)

}

async function deployAxlAuthAndSave(wallet, options) {
    const axelarWeighted = await deployAxelarAuthWeighted(wallet);
    options["authWeighted"] = axelarWeighted;
    saveAddr(options)
}


async function deployAxelarAndSave(wallet, options) {


    const axelarWeighted = options.newAuthWeighted === true ? await deployAxelarAuthWeighted(wallet) : options.authWeighted;


    const gateway = await deployAxelarGateway(axelarWeighted, options.tokenDeployer, wallet);

    options["gateway"] = gateway;
    options["authWeighted"] = axelarWeighted;
    saveAddr(options)
}

async function deployMintBurnContractAndSave(wallet, options) {


    console.log("Account address:", await wallet.getAddress())
    console.log("Account balance:", (await wallet.getBalance()).toString());



    const sBtc = options.newSBTC === 'true' ? await deploysBtc(wallet) : options.sbtc;
    options["sbtc"] = sBtc;


    if (options.newGateway === 'true') {
        const axelarWeighted = await deployAxelarAuthWeighted(wallet);
        const axelarGateway = await deployAxelarGateway(axelarWeighted, options.tokenDeployer, wallet);

        options["gateway"] = axelarGateway;
        options["authWeighted"] = axelarWeighted;
        if (options.target === 'MintContract') {
            const mintContract = await deployMintContract(axelarGateway, options.gasService, sBtc, wallet);
            options["mintContract"] = mintContract
        } else {
            const burnContract = await deployBurnContract(axelarGateway, options.gasService, sBtc, wallet);
            options["burnContract"] = burnContract
        }
    } else {
        if (options.GatewayAddr == '') {
            console.error("Axelar Gateway Address empty")
            process.exit(1);
        }
        if (options.target === 'MintContract') {
            const mintContract = await deployMintContract(options.gateway, options.gasService, sBtc, wallet)
            options["mintContract"] = mintContract
        } else {
            const burnContract = await deployBurnContract(options.gateway, options.gasService, sBtc, wallet);
            options["burnContract"] = burnContract
        }


    }

    saveAddr(options)
}


async function deploysBtc(wallet) {
    console.log("DEPLOYING SBTC.........")

    const SBTC = await ethers.getContractFactory("sBTC", wallet);
    let contract = await SBTC.deploy();

    contract = await contract.deployed();
    console.log("sBTC deployed to:", contract.address);
    return contract.address
}

async function deployAxelarGateway(axelarWeighted, tokenDeployer, wallet) {

    console.log("DEPLOYING AXELAR GATEWAY..........")
    // const authModule = "0x410C9dF9802E084CAEcA48494f40Dd200AF5f962"; // TODO: update AxelarAuthWeighted address
    // const tokenDeployer = "0xD2aDceFd0496449E3FDE873A2332B18A0F0FCADf";

    const AxelarGateway = await ethers.getContractFactory("AxelarGateway", wallet);
    const axelarGateway = await AxelarGateway.deploy(axelarWeighted, tokenDeployer);
    await axelarGateway.deployed();
    console.log("AxelarGateway deployed to:", axelarGateway.address);

    return axelarGateway.address
}

async function deployAxelarAuthWeighted(wallet) {
    console.log("DEPLOYING AXELAR AUTH WEIGHTED...........")
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

    return axelarAuthWeighted.address
}


async function deployMintContract(gatewayAddr, gasService, sBtcAddr, wallet) {
    console.log("DEPLOYING MINT CONTRACT...........")

    // const gatewayAddress = "0xd70943944567979d99800DD14b441B1D3A601A1D"; // TODO: Update this address
    // const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    // const sbtcAddress = "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B";
    console.log("Gateway Addr:  ", gatewayAddr);
    console.log("sBtc Addr:     ", sBtcAddr);
    console.log("gasService Addr:", gasService)
    const MintContract = await ethers.getContractFactory("MintContract", wallet);
    let mintContract = await MintContract.deploy(
        gatewayAddr,
        gasService,
        sBtcAddr
    );
    mintContract = await mintContract.deployed();
    console.log("mintContract address:", mintContract.address);
    console.log("sbtc address:", await mintContract.sbtc());
    return mintContract.address;

}

async function deployBurnContract(gatewayAddr, gasService, sBtcAddr, wallet) {
    console.log("DEPLOYING BURN CONTRACT")
    // const gatewayAddress = "0xd70943944567979d99800DD14b441B1D3A601A1D"; // TODO: Update this address
    // const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    // const sbtcAddress = "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B";

    const BurnContract = await ethers.getContractFactory("BurnContract", wallet);
    const burnContract = await BurnContract.deploy(
        gatewayAddr,
        gasService,
        sBtcAddr
    );
    await burnContract.deployed();

    console.log("burnContract address:", burnContract.address);
    console.log("sbtc address:", await burnContract.sbtc());

    return burnContract.address
}

async function deployTokenDeployer(wallet) {
    console.log("Deploy Token Deployer .....")
    const TokenDeployerService = await ethers.getContractFactory("TokenDeployer", wallet);
    const tokenDeployerService = await TokenDeployerService.deploy();
    await tokenDeployerService.deployed();
    console.log("tokenDeployerService deployed to:", tokenDeployerService.address);
    return tokenDeployerService.address
}

async function deployAxelarGasService(wallet) {
    console.log("DDEPLOY AXELAR GAS SERVICE .....")
    const AxelarGasService = await ethers.getContractFactory("AxelarGasService");
    const axelarGasService = await AxelarGasService.deploy(wallet.getAddress());
    await axelarGasService.deployed();
    console.log("AxelarGateway deployed to:", axelarGasService.address);
    console.log(await axelarGasService.contractId());
    return axelarGasService.address
}

function saveAddr(data) {
    const savedAddr = {};
    savedAddr["tokenDeployer"] = data.tokenDeployer;
    savedAddr["gasService"] = data.gasService;
    savedAddr["gateway"] = data.gateway;
    savedAddr["authWeighted"] = data.authWeighted;
    savedAddr["sBtc"] = data.sbtc;
    savedAddr["gasService"] = data.gasService;
    savedAddr["tokenDeployer"] = data.tokenDeployer;
    savedAddr["mintContract"] = data.mintContract != undefined && data.mintContract;
    savedAddr["burnContract"] = data.burnContract != undefined && data.burnContract;
    
    console.log(savedAddr["tokenDeployer"])
    saveChainData(data.network, savedAddr, "addresses.json")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
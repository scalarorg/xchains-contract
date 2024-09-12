// Remember to change MintContract address at 2 places in the script.

const { ethers } = require("hardhat");
const path = require("path");
const { setTimeout } = require("timers/promises");
const envs = require("../envs.js");
async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Signer account:", await deployer.getAddress());
    console.log("Account balance:", (await deployer.getBalance()).toString());


    const axlContractName = "AxelarGateway";
    const axlContractArtifact = require(`../artifacts/contracts/axelar/${axlContractName}.sol/${axlContractName}.json`);
    const axlContractABI = axlContractArtifact.abi;
    const axlContract = new ethers.Contract(
        "0xda8367783782EC92BaDae3e534a9FCcb3fa6eF1C",
        axlContractABI,
        deployer
    );




    const txExecuteCall = await axlContract.execute(envs.batchCommand,{
        gasLimit: 1000000 
    });
    console.log("Transaction hash:", txExecuteCall.hash);
    await txExecuteCall.wait();
    console.log("Transaction hash:", txExecuteCall.hash);
    await txExecuteCall.wait();

}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

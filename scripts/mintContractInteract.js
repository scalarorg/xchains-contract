// Remember to change MintContract address at 2 places in the script.

const { ethers } = require("hardhat");
const path = require("path");
const { setTimeout } = require("timers/promises");
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "MintContract";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const mintContract = new ethers.Contract(
    "0x06a7bC868068f75eae0753981d748518AD604a62", // TODO
    contractABI,
    deployer
  );
  const axlContractName = "AxelarGateway";
  const axlContractArtifact = require(`../artifacts/contracts/axelar/${axlContractName}.sol/${axlContractName}.json`);
  const axlContractABI = axlContractArtifact.abi;
  const axlContract = new ethers.Contract(
    "0x70b9E1B98fb9cDd0221778c1E4d72e7a386D9CCe",
    axlContractABI,
    deployer
  );
  const sbtcContractName = "sBTC";
  const sbtcContractArtifact = require(`../artifacts/contracts/${sbtcContractName}.sol/${sbtcContractName}.json`);
  const sbtcContractABI = sbtcContractArtifact.abi;
  const sbtcContract = new ethers.Contract(
    "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B",
    sbtcContractABI,
    deployer
  );

  const {
    params,
    commandId,
    sourceChain,
    sourceAddress,
    payloadHash,
    payloadBytes,
  } = prepareTxParams();

  // ApproveContractCall
  const txApproveContractCall = await axlContract.approveContractCall(
    params,
    commandId
  );
  console.log("Transaction hash:", txApproveContractCall.hash);
  await txApproveContractCall.wait();

  // Check if the contract call is approved
  const validateResult = await axlContract.isContractCallApproved(
    commandId,
    sourceChain,
    sourceAddress,
    mintContract.address,
    payloadHash
  );
  console.log("Validation result:", validateResult);

  try {
    console.log("Prepare payload bytes:", payloadBytes);
    console.log("Prepare payload hash:", payloadHash);

    // Call execute function
    console.log(
      "Balance before execute:",
      await sbtcContract.balanceOf(deployer.address)
    );
    const txExecute = await mintContract.execute(
      commandId,
      sourceChain,
      sourceAddress,
      payloadBytes,
      {
        gasLimit: 2000000,
      }
    );
    console.log("Transaction hash:", txExecute.hash);

    // Wait for transaction confirmation
    await txExecute.wait();
    console.log("Transaction confirmed");

    // Log message after execute
    console.log(
      "Balance after execute:",
      await sbtcContract.balanceOf(deployer.address)
    );
  } catch (error) {
    console.error("Error executing transaction:", error);
  }
}

function prepareTxParams() {
  const sourceChain = "Bitcoin";
  const sourceAddress = "0xBitcoinSourceAddress";
  const contractAddress = "0x06a7bC868068f75eae0753981d748518AD604a62"; // TODO
  const payloadBytes = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256"],
    [
      "0x130C4810D57140e1E62967cBF742CaEaE91b6ecE",
      ethers.utils.parseUnits("1", 18),
    ]
  );
  const payloadHash = ethers.utils.keccak256(payloadBytes);
  const sourceTxHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("0xBitcoinSourceTxHash")
  );
  const sourceEventIndex = 1; // Example value, use the actual event index
  const params = ethers.utils.defaultAbiCoder.encode(
    ["string", "string", "address", "bytes32", "bytes32", "uint256"],
    [
      sourceChain,
      sourceAddress,
      contractAddress,
      payloadHash,
      sourceTxHash,
      sourceEventIndex,
    ]
  );
  // Define the commandId

  const commandId = ethers.utils.randomBytes(32);
  return {
    params,
    commandId,
    sourceChain,
    sourceAddress,
    payloadHash,
    payloadBytes,
  };
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

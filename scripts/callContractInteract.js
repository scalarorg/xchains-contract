const { ethers } = require("hardhat");
const path = require("path");
async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "CallContract";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const callContract = new ethers.Contract(
    "0xefD9094E9260793Fb970543b19dFe95F5D12Eec9",
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

  const { params, commandId, sourceChain, sourceAddress, payloadHash } =
    prepareTxParams();

  // ApproveContractCall
  const txApproveContractCall = await axlContract.approveContractCall(
    params,
    commandId
  );
  console.log("Transaction hash:", txApproveContractCall.hash);
  await txApproveContractCall.wait();
  console.log("Transaction confirmed");
  // Check if the contract call is approved
  const validateResult = await axlContract.isContractCallApproved(
    commandId,
    sourceChain,
    sourceAddress,
    callContract.address,
    payloadHash
  );
  console.log("Validation result:", validateResult);
}
// function saveFrontendFiles(contracts) {
//   const fs = require("fs");
//   const contractsDir = path.join(
//     __dirname,
//     "..",
//     "frontend",
//     "src",
//     "abis",
//     "axelar"
//   );

//   if (!fs.existsSync(contractsDir)) {
//     fs.mkdirSync(contractsDir);
//   }

//   let contractAddresses = {};

//   contracts.forEach((contract) => {
//     // Save each contract's address
//     contractAddresses[contract.name] = contract.address;

//     // Save each contract's artifact
//     const ContractArtifact = artifacts.readArtifactSync(contract.name);
//     fs.writeFileSync(
//       path.join(contractsDir, `${contract.name}.json`),
//       JSON.stringify(ContractArtifact, null, 2)
//     );
//   });

//   // Save all contract addresses in a single file
//   fs.writeFileSync(
//     path.join(contractsDir, "contract-addresses.json"),
//     JSON.stringify(contractAddresses, undefined, 2)
//   );
// }
function prepareTxParams() {
  const sourceChain = "Bitcoin";
  const sourceAddress = "0xBitcoinSourceAddress";
  const contractAddress = "0xefD9094E9260793Fb970543b19dFe95F5D12Eec9";
  const payloadHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("Hello dascy")
  );
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
  return { params, commandId, sourceChain, sourceAddress, payloadHash };
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

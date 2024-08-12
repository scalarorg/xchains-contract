const { ethers } = require("hardhat");
const path = require("path");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the AxelarGateway contract

  const axlContractName = "AxelarGateway";
  const axlContractArtifact = require(`../artifacts/contracts/axelar/${axlContractName}.sol/${axlContractName}.json`);
  const axlContractABI = axlContractArtifact.abi;
  const axlContract = new ethers.Contract(
    "0xBC9ee019Ccac5677f60d4e3c0F7c774e9cD6932B", //TODO
    axlContractABI,
    deployer
  );
  const contractName = "AxelarAuthWeighted";
  const contractArtifact = require(`../artifacts/contracts/axelar/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const axelarAuthWeightedContract = new ethers.Contract(
    "0x71b7B290B14D7A8EB8071e35e3457b192b4a7fB6", // TODO
    contractABI,
    deployer
  );

  const executeABI = [
    "function execute(bytes calldata input) external override",
  ];
  const executeInterface = new ethers.utils.Interface(executeABI);
  const executeObject =
    "0x09c5eabe000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000149d764364c220922bb6760b55a8939e4581660fdd60217ac4ed98123f24c44e9000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000013617070726f7665436f6e747261637443616c6c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000e432150cce91c13a887f7d836923d5597add8e313265386365336433346433643137356536616639326530336463356161653537c6c98272230fc33e1b388fbb9eb7c4af0245bee820897886a75bcb1a05c817900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000857626974636f696e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a3078333336333631333436343331333936333332333236313335363336363330363533313332363233320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000003a1f5fe00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000fd1fa8b655b2183982c8e7e8b6c1492a267f5cca00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000005a7936900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004122fb6db9f464df30b3097437bebc0a005ea6b63f3194c121eda582428405e49447793fbc1eb1089a6d4a31b7494162f9d2b21d7df213ee5cac33c3212a49778b1b00000000000000000000000000000000000000000000000000000000000000";
  const decodedData = executeInterface.decodeFunctionData(
    "execute",
    executeObject
  );
  const input = decodedData.input;
  const inputDecoded = ethers.utils.defaultAbiCoder.decode(
    ["bytes", "bytes"],
    input
  );
  const [data, proof] = inputDecoded;
  console.log("==================================================");
  console.log("Data part:");
  const dataDecoded = ethers.utils.defaultAbiCoder.decode(
    ["uint256", "bytes32[]", "string[]", "bytes[]"],
    data
  );
  const [chainId, commandIds, commands, params] = dataDecoded;
  console.log("Chain ID:", chainId);
  console.log("Command IDs:", commandIds);
  console.log("Commands:", commands);
  console.log("Params:", params);
  console.log("==================================================");
  console.log("Proof part:");
  const proofDecoded = ethers.utils.defaultAbiCoder.decode(
    ["address[]", "uint256[]", "uint256", "bytes[]"],
    proof
  );
  const [operators, weights, threshold, signatures] = proofDecoded;
  console.log("Operators:", operators);
  console.log("Weights:", weights);
  console.log("Threshold:", threshold);
  console.log("Signatures:", signatures);
  
  console.log("==================================================");
  console.log("Compare data:");
  const operatorsHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "uint256"],
      [operators, weights, threshold]
    )
  );
  console.log("Operators hash:", operatorsHash);
  const epochForHash = await axelarAuthWeightedContract.epochForHash(
    operatorsHash
  );
  console.log("Epoch for this hash:", epochForHash.toString());
  const currentEpoch = await axelarAuthWeightedContract.currentEpoch();
  console.log(
    "Current Hash:",
    await axelarAuthWeightedContract.hashForEpoch(currentEpoch)
  );
  console.log("Current Epoch:", currentEpoch.toString());
    console.log("==================================================");
  console.log("Verify Signature:");
  const dataHash = ethers.utils.keccak256(data);

  // Convert the hashed data to an Ethereum signed message hash
  const ethSignedMessageHash = ethers.utils.hashMessage(ethers.utils.arrayify(dataHash));
  const signerAddress = ethers.utils.recoverAddress(ethSignedMessageHash, signatures[0]);
  console.log("Signer Address:", signerAddress);
  console.log("==================================================");
  console.log("Check approve:");
  const paramsDecoded = ethers.utils.defaultAbiCoder.decode(
    ["string", "string", "address", "bytes32", "bytes32", "uint256"],
    params[0]
  );
  const [sourceChain, sourceAddress, contractAddress, payloadHash, sourceTxHash, sourceEventIndex] = paramsDecoded;
  console.log("Source Chain:", sourceChain);
  console.log("Source Address:", sourceAddress);
  console.log("Contract Address:", contractAddress);
  console.log("Payload Hash:", payloadHash);
  console.log("Source Tx Hash:", sourceTxHash);
  console.log("Source Event Index:", sourceEventIndex.toString());
  // console.log(await axlContract.isCommandExecuted("0x54c016d0256792525b6bfddecc27ff98fe86a9e762ed66a1f42f05778c4bfefe"));
  // console.log("Execute:");
  // const txExecute = await axlContract.execute(input);
  // await txExecute.wait();
  // console.log("Tx Hash:", txExecute.hash);
  // const txCheckExecuted = await axlContract.isCommandExecuted("0x54c016d0256792525b6bfddecc27ff98fe86a9e762ed66a1f42f05778c4bfefe");
  // console.log("Check Executed:", txCheckExecuted);
  const checkHash = ethers.utils.keccak256("0x000000007B7D");
  console.log("Check Hash:", checkHash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

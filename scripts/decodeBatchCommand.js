// This script is used to decode neccessary data from the Batch Commands sending from Axelar.
// Paste the content of Batch Command to the executeObject variable.

const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

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
    "0x09c5eabe000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000000140b96a2ef7e6b51d39a772959b38077d37eed403ba1309de9d3c4e21f417712d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000013617070726f7665436f6e747261637443616c6c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000768e8de8cf0c7747d41f75f83c914a19c5921cf3169fa48cdcaf12bcb6dcdf2237dfa6e97a0fa17ec31f3a56225b22e9920c16bb7b8ecac43a559564282e06609494e48432459bf3280f6e8f7677c34ffcf9882a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000857626974636f696e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a30783436396630613634643545644536344663614631363139353236353741414634303539303430646500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000ea6000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000040000000000000000000000004ea615250124913e99f280bce5f01f81b8eb4dc30000000000000000000000006cf0782894cbaeed9b073a8b62da3efa61a998880000000000000000000000007884a383096988accb59cc110ce557491f268bfd000000000000000000000000ac1f760be9cd6ec88959da8453f4f17258bb3570000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000009c4000000000000000000000000000000000000000000000000000000000000075300000000000000000000000000000000000000000000000000000000000004e200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000004171fe92ff0e04ab0af72c709950491ed3eca80d0e0099ae072af8bad21112e592540caa0e64bb28b5012f3aa09d450337801b47f2072376eed1a05c2b7ce888671b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041ba362b560a02dcecaf0081f70c82205fd6c9dbc74f19f7d2392183b4d1a10c5c3e4037ce030a5058f7e1e62d1d0757511d3dcbd8bf98f5102246b2d49f5ccb701b00000000000000000000000000000000000000000000000000000000000000";
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
  const ethSignedMessageHash = ethers.utils.hashMessage(
    ethers.utils.arrayify(dataHash)
  );
  signatures.map((signature, index) => {
    const signerAddress = ethers.utils.recoverAddress(
      ethSignedMessageHash,
      signature
    );
    console.log("Signer Address", index, ":", signerAddress);
  });
  console.log("==================================================");
  console.log("Check approve:");
  const paramsDecoded = ethers.utils.defaultAbiCoder.decode(
    ["string", "string", "address", "bytes32", "bytes32", "uint256"],
    params[0]
  );
  const [
    sourceChain,
    sourceAddress,
    contractAddress,
    payloadHash,
    sourceTxHash,
    sourceEventIndex,
  ] = paramsDecoded;
  console.log("Source Chain:", sourceChain);
  console.log("Source Address:", sourceAddress);
  console.log("Contract Address:", contractAddress);
  console.log("Payload Hash:", payloadHash);
  console.log("Source Tx Hash:", sourceTxHash);
  console.log("Source Event Index:", sourceEventIndex.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

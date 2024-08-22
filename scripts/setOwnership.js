// set ownership for mintContract
const path = require("path");
async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "sBTC";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const sbtc = new ethers.Contract(
    "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B",
    contractABI,
    deployer
  );

  console.log("sbtc address:", sbtc.address);
  console.log("sbtc total supply:", await sbtc.totalSupply());

  const mintContractName = "MintContract";
  const mintContractArtifact = require(`../artifacts/contracts/${mintContractName}.sol/${mintContractName}.json`);
  const mintContractABI = mintContractArtifact.abi;
  const mintContract = new ethers.Contract(
    "0x3AE131F593C603c152f419f954C49f8A742bEC8c", // TODO: Update this address to old mintContract address
    mintContractABI,
    deployer
  );

  console.log("mintContract address:", mintContract.address);
  console.log("sbtc owner:", await sbtc.owner());
  const txTransferOwnership = await mintContract.transferMintOwnership(
    "0x768E8De8cf0c7747D41f75F83C914a19C5921Cf3" // TODO: Update this address to new mintContract address
  );
  await txTransferOwnership.wait();
  console.log("sbtc owner:", await sbtc.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

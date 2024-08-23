const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "MintContract";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const mintContract = new ethers.Contract(
    "0x768E8De8cf0c7747D41f75F83C914a19C5921Cf3", // TODO: update MintContract address
    contractABI,
    deployer
  );

  const destinationChain = "ethereum-sepolia";
  const destinationAddress = "0x768E8De8cf0c7747D41f75F83C914a19C5921Cf3"; // TODO
  const to = "0x130C4810D57140e1E62967cBF742CaEaE91b6ecE";
  const amount = ethers.utils.parseUnits("1", 18);

  try {
    // Call Mint
    console.log("gateway address:", await mintContract.gateway());
    // const txCallMint = await mintContract.callMint(
    //   destinationChain,
    //   destinationAddress,
    //   to,
    //   amount,
    //   {
    //     value: ethers.utils.parseEther("0.00005"),
    //   }
    // );
    // console.log("Mint transaction hash:", txCallMint.hash);
    // await txCallMint.wait();
    // console.log("Mint transaction confirmed");
  } catch (error) {
    console.error("Error executing transaction:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

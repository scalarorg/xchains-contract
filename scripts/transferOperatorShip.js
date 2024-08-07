const { ethers } = require("hardhat");
const path = require("path");
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "AxelarAuthWeighted";
  const contractArtifact = require(`../artifacts/contracts/axelar/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const axelarAuthWeightedContract = new ethers.Contract(
    "0x71b7B290B14D7A8EB8071e35e3457b192b4a7fB6", // TODO
    contractABI,
    deployer
  );
  const currentEpoch = await axelarAuthWeightedContract.currentEpoch();
  console.log("Current Epoch:", currentEpoch.toString());
  console.log(
    "Current Hash:",
    await axelarAuthWeightedContract.hashForEpoch(currentEpoch)
  );
  try {
    // TODO: Prepare params
    const jsonData = {
      validators: [
        {
          address: "A4248F304578CA0ABD767E21F34148BFE61FBBC5",
          pub_key: {
            type: "tendermint/PubKeyEd25519",
            value: "PNs3Eh+Lv9ZZoLc2xBGrM92IIIN5oihfyvZl6l4B1cc=",
          },
          power: "9000000000000000",
          name: "",
        },
        {
          address: "D1F90D9A029AD2AE9C7565A7D95A1DC9D4C10A25",
          pub_key: {
            type: "tendermint/PubKeyEd25519",
            value: "5bEaWr9z2m1m3vUOhhieyiN1slEBdoMOKDJFqoPoPVo=",
          },
          power: "5000000000000",
          name: "",
        },
        {
          address: "F9E2BAE1492C290C07E5412DF320B3EBDEB433B2",
          pub_key: {
            type: "tendermint/PubKeyEd25519",
            value: "fcnUoKrW8pp4lOIHMFeczytcgPhRhsVh9jrrvwx3jMc=",
          },
          power: "5000000000000",
          name: "",
        },
        {
          address: "E116A851C52D1C9B14A76028D60B31BD1FF23A4D",
          pub_key: {
            type: "tendermint/PubKeyEd25519",
            value: "zVxRtKI6vRaCWv2IRbCtzms25iYWXP6YuBRTLHqVHBg=",
          },
          power: "5000000000000",
          name: "",
        },
      ],
    };

    // Extracting addresses and powers
    const newOperators = jsonData.validators.map(
      (validator) => `0x${validator.address}`
    );
    const newWeights = jsonData.validators.map((validator) =>
      ethers.BigNumber.from(validator.power)
    );

    console.log(newOperators);
    console.log(newWeights);

    let combinedArray = newOperators.map((address, index) => {
      return {
        address: address,
        weight: newWeights[index],
      };
    });
    combinedArray.sort((a, b) => {
      if (a.address.toLowerCase() < b.address.toLowerCase()) return -1;
      if (a.address.toLowerCase() > b.address.toLowerCase()) return 1;
      return 0;
    });
    const sortedOperators = combinedArray.map((item) => item.address);
    const sortedWeights = combinedArray.map((item) => item.weight);
    const newThreshold = ethers.BigNumber.from("1300000000000000");
    const types = ["address[]", "uint256[]", "uint256"];
    const encodedParams = ethers.utils.defaultAbiCoder.encode(types, [
      sortedOperators,
      sortedWeights,
      newThreshold,
    ]);

    // Call Transfer Operatorship
    const txTransferOpShip =
      await axelarAuthWeightedContract.transferOperatorship(encodedParams);
    console.log("Transaction hash:", txTransferOpShip.hash);
    await txTransferOpShip.wait();
    console.log("Transaction confirmed");
    newEpoch = await axelarAuthWeightedContract.currentEpoch();
    console.log("New Epoch:", newEpoch.toString());
    console.log(
      "New Hash:",
      await axelarAuthWeightedContract.hashForEpoch(newEpoch)
    );
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

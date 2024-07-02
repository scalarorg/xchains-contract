"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnect from "../components/WalletConnect";

// Import ABIs and contract addresses
import scalarTokenJSON from "../abis/ScalarToken.json";
import degenBoxJSON from "../abis/DegenBox.json";
import wethJSON from "../abis/WETH.json";
import cauldronV4JSON from "../abis/CauldronV4.json";
import oracleProxyJSON from "../abis/ProxyOracle.json";
import contractAddresses from "../abis/contract-addresses.json";

const scalarTokenABI = scalarTokenJSON.abi;
const degenBoxABI = degenBoxJSON.abi;
const wethABI = wethJSON.abi;
const cauldronV4ABI = cauldronV4JSON.abi;
const oracleProxyABI = oracleProxyJSON.abi;

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [signerAddress, setSignerAddress] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);

  const [scalarToken, setScalarToken] = useState(null);
  const [degenBox, setDegenBox] = useState(null);
  const [weth, setWeth] = useState(null);
  const [cauldronV4, setCauldronV4] = useState(null);
  const [oracleProxy, setOracleProxy] = useState(null);
  const [wethMarket, setWethMarket] = useState(null);

  const [depositAmount, setDepositAmount] = useState("1");
  const [percentBorrow, setPercentBorrow] = useState(50);

  const scalarTokenAddress = contractAddresses.ScalarToken;
  const degenBoxAddress = contractAddresses.DegenBox;
  const wethAddress = contractAddresses.WETH;
  const cauldronV4Address = contractAddresses.CauldronV4;
  const oracleProxyAddress = contractAddresses.ProxyOracle;
  const wethMarketAddress = contractAddresses.WETHMarket;

  useEffect(() => {
    if (provider && signer) {
      // Initialize contracts
      const scalarToken = new ethers.Contract(
        scalarTokenAddress,
        scalarTokenABI,
        signer
      );
      const degenBox = new ethers.Contract(
        degenBoxAddress,
        degenBoxABI,
        signer
      );
      const weth = new ethers.Contract(wethAddress, wethABI, signer);
      const cauldronV4 = new ethers.Contract(
        cauldronV4Address,
        cauldronV4ABI,
        signer
      );
      const oracleProxy = new ethers.Contract(
        oracleProxyAddress,
        oracleProxyABI,
        signer
      );
      const wethMarket = new ethers.Contract(
        wethMarketAddress,
        cauldronV4ABI,
        signer
      );
      // Save contracts to state if needed
      setScalarToken(scalarToken);
      setDegenBox(degenBox);
      setWeth(weth);
      setCauldronV4(cauldronV4);
      setOracleProxy(oracleProxy);
      setWethMarket(wethMarket);
    }
  }, [provider, signer]);

  const depositAndBorrow = async (depositAmount, percentBorrow) => {
    try {
      // Set masterContract approval
      const txApproval = await degenBox.setMasterContractApproval(
        signerAddress,
        cauldronV4Address,
        true,
        0,
        ethers.ZeroHash,
        ethers.ZeroHash
      );
      await txApproval.wait();

      const _depositAmount = ethers.parseEther(depositAmount);
      const _percentBorrow = percentBorrow;
      const etherAddress = ethers.ZeroAddress;
      const txDeposit = await degenBox.deposit(
        etherAddress,
        signerAddress,
        signerAddress,
        _depositAmount,
        0,
        {
          value: depositAmount,
        }
      );
      const txDepositReceipt = await txDeposit.wait();
    } catch (error) {
      console.error("Error in depositAndBorrow:", error);
    }
  };
  const fetchMarketInfo = async () => {
    const oracleDataTemp = await wethMarket.oracleData();
    const oracleRate = await oracleProxy.peekSpot(oracleDataTemp);
    console.log("Oracle rate: ", oracleRate);

    setExchangeRate(oracleRate.toString());
  };

  return (
    <div>
      <h1>DeFi App</h1>
      <WalletConnect
        setProvider={setProvider}
        setSigner={setSigner}
        setSignerAddress={setSignerAddress}
      />
      {provider && (
        <>
          <button
            onClick={() => depositAndBorrow(depositAmount, percentBorrow)}
          >
            Deposit & Borrow
          </button>
          <button onClick={fetchMarketInfo}>Fetch Market Info</button>
        </>
      )}
      <h1>Signer address: {signerAddress}</h1>
      <p>Exchange rate: {exchangeRate}</p>
    </div>
  );
}

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
  const [exchangeRateForUI, setExchangeRateForUI] = useState(null);
  const [stkBalance, setStkBalance] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [calculatedBorrowAmount, setCalculatedBorrowAmount] = useState(null);
  const [userBorrowPart, setUserBorrowPart] = useState(null);
  const [userCollateralShare, setUserCollateralShare] = useState(null);
  const [totalBorrow, setTotalBorrow] = useState(null);
  const [totalCollateralShare, setTotalCollateralShare] = useState(null);
  const [scalarToken, setScalarToken] = useState(null);
  const [degenBox, setDegenBox] = useState(null);
  const [weth, setWeth] = useState(null);
  const [cauldronV4, setCauldronV4] = useState(null);
  const [oracleProxy, setOracleProxy] = useState(null);
  const [wethMarket, setWethMarket] = useState(null);

  const [depositAmount, setDepositAmount] = useState(null);
  const [percentBorrow, setPercentBorrow] = useState(null);

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

      // Fetch balances
      const fetchBalances = async () => {
        const stkBalance = ethers.formatUnits(
          await scalarToken.balanceOf(signerAddress),
          8
        );
        const ethBalance = ethers.formatEther(
          await provider.getBalance(signerAddress)
        );
        setStkBalance(stkBalance);
        setEthBalance(ethBalance);
      };
      // Fetch market info
      const fetchMarketInfo = async () => {
        const oracleDataTemp = await wethMarket.oracleData();
        const oracleRate = await oracleProxy.peekSpot(oracleDataTemp);
        const oracleRateForUI = ethers.formatUnits(
          (await oracleProxy.peekSpot(oracleDataTemp)).toString(),
          8
        );
        console.log("Oracle rate: ", oracleRate);
        setExchangeRate(oracleRate);
        setExchangeRateForUI(oracleRateForUI);
      };

      fetchBalances();
      fetchMarketInfo();
    }
  }, [provider, signer]);

  const depositAndBorrow = async (depositAmount, percentBorrow) => {
    try {
      // Set masterContract approval
      console.log(
        "Master contract approval before",
        await degenBox.masterContractApproved(signerAddress, cauldronV4Address)
      );
      const approvalEvent = new Promise((resolve, reject) => {
        degenBox.on(
          "LogSetMasterContractApproval",
          (masterContract, user, approved, event) => {
            console.log("LogSetMasterContractApproval:", approved);
            resolve();
          }
        );
      });
      const txApproval = await degenBox.setMasterContractApproval(
        signerAddress,
        cauldronV4Address,
        true,
        0,
        ethers.ZeroHash,
        ethers.ZeroHash
      );
      await txApproval.wait();
      await approvalEvent;
      console.log("Master contract approval set");
      setEthBalance(
        ethers.formatEther(await provider.getBalance(signerAddress))
      );
      console.log(
        await degenBox.masterContractApproved(cauldronV4Address, signerAddress)
      );

      // Deposit process
      let shareAmount;
      const depositEvent = new Promise((resolve, reject) => {
        degenBox.on("LogDeposit", (token, from, to, amount, share, event) => {
          console.log("Log amount:", amount);
          shareAmount = amount;
          resolve();
        });
      });
      const _depositAmount = ethers.parseEther(depositAmount);
      const _percentBorrow = BigInt(percentBorrow);
      const etherAddress = ethers.ZeroAddress;
      const txDeposit = await degenBox.deposit(
        etherAddress,
        signerAddress,
        signerAddress,
        _depositAmount,
        0,
        {
          value: _depositAmount,
        }
      );
      await txDeposit.wait();
      await depositEvent;
      console.log("Deposit successful");
      setEthBalance(
        ethers.formatEther(await provider.getBalance(signerAddress))
      );
      console.log(
        "BalanceOf(weth, client) before addCollateral:",
        await degenBox.balanceOf(wethAddress, signerAddress)
      );
      console.log("shareAmount: ", shareAmount);

      // Add collateral process
      const addCollateralEvent = new Promise((resolve, reject) => {
        wethMarket.on("LogAddCollateral", (from, to, share, event) => {
          console.log("Log addCollateral amount:", share);
          resolve();
        });
      });
      const txAddCollateral = await wethMarket.addCollateral(
        signerAddress,
        false,
        shareAmount
      );
      await txAddCollateral.wait();
      await addCollateralEvent;
      console.log("Add collateral successful");
      console.log(
        "BalanceOf(weth, client) after addCollateral:",
        await degenBox.balanceOf(wethAddress, signerAddress)
      );
      setEthBalance(
        ethers.formatEther(await provider.getBalance(signerAddress))
      );
      // Borrow process
      console.log(
        "BalanceOf(stk, client) before borrow:",
        await degenBox.balanceOf(scalarTokenAddress, signerAddress)
      );
      const borrowEvent = new Promise((resolve, reject) => {
        wethMarket.on("LogBorrow", (from, to, amount, part, event) => {
          console.log("Log total borrow amount:", amount);
          resolve();
        });
      });
      const amountOut = (_depositAmount * BigInt(exchangeRate)) / BigInt(1e18);
      const borrowAmount = (amountOut * _percentBorrow) / 100n;
      const txBorrow = await wethMarket.borrow(signerAddress, borrowAmount);
      await txBorrow.wait();
      await borrowEvent;
      console.log("Borrow successful");
      setEthBalance(
        ethers.formatEther(await provider.getBalance(signerAddress))
      );
      console.log(
        "BalanceOf(stk, client) after borrow:",
        await degenBox.balanceOf(scalarTokenAddress, signerAddress)
      );

      // Withdraw process
      console.log(
        "Client STK balance before withdraw:",
        await scalarToken.balanceOf(signerAddress)
      );
      const withdrawEvent = new Promise((resolve, reject) => {
        degenBox.on("LogWithdraw", (token, from, to, amount, share, event) => {
          console.log("Log withdraw amount:", amount);
          resolve();
        });
      });
      const txWithdraw = await degenBox.withdraw(
        scalarTokenAddress,
        signerAddress,
        signerAddress,
        borrowAmount,
        0
      );
      await txWithdraw.wait();
      await withdrawEvent;
      console.log("Withdraw successful");
      setEthBalance(
        ethers.formatEther(await provider.getBalance(signerAddress))
      );
      setStkBalance(
        ethers.formatUnits(await scalarToken.balanceOf(signerAddress), 8)
      );
      console.log(
        "Client STK balance after withdraw:",
        await scalarToken.balanceOf(signerAddress)
      );
    } catch (error) {
      console.error("Error in depositAndBorrow:", error);
    }
  };
  const handlePercentBorrowChange = (e) => {
    const value = e.target.value;
    setPercentBorrow(value);
    if (depositAmount && exchangeRate) {
      const calculatedAmount =
        (exchangeRateForUI * depositAmount * value) / 100;
      setCalculatedBorrowAmount(calculatedAmount);
    } else {
      setCalculatedBorrowAmount(null);
    }
  };
  const getBorrowPartAndCollateralShare = async () => {
    const borrowPart = ethers.formatUnits(
      await wethMarket.userBorrowPart(signerAddress),
      8
    );
    const collateralShare = ethers.formatEther(
      await wethMarket.userCollateralShare(signerAddress)
    );

    const totalCollateralShare = ethers.formatEther(
      await wethMarket.totalCollateralShare()
    );
    console.log("User borrow part: ", borrowPart);
    console.log("User collateral share: ", collateralShare);
    setUserBorrowPart(borrowPart);
    setUserCollateralShare(collateralShare);
    setTotalBorrow(totalBorrow);
    setTotalCollateralShare(totalCollateralShare);
  };
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-200 p-8 flex flex-col items-center">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-12">DeFi App</h1>
      <div className="flex items-center space-x-6 mb-12">
        <WalletConnect
          setProvider={setProvider}
          setSigner={setSigner}
          setSignerAddress={setSignerAddress}
        />
      </div>
      {provider && (
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
          <div className="text-lg font-medium text-gray-700 mb-6">
            STK balance: <span className="font-bold">{stkBalance}</span>
          </div>
          <div className="text-lg font-medium text-gray-700 mb-6">
            ETH balance: <span className="font-bold">{ethBalance}</span>
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="depositAmount"
            >
              Deposit Amount
            </label>
            <input
              type="number"
              id="depositAmount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter amount to deposit"
            />
          </div>
          <div className="mb-8">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="percentBorrow"
            >
              Percent Borrow
            </label>
            <input
              type="number"
              id="percentBorrow"
              value={percentBorrow}
              onChange={handlePercentBorrowChange}
              className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter percentage to borrow"
            />
          </div>
          {calculatedBorrowAmount !== null && (
            <div className="mt-4 text-lg font-medium text-gray-700">
              STK Borrow Amount: {calculatedBorrowAmount.toFixed(2)}
            </div>
          )}
          <div className="flex space-x-4 my-8 justify-center">
            <button
              onClick={() => depositAndBorrow(depositAmount, percentBorrow)}
              className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors duration-300"
            >
              Deposit & Borrow
            </button>
            <button
              onClick={() => getBorrowPartAndCollateralShare()}
              className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors duration-300"
            >
              Borrow part & Collateral share
            </button>
          </div>
        </div>
      )}
      <div className="mt-12 w-full max-w-lg text-center bg-white p-8 rounded-xl shadow-lg">
        <p className="text-2xl font-semibold text-gray-800 mb-4">
          1 WETH = ${exchangeRateForUI}
        </p>
        <p className="text-lg text-gray-700 mb-4">Signer address</p>
        <p className="text-lg text-gray-700 mb-4">{signerAddress}</p>
        <p className="text-lg text-gray-700 mb-4">
          User borrow part: {userBorrowPart}
        </p>
        <p className="text-lg text-gray-700 mb-4">
          User collateral share: {userCollateralShare}
        </p>

        <p className="text-lg text-gray-700 mb-4">
          Total collateral share: {totalCollateralShare}
        </p>
      </div>
    </div>
  );
}

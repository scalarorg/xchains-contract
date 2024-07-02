"use client";
import { useState } from "react";
import { JsonRpcProvider, ethers } from "ethers";

const WalletConnect = ({ setProvider, setSigner, setSignerAddress }) => {
  const [connected, setConnected] = useState(false);
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setSigner(signer);
      setSignerAddress(address);
      setConnected(true);
    } else {
      alert("Please install MetaMask");
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>
        {connected ? "Wallet Connected" : "Connect Wallet"}
      </button>
    </div>
  );
};

export default WalletConnect;

"use client";
import { useState } from "react";
import { ethers } from "ethers";

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
    <div className="flex items-center justify-center bg-gray-100">
      <button
        onClick={connectWallet}
        className={`px-6 py-3 font-bold text-white rounded-lg ${
          connected
            ? "bg-green-500 hover:bg-green-600"
            : "bg-blue-500 hover:bg-blue-600"
        } transition-colors duration-300 ease-in-out`}
      >
        {connected ? "Wallet Connected" : "Connect Wallet"}
      </button>
    </div>
  );
};

export default WalletConnect;

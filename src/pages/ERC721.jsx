import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { erc721Address, erc721Abi } from "../constant";

export default function ERC721() {
  // --- Core state ---
  const [account, setAccount] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [chainIdNumber, setChainIdNumber] = useState("");
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState("");

  // --- nft metadata inputs ---
  const [nftName, setNftName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  // ---nft recieve data
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("");

  // TX hashes
  const [nftMintedHash, setnftMintedHash] = useState("");

  // Simple error UI
  const showError = (error) => {
    const msg = "Transaction failed!";
    alert(msg);
  };

  // ---------- Wallet connect ----------
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const myContract = new ethers.Contract(erc721Address, erc721Abi, signer);
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setContract(myContract);
      setNetworkName(network.name);
      setChainIdNumber(network.chainId?.toString?.() || "");
      const owner = await myContract.owner();
      setOwnerAddress(owner);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet!");
    }
  };

  const uploadToIPFS = async (file) => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios({
          method: "POST",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: "febc8bcc2e0247748719",
            pinata_secret_api_key:
              "0b23f6b60caf043d5718d773b8c4d877048a5f63966e1c4399e5d2bc733fd0d3",
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("Image uploaded to Pinata:", response.data.IpfsHash);
        const CID = response.data.IpfsHash;
        return CID;
      } catch (error) {
        console.log("UPLOAD ERROR:", error.response?.data || error.message);
        alert("uploadToIpfs failed");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Contract not Connected");
    if (!nftName || !description || !image) {
      alert("Please fill all fields");
      return;
    }

    const CID = await uploadToIPFS(image);
    if (!CID) return alert("image upload failed.");

    const metadataCID = await pinJSONToIPFS(nftName, description, CID);
    console.log("Metadata CID : ", CID);

    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
    console.log("metadata URL: ", metadataUrl);

    // call the contract safeMint function

    try {
      const tx = await contract.safeMint(metadataUrl);
      await reciept.wait();
      alert(`NftMinted successfully Congrates tx : ${reciept.hash}`);
      setnftMintedHash(reciept.hash);
      // Extract Event from reciept
      const event = reciept.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch (error) {}
        })
        .find((parsed) => parsed && parsed.name === "NFTMinted");

      if (event) {
        const tokenId = event.args.tokenId;
        console.log("NFT minted with Token ID: ", tokenId);
        alert(`NFT minted! Token ID: ${tokenId}`);
      } else {
        alert("NFTMinted not found in reciept");
      }

      setNftName("");
      setDescription("");
      setImage(null);
    } catch (error) {
      showError(error);
    }
  };

  const pinJSONToIPFS = async (nftName, description, CID) => {
    try {
      const data = JSON.stringify({
        nftName,
        description,
        image: `https://gateway.pinata.cloud/ipfs/${CID}`,
      });

      const res = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZjRkOGQ5OC00YzMwLTRhNmEtYmExNC0zNzcyMTZkZTJhYjAiLCJlbWFpbCI6ImZhbnViYWx0aTc4NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZmViYzhiY2MyZTAyNDc3NDg3MTkiLCJzY29wZWRLZXlTZWNyZXQiOiIwYjIzZjZiNjBjYWYwNDNkNTcxOGQ3NzNiOGM0ZDg3NzA0OGE1ZjYzOTY2ZTFjNDM5OWU1ZDJiYzczM2ZkMGQzIiwiZXhwIjoxNzk5NzUwOTA1fQ.4kzAsIDdbHUfxViazyj3aXzMlr9G1zL3ymoVNlnFY0s",
          },
          body: data,
        }
      );

      const resData = await res.json();
      console.log("Metadata uploaded with image CID:", resData.IpfsHash);
      return resData.IpfsHash;
    } catch (error) {
      console.log("UPLOAD ERROR:", error.response?.data || error.message);
      alert("uploadToIpfs failed");
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    const syncWallet = async () => {
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length === 0) {
        setAccount(null);
        setContract(null);
        return;
      }

      setAccount(accounts[0]);

      const network = await provider.getNetwork();
      setNetworkName(network.name);
      setChainIdNumber(Number(network.chainId));

      const signer = await provider.getSigner();
      const myContract = new ethers.Contract(erc721Address, erc721Abi, signer);
      setContract(myContract);

      const owner = await myContract.owner();
      setOwnerAddress(owner);
    };

    // initial load
    syncWallet();

    // account change (NO reload)
    window.ethereum.on("accountsChanged", syncWallet);

    // network change (MetaMask reload behavior)
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    return () => {
      window.ethereum.removeListener("accountsChanged", syncWallet);
      window.ethereum.removeListener("chainChanged", () =>
        window.location.reload()
      );
    };
  }, []);

  // ---------- Layout UI ----------
return (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0b1220] to-[#070b18] p-6">
    <div className="max-w-6xl mx-auto">

      {/* ========== Header ========== */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
            ERC721 Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">Sepolia Testnet • NFT Demo</p>
        </div>

        {!account ? (
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur rounded-xl px-3 py-1 border border-white/10 text-xs text-gray-300">
            {networkName} ({chainIdNumber}) • {account.slice(0,6)}…{account.slice(-4)}
          </div>
        )}
      </header>

      {/* ========== Layout ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== Left: Wallet Info ===== */}
        <div>
          <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4 shadow-md">
            <h3 className="text-sm font-semibold text-indigo-200 mb-2">Wallet Info</h3>
            {!account ? (
              <p className="text-xs text-gray-400">Connect wallet to continue</p>
            ) : (
              <>
                <p className="text-sm text-gray-200 break-all">{account}</p>
                <p className="text-xs text-gray-400 mt-1">Owner: {ownerAddress || "—"}</p>
              </>
            )}
          </div>
        </div>

        {/* ===== Right: Forms ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* ==== Mint NFT ==== */}
          <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4 shadow-md">
            <h2 className="text-lg font-semibold text-indigo-200 mb-4">Mint New NFT</h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <input
                type="text"
                placeholder="NFT Name"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-indigo-500"
              />
              <textarea
                rows="2"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm"
              >
                Mint NFT
              </button>
            </form>
          </div>

          {/* ==== List NFT ==== */}
          <div className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4 shadow-md">
            <h2 className="text-lg font-semibold text-emerald-300 mb-4">List NFT for Sale</h2>
            <form className="space-y-3 text-sm">
              <input
                type="number"
                placeholder="Token ID"
                className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="number"
                step="0.0001"
                placeholder="Price (ETH)"
                className="w-full px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-sm"
              >
                List NFT
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  </div>
);



}

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

  // --- get minted nft tokenId    ---
  const [tokenId, setTokenId] = useState("");

  // --- nft listing price input ---
  const [price, setPrice] = useState("");

  // --- get all listings data ---
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // TX hashes
  const [nftMintedHash, setnftMintedHash] = useState("");

  // Past Events
  const [listingEvents, setListingEvents] = useState([]);

  // Simple error UI
  const showError = (error) => {
    // User rejected tx
    if (error?.code === 4001) {
      return "Transaction rejected by user";
    }

    // Solidity revert reason (most common)
    if (error?.reason) {
      return error.reason;
    }

    // MetaMask / RPC nested error
    if (error?.error?.message) {
      return error.error.message;
    }

    // Ethers v6 short message
    if (error?.shortMessage) {
      return error.shortMessage;
    }

    // Fallback
    return "Transaction failed. Check console for details.";
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
      setChainIdNumber(Number(network.chainId));
      const owner = await myContract.owner();
      setOwnerAddress(owner);
      fetchListings();
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
    if (!contract) return alert("Wallet not Connected");
    if (!nftName || !description || !image) {
      alert("Please fill all fields");
      return;
    }

    const CID = await uploadToIPFS(image);
    if (!CID) return alert("image upload failed.");
    console.log("image CID : ", CID);

    const metadataCID = await pinJSONToIPFS(nftName, description, CID);
    console.log("Metadata CID : ", metadataCID);

    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
    console.log("metadata URL: ", metadataUrl);
    if (chainIdNumber !== 11155111) {
      return alert("Please switch to Sepolia network");
    }

    // call the contract safeMint function
    try {
      const tx = await contract.safeMint(metadataUrl);
      const reciept = await tx.wait();
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

  const fetchListings = async () => {
    if (!contract) return;
    try {
      setLoadingListings(true);

      const [sellers, prices, tokenIds] = await contract.getAllListings();

      const listingsArray = await Promise.all(
        tokenIds.map(async (tokenId, index) => {
          const tokenUri = await contract.tokenURI(tokenId);
          let metadata = {};
          try {
            const res = await fetch(tokenUri);
            metadata = await res.json();
          } catch (err) {}
          return {
            tokenId: tokenId.toString(),
            seller: sellers[index],
            price: ethers.formatEther(prices[index]),
            metadata,
          };
        })
      );
      console.log(listingsArray); // ab real array milega
      console.log("hello");
      setListings(listingsArray);
      console.log(listings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleListNFT = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Contract not Connected");
    if (!tokenId || !price) {
      alert("Please fill all fields");
      return;
    }

    try {
      const priceInWei = ethers.parseEther(price.toString());
      const tx = await contract.listing(Number(tokenId), priceInWei);
      await tx.wait();
      alert(`NFT listed successfully at ${price} ETH!`);
      fetchListings();
    } catch (error) {
      console.log(`Error listing NFT: ${error}`);
      alert(`failed to list NFT, check console for details`);
    }
  };

  const handleBuyNFT = async (tokenId, price) => {
    if (!contract) return alert("Wallet not connected");
    try {
      const tx = await contract.buyNFT(Number(tokenId), {
        value: ethers.parseEther(price.toString()),
      });
      await tx.wait();
      alert(`NFT ${tokenId} bought successfully!`);
      fetchListings();
    } catch (err) {
      console.error(err);
      alert(showError(err));
    }
  };

  useEffect(() => {
    if (!contract) return;
    fetchListings();
  }, [contract]);

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

  useEffect(() => {
    if (!contract) return;

    const fetchPastEvents = async () => {
      try {
        // Get All NFt Listed
        const pastNFTListed = await contract.queryFilter(
          contract.filters.NFTListed(),
          0,
          "latest"
        );
        setListingEvents(
          pastNFTListed
            .map((e) => ({
              tokenId: e.args.tokenId.toString(),
              seller: e.args.seller,
              price: Number(e.args.price),
            }))
            .reverse()
        );
      } catch (err) {
        console.error("Error fetching past events:", err);
      }
    };
    // // Real-time listeners
    // const handleUserRegistered = (wallet, name, age, event) => {
    //   setUserRegisteredEvents((prev) => [
    //     { wallet, name, age: Number(age), txHash: event.transactionHash },
    //     ...prev,
    //   ]);
    // };
    // const handleUserUpdated = (wallet, name, event) => {
    //   setUserUpdatedEvents((prev) => [
    //     { wallet, name, txHash: event.transactionHash },
    //     ...prev,
    //   ]);
    // };

    // contract.on("UserRegistered", handleUserRegistered);
    // contract.on("UserUpdated", handleUserUpdated);

    // return () => {
    //   contract.off("UserRegistered", handleUserRegistered);
    //   contract.off("UserUpdated", handleUserUpdated);

    // };
    fetchPastEvents();
  }, [contract]);

  // ---------- Layout UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0b1220] to-[#070b18] p-6">
      <div className="max-w-7xl mx-auto">
        {/* ========== Header ========== */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4 sm:gap-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              ERC721 Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Sepolia Testnet • NFT Demo
            </p>
          </div>

          {!account ? (
            <button
              onClick={connectWallet}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur rounded-xl px-4 py-2 border border-white/10 text-xs text-gray-300">
              {networkName} ({chainIdNumber}) • {account.slice(0, 6)}…
              {account.slice(-4)}
            </div>
          )}
        </header>

        {/* ========== Layout Grid ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== Left Panel: Wallet Info ===== */}
          <div>
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-indigo-200 mb-3">
                Wallet Info
              </h3>
              {!account ? (
                <p className="text-xs text-gray-400">
                  Connect wallet to continue
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-200 break-all">{account}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Owner: {ownerAddress || "—"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ===== Right Panel: Forms ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* ==== Mint NFT ==== */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-indigo-200 mb-5">
                Mint New NFT
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <input
                  type="text"
                  placeholder="NFT Name"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-indigo-500"
                />
                <textarea
                  rows="2"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-105 transition-transform"
                >
                  Mint NFT
                </button>
              </form>
            </div>

            {/* ==== List NFT ==== */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-emerald-300 mb-5">
                List NFT for Sale
              </h2>
              <form onSubmit={handleListNFT} className="space-y-4 text-sm">
                <input
                  type="number"
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="Token ID"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.0001"
                  placeholder="Price (ETH)"
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:scale-105 transition-transform"
                >
                  List NFT
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ========== NFT Marketplace Cards ======= */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-indigo-200 mb-6">
            NFT Marketplace
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center">
                No NFTs listed yet. {}
              </p>
            ) : (
              listings.map((nft, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 shadow-lg overflow-hidden flex flex-col hover:scale-105 transition-transform"
                >
                  {/* ===== Optional Image ===== */}
                  { <div className="h-48 w-full bg-black/30 flex items-center justify-center">
            <img
              src={nft.metadata.image || "/placeholder.png"}
              alt={`NFT ${nft.tokenId}`}
              className="object-cover h-full w-full"
            />
          </div> }

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* ===== Optional Name ===== */}
                      <h3 className="text-sm font-semibold text-indigo-200">
                {nft.metadata.name || `NFT #${nft.tokenId}`}
              </h3>

                      <p className="text-sm text-indigo-200">
                        Token ID: {nft.tokenId}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 break-words">
                        Seller: {nft.seller}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Price: {nft.price} ETH
                      </p>
                    </div>

                    {true ? (
                      <button
                        onClick={() => handleBuyNFT(nft.tokenId, nft.price)}
                        className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:scale-105 transition-transform"
                      >
                        Buy NFT
                      </button>
                    ) : (
                      <p className="mt-3 text-xs text-gray-400 text-center">
                        You listed this NFT
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Contract, ethers } from "ethers";
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

  // --- show different kinds of loading
  const [loadingMint, setLoadingMint] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingBuy, setLoadingBuy] = useState({});
  const [loadingCancel, setLoadingCancel] = useState({});
  const [loadingListings, setLoadingListings] = useState(false);

  // // TX hashes
  const [nftMintedHash, setNftMintedHash] = useState("");
  const [nftListedHash, setNftListedHash] = useState("");
  const [nftBuyingHash, setNftBuyingHash] = useState("");
  const [nftCancelHash, setNftCancelHash] = useState("");

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



  const getTxLink = (hash) => {
  if (!hash) return null;
  return `https://sepolia.etherscan.io/tx/${hash}`;
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
            pinata_api_key: "f2a1537946f7ac7eb5d2",
            pinata_secret_api_key: "4ca84e4c8535bc94a9f9e1c87711a4925c59a23146ec68cb28746b3656db2d00",
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

    setLoadingMint(true);
    // console.log("hello", import.meta.env.VITE_PINATA_API_KEY);
    // console.log("hello", import.meta.env.VITE_PINATA_SECRET_API_KEY);
    // console.log("hello", import.meta.env.VITE_PINATA_JWT);

    const CID = await uploadToIPFS(image);
    if (!CID) return alert("image upload failed.");

    const metadataCID = await pinJSONToIPFS(nftName, description, CID);
    if (!metadataCID) return alert("metadata upload failed.");
  

    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
    console.log("metadata URL: ", metadataUrl);
    if (chainIdNumber !== 11155111) {
      return alert("Please switch to Sepolia network");
    }

    // call the contract safeMint function
    try {
      const tx = await contract.safeMint(metadataUrl);
      setNftMintedHash(tx.hash);
      const receipt = await tx.wait();

      // Filter logs from this contract only
      const event = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch (err) {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === "NFTMinted");

      if (event) {
        const tokenId = event.args.tokenId;
        console.log("NFT minted with Token ID: ", tokenId);
        alert(`NFT minted! Token ID: ${tokenId}`);
      } else {
        alert("NFTMinted not found in receipt");
      }

      setNftName("");
      setDescription("");
      setImage(null);
    } catch (error) {
      showError(error);
    } finally {
      setLoadingMint(false);
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
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZjRkOGQ5OC00YzMwLTRhNmEtYmExNC0zNzcyMTZkZTJhYjAiLCJlbWFpbCI6ImZhbnViYWx0aTc4NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZjJhMTUzNzk0NmY3YWM3ZWI1ZDIiLCJzY29wZWRLZXlTZWNyZXQiOiI0Y2E4NGU0Yzg1MzViYzk0YTlmOWUxYzg3NzExYTQ5MjVjNTlhMjMxNDZlYzY4Y2IyODc0NmIzNjU2ZGIyZDAwIiwiZXhwIjoxODAwMjk5OTA3fQ.7c2H9WXAdVrNJcTuflDYmXYQok5F2OazUy7IBi1k8EE`,
          },
          body: data,
        },
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
      let count = 0;

      const [sellers, prices, tokenIds] = await contract.getAllListings();

      const listingsArray = await Promise.all(
        tokenIds.map(async (tokenId, index) => {
          const tokenUri = await contract.tokenURI(tokenId);
          console.log("tokenUri: ",count++, tokenUri);
          let metadata = {};
          try {
            const res = await fetch(tokenUri);
            console.log("res :", res);

            metadata = await res.json();
          } catch (err) {}
          return {
            tokenId: tokenId.toString(),
            seller: sellers[index],
            price: ethers.formatEther(prices[index]),
            metadata,
          };
        }),
      );
      setListings(listingsArray);
      console.log("listings : ",listings);
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
      setLoadingList(true);
      const priceInWei = ethers.parseEther(price.toString());
      const tx = await contract.listing(Number(tokenId), priceInWei);
      setNftListedHash(tx.hash);
      await tx.wait();
      alert(`NFT listed successfully at ${price} ETH!`);
      fetchListings();
      setPrice("");
      setTokenId("");
    } catch (error) {
      console.log(`Error listing NFT: ${error}`);
      alert(`failed to list NFT, check console for details`);
    } finally {
      setLoadingList(false);
    }
  };

  const handleBuyNFT = async (tokenId, price) => {
    if (!contract) return alert("Wallet not connected");

    try {
      // Set loading true for this specific tokenId
      setLoadingBuy((prev) => ({ ...prev, [tokenId]: true }));

      const tx = await contract.buyNFT(Number(tokenId), {
        value: ethers.parseEther(price.toString()),
      });
      setNftBuyingHash(tx.hash);
      await tx.wait();

      alert(`NFT ${tokenId} bought successfully!`);
      fetchListings();
    } catch (err) {
      console.error(err);
      alert(showError(err));
    } finally {
      // Set loading false for this tokenId
      setLoadingBuy((prev) => ({ ...prev, [tokenId]: false }));
    }
  };

  const cancelListing = async (tokenId) => {
    if (!contract) {
      alert("Wallet is not connected");
      return;
    }

    try {
      // Set loading for this specific tokenId
      setLoadingCancel((prev) => ({ ...prev, [tokenId]: true }));

      const tx = await contract.cancelListing(Number(tokenId));
      setNftCancelHash(tx.hash);
      await tx.wait();

      alert(`Listing for NFT #${tokenId} has been successfully cancelled.`);
      fetchListings();
    } catch (error) {
      console.error("Cancel listing failed:", error);
      alert(showError(error));
    } finally {
      // Reset loading for this tokenId
      setLoadingCancel((prev) => ({ ...prev, [tokenId]: false }));
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
        window.location.reload(),
      );
    };
  }, []);

  // useEffect(() => {
  //   if (!contract) return;

  //   const fetchPastEvents = async () => {
  //     try {
  //       // Get all past NFTListed events
  //       const events = await contract.queryFilter(
  //         contract.filters.NFTListed(),
  //         0,
  //         "latest",
  //       );

  //       console.log(events.length);

  //       // Resolve metadata for each event
  //       const listings = await Promise.all(
  //         events.map(async (e) => {
  //           const { tokenId, seller, price } = e.args;

  //           let metadata = {};
  //           try {
  //             const tokenUri = await contract.tokenURI(tokenId);
              
  //             const res = await fetch(tokenUri);
  //             console.log("hellogmadam");

  //             metadata = await res.json();
  //           } catch (err) {
  //             console.warn("Metadata fetch failed:", err);
  //           }

  //           return {
  //             tokenId: tokenId.toString(),
  //             seller,
  //             price: ethers.formatEther(price),
  //             metadata,
  //           };
  //         }),
  //       );
  //       console.log(listings);
  //       setListingEvents(listings);
  //     } catch (err) {
  //       console.error("Error fetching past events:", err);
  //     }
  //   };

  //   // Real-time listener
  //   const handleNFTListed = async (tokenId, seller, price) => {
  //     let metadata = {};
  //     try {
  //       const tokenUri = await contract.tokenURI(tokenId);
  //       const res = await fetch(tokenUri);
  //       metadata = await res.json();
  //     } catch (err) {}

  //     setListingEvents((prev) => [
  //       {
  //         tokenId: tokenId.toString(),
  //         seller,
  //         price: ethers.formatEther(price),
  //         metadata,
  //       },
  //       ...prev,
  //     ]);
  //   };

  //   contract.on("NFTListed", handleNFTListed);
  //   fetchPastEvents();

  //   // Cleanup (VERY IMPORTANT)
  //   return () => {
  //     contract.off("NFTListed", handleNFTListed);
  //   };
  // }, [contract]);

  // ---------- Layout UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0b1220]/80 to-[#070b18] p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===== Header ===== */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-4 sm:gap-0">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              ERC721 Marketplace
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Sepolia Testnet • NFT Demo
            </p>
          </div>

          {!account ? (
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform duration-300"
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

        {/* ===== Wallet & Actions Panel ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Wallet Info */}
          <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-indigo-200 mb-4">
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

                {/* ===== TX HASHES ===== */}
                <div className="mt-4 space-y-2 text-xs">
                  {nftMintedHash && (
                    <a
                      href={getTxLink(nftMintedHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-indigo-400 hover:underline break-all"
                    >
                      🟣 Mint Tx: {nftMintedHash}
                    </a>
                  )}

                  {nftListedHash && (
                    <a
                      href={getTxLink(nftListedHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-emerald-400 hover:underline break-all"
                    >
                      🟢 List Tx: {nftListedHash}
                    </a>
                  )}

                  {nftBuyingHash && (
                    <a
                      href={getTxLink(nftBuyingHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-teal-400 hover:underline break-all"
                    >
                      🔵 Buy Tx: {nftBuyingHash}
                    </a>
                  )}

                  {nftCancelHash && (
                    <a
                      href={getTxLink(nftCancelHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-red-400 hover:underline break-all"
                    >
                      🔴 Cancel Tx: {nftCancelHash}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mint & List NFTs */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Mint NFT */}
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
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500"
                />
                <textarea
                  rows="2"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full text-xs text-gray-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white"
                />
                <button
                  type="submit"
                  disabled={loadingList}
                  className={`w-full py-2 rounded-lg text-white font-semibold transition-all duration-300
    ${
      loadingMint
        ? "bg-gray-600 cursor-not-allowed"
        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 cursor-pointer"
    }`}
                >
                  {loadingMint ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Minting NFT...</span>
                    </div>
                  ) : (
                    "Mint NFT"
                  )}
                </button>
              </form>
            </div>

            {/* List NFT */}
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-emerald-300 mb-5">
                List NFT for Sale
              </h2>
              <form onSubmit={handleListNFT} className="space-y-4 text-sm">
                <input
                  type="number"
                  value={tokenId}
                  placeholder="Token ID"
                  onChange={(e) => setTokenId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="number"
                  value={price}
                  placeholder="Price (ETH)"
                  step="0.0001"
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loadingList}
                  className={`w-full py-2 rounded-lg text-white font-semibold transition-all duration-300
                 ${
                   loadingList
                     ? "bg-gray-600 cursor-not-allowed"
                     : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 cursor-pointer"
                 }`}
                >
                  {loadingList ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Listing NFT...</span>
                    </div>
                  ) : (
                    "List NFT"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ===== NFT Marketplace Cards ===== */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-indigo-200 mb-6">
            NFT Marketplace
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingListings ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-indigo-200 text-lg font-medium tracking-wide">
                  Fetching NFT listings...
                </p>
              </div>
            ) : listings.length === 0 ? (
              <p className="text-gray-400 col-span-full text-center">
                No NFTs listed yet.
              </p>
            ) : (
              listings.map((nft, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl shadow-lg overflow-hidden flex flex-col hover:scale-105 hover:shadow-2xl transition-transform duration-300"
                >
                  {/* NFT Image */}
                  <div className="h-60 w-full bg-black/20 flex items-center justify-center overflow-hidden">
                    <img
                      src={nft.metadata?.image || "/placeholder.png"}
                      alt={`NFT ${nft.tokenId}`}
                      className="object-cover h-full w-full transition-transform duration-300 hover:scale-110"
                    />
                  </div>

                  {/* NFT Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-200">
                        {nft.metadata?.nftName || "Unnamed NFT"}
                      </h3>

                      <p className="text-xs text-gray-400 mt-1">
                        Token ID: {nft.tokenId}
                      </p>

                      <p className="text-xs text-gray-400 mt-1 break-words">
                        Seller: {nft.seller}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Price: {nft.price} ETH
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {nft.seller.toLowerCase() !== account?.toLowerCase() ? (
                      <button
                        onClick={() => handleBuyNFT(nft.tokenId, nft.price)}
                        disabled={loadingBuy[nft.tokenId]}
                        className={`mt-3 w-full py-2 rounded-lg text-white font-medium transition-all duration-300
    ${
      loadingBuy[nft.tokenId]
        ? "bg-gray-600 cursor-not-allowed"
        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 cursor-pointer"
    }`}
                      >
                        {loadingBuy[nft.tokenId] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing Purchase...</span>
                          </div>
                        ) : (
                          "Buy NFT"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => cancelListing(nft.tokenId)}
                        disabled={loadingCancel[nft.tokenId]}
                        className={`cursor-pointer mt-3 w-full py-2 rounded-lg text-white font-medium transition-all duration-300
    ${
      loadingCancel[nft.tokenId]
        ? "bg-gray-600 cursor-not-allowed"
        : "bg-gradient-to-r from-red-500 to-pink-500 hover:scale-105"
    }`}
                      >
                        {loadingCancel[nft.tokenId] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Cancelling...</span>
                          </div>
                        ) : (
                          "Cancel Listing"
                        )}
                      </button>
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

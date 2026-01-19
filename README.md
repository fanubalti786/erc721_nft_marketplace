# ERC721 NFT Marketplace (Sepolia Testnet)

A complete **ERC721 NFT Marketplace** built with **React + Ethers.js v6 + OpenZeppelin ERC721**, featuring minting, listing, buying, and cancelling NFTs with metadata stored on **IPFS via Pinata**.

This project is designed as a **learning-focused but production-structured** NFT marketplace demo on the **Sepolia Ethereum testnet**.

---

## 🚀 Features

### 🔐 Wallet & Network

* MetaMask wallet connection
* Automatic account & network sync
* Sepolia testnet validation

### 🎨 NFT Minting

* Upload NFT image to IPFS (Pinata)
* Upload metadata JSON (name, description, image)
* Mint ERC721 NFT using `safeMint`
* Auto-detect minted `tokenId` via event logs

### 🏷️ Marketplace

* List NFT for sale with custom ETH price
* Buy NFT with ETH
* Cancel your own NFT listings
* Conditional UI (buyer vs seller)

### 📦 IPFS Integration

* Image & metadata stored on IPFS
* Token metadata resolved via `tokenURI`
* Images rendered directly from IPFS gateway

### ⚡ UX & Performance

* Per-NFT loading states (no global blocking)
* Real-time UI updates after transactions
* Transaction hash tracking with Etherscan links
* Clean, responsive UI using TailwindCSS

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite)
* **Blockchain:** Solidity + OpenZeppelin ERC721
* **Web3 Library:** Ethers.js v6
* **Storage:** IPFS (Pinata)
* **Network:** Sepolia Testnet
* **Styling:** TailwindCSS

---

## 📂 Project Structure

```
src/
├── components/
│   └── ERC721.jsx        # Main marketplace component
├── constant/
│   └── index.js          # Contract address & ABI
├── assets/
│   └── placeholder.png
└── main.jsx
```

---

## ⚙️ Setup Guide

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/erc721-nft-marketplace.git
cd erc721-nft-marketplace
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in project root:

```env
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
VITE_PINATA_JWT=your_pinata_jwt
```

> ⚠️ **Important:**
> Never commit your real Pinata keys to GitHub.

---

### 4️⃣ Update Contract Details

Edit `src/constant/index.js`:

```js
export const erc721Address = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
export const erc721Abi = [ /* ABI JSON */ ];
```

Make sure the contract is deployed on **Sepolia**.

---

### 5️⃣ Run Project

```bash
npm run dev
```

Open browser at:

```
http://localhost:5173
```

---

## 🧪 How to Use

1. Connect MetaMask wallet
2. Switch to **Sepolia Testnet**
3. Mint a new NFT (image + metadata)
4. List NFT by Token ID & price
5. Buy NFTs from another wallet
6. Cancel your own listings

---

## 🔗 Smart Contract Expectations

Your ERC721 contract should include:

* `safeMint(string memory tokenURI)`
* `getAllListings()`
* `listing(uint256 tokenId, uint256 price)`
* `buyNFT(uint256 tokenId)`
* `cancelListing(uint256 tokenId)`
* Events: `NFTMinted`, `NFTListed`

---

## 🧠 Learning Outcomes

* ERC721 internal flow & approvals
* IPFS metadata lifecycle
* Marketplace architecture (non-custodial)
* Event-based token tracking
* Real-world Web3 frontend patterns

---

## ⚠️ Security Notes

* This project is for **educational/demo purposes**
* Do NOT use real funds
* Do NOT expose API keys in production
* Always audit smart contracts before mainnet deployment

---

## 📜 License

MIT License
Free to use, modify, and learn from.

---

## 🙌 Author

**Irfan Haider**
Blockchain & Web3 Developer
Learning-focused ERC721 Marketplace Project

---

If you find this project useful ⭐ star the repo!

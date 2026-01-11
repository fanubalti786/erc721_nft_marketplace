import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { address1 as address, abi1 as abi } from "../constant";

export default function ERC721() {
  // --- Core state ---
  const [account, setAccount] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [chainIdNumber, setChainIdNumber] = useState("");
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState("");

  // Inputs
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [newName, setNewName] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [contractBal, setContractBal] = useState(null);

  // TX hashes
  const [registerHash, setRegisterHash] = useState("");
  const [updateHash, setUpdateHash] = useState("");
  const [depositHash, setDepositHash] = useState("");
  const [withdrawHash, setWithdrawHash] = useState("");
  const [ownerWithdrawHash, setOwnerWithdrawHash] = useState("");

  // Event arrays
  const [userRegisteredEvents, setUserRegisteredEvents] = useState([]);
  const [userUpdatedEvents, setUserUpdatedEvents] = useState([]);
  const [depositEvents, setDepositEvents] = useState([]);
  const [withdrawEvents, setWithdrawEvents] = useState([]);
  const [ownerWithdrawEvents, setOwnerWithdrawEvents] = useState([]);

  // My account events
  const [myEvents, setMyEvents] = useState([]);

  // UI toggles (collapsible sections)
  const [showRegistered, setShowRegistered] = useState(true);
  const [showUpdated, setShowUpdated] = useState(false);
  const [showDeposits, setShowDeposits] = useState(false);
  const [showWithdraws, setShowWithdraws] = useState(false);
  const [showOwnerWithdraws, setShowOwnerWithdraws] = useState(false);

  // Simple error UI
  const showError = (error) => {
    const msg =  "Transaction failed!";
    alert(msg);
  };

  // ---------- Wallet connect ----------
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const myContract = new ethers.Contract(address, abi, signer);
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

  // ---------- Core tx functions ----------
  const register = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!name || !age) return alert("Please fill all fields!");
    try {
      const tx = await contract.register(name, parseInt(age));
      await tx.wait();
      setRegisterHash(tx.hash);
      setName("");
      setAge("");
    } catch (error) {
      showError(error);
    }
  };

  const updateUser = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!newName) return alert("Enter new name!");
    try {
      const tx = await contract.updateUser(newName);
      await tx.wait();
      setUpdateHash(tx.hash);
      setNewName("");
    } catch (error) {
      showError(error);
    }
  };

  const deposit = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!depositAmount || parseFloat(depositAmount) <= 0)
      return alert("Enter valid amount!");
    try {
      const tx = await contract.deposit({
        value: ethers.parseEther(depositAmount),
      });
      await tx.wait();
      setDepositHash(tx.hash);
      setDepositAmount("");
    } catch (error) {
      showError(error);
    }
  };

  const withdraw = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0)
      return alert("Enter valid amount!");
    try {
      const tx = await contract.withdraw(ethers.parseEther(withdrawAmount));
      await tx.wait();
      setWithdrawHash(tx.hash);
      setWithdrawAmount("");
    } catch (error) {
      showError(error);
    }
  };

  const withdrawAllToOwner = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!account || !ownerAddress)
      return alert("Owner check failed — reconnect wallet.");
    if (account.toLowerCase() !== ownerAddress.toLowerCase())
      return alert("Only owner can use this!");
    try {
      const tx = await contract.withdrawAllToOwner();
      await tx.wait();
      setOwnerWithdrawHash(tx.hash);
    } catch (error) {
      showError(error);
    }
  };

  // ---------- Read helpers ----------
  const getUser = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!account) return alert("No wallet connected!");
    try {
      const user = await contract.getUser(account);
      setCurrentUser({
        name: user.name,
        age: Number(user.age),
        wallet: user.wallet,
        balance: user.balance,
      });
    } catch (error) {
      showError(error);
    }
  };

  const getAllUsers = async () => {
    if (!contract) return alert("Connect wallet first!");
    try {
      const allUsers = await contract.getAllUsers();
      const formatted = allUsers.map((u) => ({
        name: u.name,
        age: Number(u.age),
        wallet: u.wallet,
        balance: u.balance,
      }));
      setUsers(formatted);
    } catch (error) {
      showError(error);
    }
  };

  const fetchContractBalance = async () => {
    if (!contract) return alert("Connect wallet first!");
    try {
      const bal = await contract.contractBalance();
      console.log(bal)
      setContractBal(bal);
    } catch (error) {
      showError(error);
    }
  };

  // ---------- Auto handle accounts/network ----------
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        const acc = accounts[0];
        setAccount(acc);
        const network = await provider.getNetwork();
        setNetworkName(network.name);
        setChainIdNumber(Number(network.chainId));
        const signer = await provider.getSigner();
        const myContract = new ethers.Contract(address, abi, signer);
        setContract(myContract);
        const owner = await myContract.owner();
        setOwnerAddress(owner);
      }

      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const signer = await provider.getSigner();
          const myContract = new ethers.Contract(address, abi, signer);
          setContract(myContract);
          const owner = await myContract.owner();
          setOwnerAddress(owner);
        } else {
          setAccount(null);
          setContract(null);
        }
      };

      const handleChainChanged = async (chainId) => {
        const network = await provider.getNetwork();
        setNetworkName(network.name);
        setChainIdNumber(parseInt(chainId, 16));
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Events: fetch past + realtime ----------
  useEffect(() => {
    if (!contract) return;

    const fetchPastEvents = async () => {
      try {
        // UserRegistered
        const pastRegs = await contract.queryFilter(
          contract.filters.UserRegistered(),
          0,
          "latest"
        );
        setUserRegisteredEvents(
          pastRegs
            .map((e) => ({
              wallet: e.args.wallet,
              name: e.args.name,
              age: Number(e.args.age),
              txHash: e.transactionHash,
            }))
            .reverse()
        );

        // UserUpdated
        const pastUpdates = await contract.queryFilter(
          contract.filters.UserUpdated(),
          0,
          "latest"
        );
        setUserUpdatedEvents(
          pastUpdates
            .map((e) => ({
              wallet: e.args.wallet,
              name: e.args.name,
              txHash: e.transactionHash,
            }))
            .reverse()
        );

        // EtherDeposited
        const pastDeposits = await contract.queryFilter(
          contract.filters.EtherDeposited(),
          0,
          "latest"
        );
        setDepositEvents(
          pastDeposits
            .map((e) => ({
              wallet: e.args.wallet,
              amount: e.args.amount,
              txHash: e.transactionHash,
            }))
            .reverse()
        );

        // EtherWithdrawn
        const pastWithdraws = await contract.queryFilter(
          contract.filters.EtherWithdrawn(),
          0,
          "latest"
        );
        setWithdrawEvents(
          pastWithdraws
            .map((e) => ({
              wallet: e.args.wallet,
              amount: e.args.amount,
              txHash: e.transactionHash,
            }))
            .reverse()
        );

        // OwnerWithdrawAll
        const pastOwner = await contract.queryFilter(
          contract.filters.OwnerWithdrawAll(),
          0,
          "latest"
        );
        setOwnerWithdrawEvents(
          pastOwner
            .map((e) => ({
              amount: e.args.amount,
              txHash: e.transactionHash,
            }))
            .reverse()
        );
      } catch (err) {
        console.error("Error fetching past events:", err);
      }
    };

    fetchPastEvents();

    // Real-time listeners
    const handleUserRegistered = (wallet, name, age, event) => {
      setUserRegisteredEvents((prev) => [
        { wallet, name, age: Number(age), txHash: event.transactionHash },
        ...prev,
      ]);
    };
    const handleUserUpdated = (wallet, name, event) => {
      setUserUpdatedEvents((prev) => [
        { wallet, name, txHash: event.transactionHash },
        ...prev,
      ]);
    };
    const handleDeposit = (wallet, amount, event) => {
      setDepositEvents((prev) => [
        { wallet, amount, txHash: event.transactionHash },
        ...prev,
      ]);
    };
    const handleWithdraw = (wallet, amount, event) => {
      setWithdrawEvents((prev) => [
        { wallet, amount, txHash: event.transactionHash },
        ...prev,
      ]);
    };
    const handleOwnerWithdraw = (amount, event) => {
      setOwnerWithdrawEvents((prev) => [
        { amount, txHash: event.transactionHash },
        ...prev,
      ]);
    };

    contract.on("UserRegistered", handleUserRegistered);
    contract.on("UserUpdated", handleUserUpdated);
    contract.on("EtherDeposited", handleDeposit);
    contract.on("EtherWithdrawn", handleWithdraw);
    contract.on("OwnerWithdrawAll", handleOwnerWithdraw);

    return () => {
      contract.off("UserRegistered", handleUserRegistered);
      contract.off("UserUpdated", handleUserUpdated);
      contract.off("EtherDeposited", handleDeposit);
      contract.off("EtherWithdrawn", handleWithdraw);
      contract.off("OwnerWithdrawAll", handleOwnerWithdraw);
    };
  }, [contract]);

  // ---------- My events (connected account only) ----------
  const filterMyEvents = async () => {
    if (!contract) return alert("Connect wallet first!");
    if (!account) return alert("No wallet connected!");
    try {
      // If events have indexed wallet field, you can pass account as arg to filter.
      const allRegs = await contract.queryFilter(
        contract.filters.UserRegistered(account),
        0,
        "latest"
      );
      const allUpdates = await contract.queryFilter(
        contract.filters.UserUpdated(account),
        0,
        "latest"
      );
      const allDeposits = await contract.queryFilter(
        contract.filters.EtherDeposited(account),
        0,
        "latest"
      );
      const allWithdraws = await contract.queryFilter(
        contract.filters.EtherWithdrawn(account),
        0,
        "latest"
      );

      const formatted = [
        ...allRegs.map((e) => ({
          type: "Registered",
          name: e.args.name,
          age: Number(e.args.age),
          txHash: e.transactionHash,
        })),
        ...allUpdates.map((e) => ({
          type: "Updated",
          name: e.args.name,
          txHash: e.transactionHash,
        })),
        ...allDeposits.map((e) => ({
          type: "Deposited",
          amount: ethers.formatEther(e.args.amount),
          txHash: e.transactionHash,
        })),
        ...allWithdraws.map((e) => ({
          type: "Withdrew",
          amount: ethers.formatEther(e.args.amount),
          txHash: e.transactionHash,
        })),
      ].reverse();

      setMyEvents(formatted);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch your events!");
    }
  };

  // ---------- Small UI components ----------
  const TxBox = ({ label, hash, colorClass = "border-purple-400" }) =>
    hash ? (
      <div className={`p-2 mt-2 text-xs rounded border ${colorClass} break-all bg-black/30`}>
        <span className="font-semibold">{label}</span>{" "}
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-300 hover:underline break-all"
        >
          {hash}
        </a>
      </div>
    ) : null;

  const CollapsibleSection = ({ title, open, setOpen, children, accent }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/5">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-8 rounded-full ${accent} shadow-[0_6px_18px_rgba(124,58,237,0.18)]`}
            aria-hidden
          />
          <h3 className="font-semibold text-sm text-indigo-100">{title}</h3>
        </div>
        <div className="text-xs text-gray-300">{open ? "Hide" : "Show"}</div>
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );

  const EventItem = ({ children }) => (
    <p className="text-sm break-all py-1 border-b border-white/5 last:border-b-0">{children}</p>
  );

  // ---------- Layout UI ----------
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-[#0b1220]/80 to-[#0b0920]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              ERC721
            </div>
            <div className="text-xs text-gray-400">Sepolia • Demo</div>
          </div>

          <div className="flex items-center gap-3">
            {!account ? (
              <button
                onClick={connectWallet}
                className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg hover:scale-[1.01] transition-transform"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/3 backdrop-blur-sm rounded-2xl p-2 px-3 border border-white/5">
                <div className="text-xs text-indigo-200">
                  {networkName} ({chainIdNumber})
                </div>
                <div className="px-2 py-1 rounded bg-white/5 text-xs break-all">
                  {account.slice(0, 8)}...{account.slice(-6)}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column: summary + events */}
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/6 shadow-lg">
              <h4 className="text-sm font-semibold text-indigo-100 mb-2">Account</h4>
              {!account ? (
                <div className="text-sm text-gray-300">Please connect your wallet.</div>
              ) : (
                <>
                  <div className="text-sm text-gray-200 break-all">{account}</div>
                  <div className="mt-2 text-xs text-gray-400">Owner: {ownerAddress || "—"}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={getUser}
                      className="py-1 px-2 bg-indigo-600/80 rounded text-xs font-medium hover:brightness-110"
                    >
                      Get My Info
                    </button>
                    <button
                      onClick={getAllUsers}
                      className="py-1 px-2 bg-green-600/80 rounded text-xs font-medium hover:brightness-110"
                    >
                      Get All Users
                    </button>
                    <button
                      onClick={fetchContractBalance}
                      className="py-1 px-2 bg-pink-600/80 rounded text-xs font-medium hover:brightness-110"
                    >
                      Contract Balance
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Contract Balance Display */}
            <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-indigo-100">Contract Balance</h4>
                <button
                  onClick={fetchContractBalance}
                  className="py-1 px-2 bg-pink-600/80 rounded text-xs font-medium hover:brightness-110"
                >
                  Refresh
                </button>
              </div>
              {contractBal !== null ? (
                <div className="text-lg font-bold text-green-300">
                  {ethers.formatEther(contractBal)} ETH
                </div>
              ) : (
                <div className="text-sm text-gray-400">Click "Refresh" to load balance</div>
              )}
            </div>

            {/* All Users Display */}
            <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-indigo-100">All Users ({users.length})</h4>
                <button
                  onClick={getAllUsers}
                  className="py-1 px-2 bg-green-600/80 rounded text-xs font-medium hover:brightness-110"
                >
                  Refresh
                </button>
              </div>
              {users.length === 0 ? (
                <div className="text-sm text-gray-400">No users found. Click "Refresh" to load.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {users.map((user, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div className="font-medium text-indigo-200">{user.name}</div>
                            <div className="text-xs text-gray-400">Age: {user.age}</div>
                          </div>
                          <div className="text-xs text-gray-300 break-all mb-1">
                            {user.wallet}
                          </div>
                          <div className="text-sm text-green-300">
                            Balance: {ethers.formatEther(user.balance)} ETH
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CollapsibleSection
              title={`User Registered (${userRegisteredEvents.length})`}
              open={showRegistered}
              setOpen={setShowRegistered}
              accent="bg-gradient-to-b from-indigo-500 to-purple-500"
            >
              <div className="max-h-56 overflow-y-auto">
                {userRegisteredEvents.length === 0 ? (
                  <div className="text-sm text-gray-400">No registered users yet.</div>
                ) : (
                  userRegisteredEvents.map((e, idx) => (
                    <EventItem key={idx}>
                      🧾 <b className="text-indigo-200">{e.name}</b>{" "}
                      <span className="text-xs text-gray-400">({e.wallet})</span> • Age: {e.age} •{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 hover:underline text-xs ml-1"
                      >
                        Tx
                      </a>
                    </EventItem>
                  ))
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={`User Updated (${userUpdatedEvents.length})`}
              open={showUpdated}
              setOpen={setShowUpdated}
              accent="bg-gradient-to-b from-pink-500 to-purple-500"
            >
              <div className="max-h-48 overflow-y-auto">
                {userUpdatedEvents.length === 0 ? (
                  <div className="text-sm text-gray-400">No updates yet.</div>
                ) : (
                  userUpdatedEvents.map((e, idx) => (
                    <EventItem key={idx}>
                      ✏️ <span className="text-xs text-gray-400">{e.wallet}</span> changed name to{" "}
                      <b className="text-indigo-200">{e.name}</b> •{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 hover:underline text-xs ml-1"
                      >
                        Tx
                      </a>
                    </EventItem>
                  ))
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* middle column: actions */}
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-gradient-to-r from-white/3 to-white/5 backdrop-blur-sm border border-white/6 shadow-lg">
              <h3 className="font-semibold text-lg text-indigo-100 mb-3">Actions</h3>

              {/* Register */}
              <div className="mb-4">
                <div className="text-sm text-yellow-200 font-medium mb-2">Register User</div>
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 p-2 rounded-lg bg-black/20 text-sm text-white placeholder:text-gray-400"
                  />
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    type="number"
                    className="w-24 p-2 rounded-lg bg-black/20 text-sm text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={register}
                    className="py-2 px-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-sm font-semibold"
                  >
                    🧍 Register
                  </button>
                  <TxBox label="Register Tx:" hash={registerHash} colorClass="border-green-400" />
                </div>
              </div>

              {/* Update */}
              <div className="mb-4">
                <div className="text-sm text-pink-200 font-medium mb-2">Update Name</div>
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New name"
                    className="flex-1 p-2 rounded-lg bg-black/20 text-sm text-white placeholder:text-gray-400"
                  />
                  <button
                    onClick={updateUser}
                    className="py-2 px-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-sm font-semibold"
                  >
                    ✏️ Update
                  </button>
                </div>
                <TxBox label="Update Tx:" hash={updateHash} colorClass="border-pink-400" />
              </div>

              {/* Deposit */}
              <div className="mb-4">
                <div className="text-sm text-purple-200 font-medium mb-2">Deposit ETH</div>
                <div className="flex gap-2">
                  <input
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    type="number"
                    placeholder="0.01"
                    className="flex-1 p-2 rounded-lg bg-black/20 text-sm text-white placeholder:text-gray-400"
                  />
                  <button
                    onClick={deposit}
                    className="py-2 px-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg text-sm font-semibold"
                  >
                    💸 Deposit
                  </button>
                </div>
                <TxBox label="Deposit Tx:" hash={depositHash} colorClass="border-purple-400" />
              </div>

              {/* Withdraw */}
              <div className="mb-4">
                <div className="text-sm text-orange-200 font-medium mb-2">Withdraw ETH</div>
                <div className="flex gap-2">
                  <input
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    type="number"
                    placeholder="0.01"
                    className="flex-1 p-2 rounded-lg bg-black/20 text-sm text-white placeholder:text-gray-400"
                  />
                  <button
                    onClick={withdraw}
                    className="py-2 px-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-sm font-semibold"
                  >
                    💸 Withdraw
                  </button>
                </div>
                <TxBox label="Withdraw Tx:" hash={withdrawHash} colorClass="border-orange-400" />
              </div>

              {/* Owner withdraw */}
              {account &&
                ownerAddress &&
                account.toLowerCase() === ownerAddress.toLowerCase() && (
                  <div className="mt-2">
                    <button
                      onClick={withdrawAllToOwner}
                      className="w-full py-2 px-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg text-sm font-semibold"
                    >
                      💰 Owner Withdraw All
                    </button>
                    <TxBox label="Owner Tx:" hash={ownerWithdrawHash} colorClass="border-yellow-400" />
                  </div>
                )}
            </div>
          </div>

          {/* right column: user info + logs */}
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/6 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-100">My Info</h4>
                  {!currentUser ? (
                    <div className="text-sm text-gray-400 mt-2">No data. Click "Get My Info".</div>
                  ) : (
                    <div className="text-sm text-gray-200 mt-2 space-y-1">
                      <div>🧑 <b>{currentUser.name}</b></div>
                      <div>🎂 Age: {currentUser.age}</div>
                      <div>👛 {currentUser.wallet}</div>
                      <div>💰 {ethers.formatEther(currentUser.balance)} ETH</div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-300">
                  <button
                    onClick={filterMyEvents}
                    className="py-1 px-2 bg-indigo-600/80 rounded text-xs font-medium hover:brightness-110"
                  >
                    🔍 My Activity
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/6 shadow-lg">
              <h4 className="text-sm font-semibold text-indigo-100 mb-3">My Activity (connected account)</h4>
              {myEvents.length === 0 ? (
                <div className="text-sm text-gray-400">No activity found. Click "My Activity" to load.</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {myEvents.map((e, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-black/20">
                      {e.type === "Registered" && (
                        <div className="text-sm">
                          🧾 Registered as <b className="text-indigo-200">{e.name}</b> (Age {e.age}) •{""}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-300 hover:underline text-xs ml-1"
                          >
                            Tx
                          </a>
                        </div>
                      )}
                      {e.type === "Updated" && (
                        <div className="text-sm">
                          ✏️ Updated name to <b className="text-indigo-200">{e.name}</b> •{" "}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-300 hover:underline text-xs ml-1"
                          >
                            Tx
                          </a>
                        </div>
                      )}
                      {e.type === "Deposited" && (
                        <div className="text-sm">
                          💸 Deposited <b className="text-indigo-200">{e.amount}</b> ETH •{" "}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-300 hover:underline text-xs ml-1"
                          >
                            Tx
                          </a>
                        </div>
                      )}
                      {e.type === "Withdrew" && (
                        <div className="text-sm">
                          💸 Withdrew <b className="text-indigo-200">{e.amount}</b> ETH •{" "}
                          <a
                            href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-300 hover:underline text-xs ml-1"
                          >
                            Tx
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CollapsibleSection
              title={`Ether Deposits (${depositEvents.length})`}
              open={showDeposits}
              setOpen={setShowDeposits}
              accent="bg-gradient-to-b from-violet-500 to-indigo-500"
            >
              <div className="max-h-48 overflow-y-auto">
                {depositEvents.length === 0 ? (
                  <div className="text-sm text-gray-400">No deposits yet.</div>
                ) : (
                  depositEvents.map((e, idx) => (
                    <EventItem key={idx}>
                      💸 <span className="text-xs text-gray-400">{e.wallet}</span> deposited{" "}
                      <b className="text-indigo-200">{ethers.formatEther(e.amount)}</b> ETH •{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 hover:underline text-xs ml-1"
                      >
                        Tx
                      </a>
                    </EventItem>
                  ))
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={`Ether Withdrawals (${withdrawEvents.length})`}
              open={showWithdraws}
              setOpen={setShowWithdraws}
              accent="bg-gradient-to-b from-orange-400 to-amber-400"
            >
              <div className="max-h-48 overflow-y-auto">
                {withdrawEvents.length === 0 ? (
                  <div className="text-sm text-gray-400">No withdrawals yet.</div>
                ) : (
                  withdrawEvents.map((e, idx) => (
                    <EventItem key={idx}>
                      💸 <span className="text-xs text-gray-400">{e.wallet}</span> withdrew{" "}
                      <b className="text-indigo-200">{ethers.formatEther(e.amount)}</b> ETH •{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 hover:underline text-xs ml-1"
                      >
                        Tx
                      </a>
                    </EventItem>
                  ))
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title={`Owner Withdraws (${ownerWithdrawEvents.length})`}
              open={showOwnerWithdraws}
              setOpen={setShowOwnerWithdraws}
              accent="bg-gradient-to-b from-yellow-400 to-amber-400"
            >
              <div className="max-h-40 overflow-y-auto">
                {ownerWithdrawEvents.length === 0 ? (
                  <div className="text-sm text-gray-400">No owner withdraws yet.</div>
                ) : (
                  ownerWithdrawEvents.map((e, idx) => (
                    <EventItem key={idx}>
                      💰 Owner withdrew <b className="text-indigo-200">{ethers.formatEther(e.amount)}</b> ETH •{" "}
                      <a
                        href={`https://sepolia.etherscan.io/tx/${e.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 hover:underline text-xs ml-1"
                      >
                        Tx
                      </a>
                    </EventItem>
                  ))
                )}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}
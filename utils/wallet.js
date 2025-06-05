import { ethers } from "ethers";
import mysql from "./mysql";

// Functions to connect to MetaMask
// Functions to handle account/chain changes
// Automatic user registration for new wallets
// Signing functionality for transactions

/**
 * Connects to MetaMask wallet and returns provider and wallet address
 * @returns {Promise<{provider: ethers.BrowserProvider, address: string}>}
 */
export async function connectWallet() {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
    }

    // Request account access - force UI prompt with enable()
    try {
      // First try accounts - doesn't prompt if already connected
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      // If no accounts or empty array, request accounts (shows MetaMask popup)
      if (!accounts || accounts.length === 0) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
    } catch (connectionError) {
      console.error("Connection request error:", connectionError);
      throw new Error(
        connectionError.message ||
          "Failed to connect to MetaMask. Please try again."
      );
    }

    // Get accounts after connection attempt
    const accounts = await window.ethereum.request({ method: "eth_accounts" });

    if (!accounts || accounts.length === 0) {
      throw new Error(
        "No accounts found. Please unlock MetaMask and try again."
      );
    }

    // Create ethers provider
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Get the signer and address
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Log the wallet connection activity
    await logWalletActivity(address, "connect");

    return { provider, address };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
}

/**
 * Handles MetaMask account changes
 * @param {Function} callback - Function to call when accounts change
 * @returns {Function} Cleanup function to remove the event listener
 */
export function handleAccountChange(callback) {
  if (!window.ethereum) return () => {};

  const handleChange = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      callback(null);
    } else {
      // User switched accounts
      callback(accounts[0]);
    }
  };

  window.ethereum.on("accountsChanged", handleChange);

  // Return cleanup function
  return () => {
    window.ethereum.removeListener("accountsChanged", handleChange);
  };
}

/**
 * Handles MetaMask chain changes
 * @param {Function} callback - Function to call when chain changes
 * @returns {Function} Cleanup function to remove the event listener
 */
export function handleChainChange(callback) {
  if (!window.ethereum) return () => {};

  const handleChange = (chainId) => {
    callback(chainId);
  };

  window.ethereum.on("chainChanged", handleChange);

  // Return cleanup function
  return () => {
    window.ethereum.removeListener("chainChanged", handleChange);
  };
}

/**
 * Gets current connected wallet address
 * @returns {Promise<string|null>} Wallet address or null if not connected
 */
export async function getCurrentWalletAddress() {
  try {
    if (!window.ethereum) return null;

    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting current wallet address:", error);
    return null;
  }
}

/**
 * Logs wallet activity to the database
 * @param {string} walletAddress - User's wallet address
 * @param {string} action - Action performed (connect, disconnect)
 */
async function logWalletActivity(walletAddress, action) {
  try {
    // Check if user exists in database
    const { data: user } = await mysql.getUserByWalletAddress(walletAddress);

    if (user) {
      // Update last active time
      await mysql.updateUserLastActive(walletAddress);

      // Log activity
      await mysql.logActivity({
        user_id: user.id,
        action: `wallet_${action}`,
        details: `Wallet ${action} at ${new Date().toISOString()}`,
        wallet_address: walletAddress,
      });
    } else if (action === "connect") {
      // New user - create account with default holder role
      const { data: newUser, error } = await mysql.createUser({
        wallet_address: walletAddress,
        role: "holder",
        username: `User_${walletAddress.slice(0, 6)}`,
      });

      if (!error && newUser) {
        await mysql.logActivity({
          user_id: newUser.id,
          action: "account_created",
          details: `New account created via wallet connection`,
          wallet_address: walletAddress,
        });
      }
    }
  } catch (error) {
    console.error("Error logging wallet activity:", error);
  }
}

/**
 * Signs a message using the connected wallet
 * @param {string} message - Message to sign
 * @returns {Promise<string>} Signature
 */
export async function signMessage(message) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);

    return signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
}

export default {
  connectWallet,
  handleAccountChange,
  handleChainChange,
  getCurrentWalletAddress,
  signMessage,
};

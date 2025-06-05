import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ConnectButton from "./ConnectButton";
import { getWalletAddress, getUserRole, logout } from "../utils/auth";

const Navbar = () => {
  const [wallet, setWallet] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if wallet is connected on client-side
    if (typeof window !== "undefined") {
      const storedWallet = getWalletAddress();
      const storedRole = getUserRole();

      setWallet(storedWallet);
      setUserRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setWallet(null);
    setUserRole(null);
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <span className="text-primary-blue mr-2">
            <img
              src="/images/logo.svg"
              alt="CertChain Logo"
              className="h-20 w-20"
            />
          </span>
          CertChain
        </Link>

        <div className="flex items-center space-x-4">
          {wallet ? (
            <>
              <div className="text-sm text-gray-600 mr-2">
                <span className="font-medium">{userRole}</span>
                {" • "}
                <span className="font-mono">
                  {wallet.substring(0, 6)}...
                  {wallet.substring(wallet.length - 4)}
                </span>
              </div>
              {userRole && (
                <Link
                  href={`/${userRole.toLowerCase()}`}
                  className="text-primary-blue hover:text-blue-700 mr-4">
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800">
                Logout
              </button>
            </>
          ) : (
            <ConnectButton
              size="lg"
              className="flex items-center py-5 px-5 text-lg font-medium">
              Connect Wallet
            </ConnectButton>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

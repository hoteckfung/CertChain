import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ConnectButton from "./ConnectButton";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
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
          {user ? (
            <>
              <div className="text-sm text-gray-600 mr-2">
                <span className="font-medium">{user.role}</span>
                {" • "}
                <span className="font-mono">
                  {user.walletAddress.substring(0, 6)}...
                  {user.walletAddress.substring(user.walletAddress.length - 4)}
                </span>
              </div>
              {user.role && (
                <Link
                  href="/dashboard"
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

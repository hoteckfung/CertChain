import React from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Roles from "../components/Roles";
import Verification from "../components/Verification";
import CTA from "../components/CTA";
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import {
  setUserRole,
  setWalletAddress,
  setUserId,
  ROLES,
} from "../lib/auth-client";

// Import shadcn components with relative paths
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function Home() {
  const router = useRouter();

  // Function to navigate to role-specific pages in development mode
  const navigateToRole = (role) => {
    // Clear any existing auth data
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");

    // Generate a unique wallet address based on role and timestamp
    const timestamp = Date.now();
    const mockWalletAddress = `0x${role}${timestamp
      .toString(16)
      .substring(0, 8)}`;

    // Set the auth data in localStorage
    setWalletAddress(mockWalletAddress);
    setUserRole(role);
    setUserId(`dev-${role}-${timestamp}`);

    console.log(
      `Developer Access: Setting up ${role} with wallet ${mockWalletAddress} and ID dev-${role}-${timestamp}`
    );

    // Navigate to the appropriate page after a slight delay to ensure localStorage is set
    setTimeout(() => {
      router.push(`/${role.toLowerCase()}`);
    }, 100);
  };

  // Functions for quick access buttons
  const accessAsAdmin = () => navigateToRole(ROLES.ADMIN);
  const accessAsIssuer = () => navigateToRole(ROLES.ISSUER);
  const accessAsHolder = () => navigateToRole(ROLES.HOLDER);

  return (
    <div>
      <Head>
        <title>CertChain - Blockchain Certificate Management</title>
        <meta
          name="description"
          content="A decentralized platform that enables secure issuance, management, and verification of certificates using blockchain technology."
        />
      </Head>

      <Navbar />
      <Hero />
      <Features />
      <Roles />
      <Verification />
      <CTA />

      <Footer />
    </div>
  );
}

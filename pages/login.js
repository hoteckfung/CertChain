import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { isMetaMaskInstalled } from "../lib/auth-client";
import MetaMaskIcon from "../components/MetaMaskIcon";
import { AlertTriangle, Loader2, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, user, loading, error } = useAuth();
  const [connectionError, setConnectionError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const [dbStatus, setDbStatus] = useState(null);
  const [hasMetaMask, setHasMetaMask] = useState(true);

  // Redirect if already logged in (but only if user object is complete)
  useEffect(() => {
    if (user && !loading && user.walletAddress && user.role) {
      // Only redirect if we have a complete user object
      switch (user.role) {
        case "admin":
          router.push("/admin");
          break;
        case "issuer":
          router.push("/issuer");
          break;
        case "holder":
          router.push("/holder");
          break;
        default:
          router.push("/");
      }
    }
  }, [user, loading, router]);

  // Check if MetaMask is installed
  useEffect(() => {
    setHasMetaMask(isMetaMaskInstalled());
  }, []);

  // Check connection to MySQL on page load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/db-test");

        // Check if response is ok and is JSON
        if (!response.ok) {
          setDbStatus("error");
          console.error("Database test API returned error:", response.status);
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setDbStatus("error");
          console.error("Database test API returned non-JSON response");
          return;
        }

        const data = await response.json();

        if (data.status === "success") {
          setDbStatus("connected");
        } else {
          setDbStatus("error");
          console.error("Database connection error:", data.error);
        }
      } catch (error) {
        setDbStatus("error");
        console.error("Connection check error:", error);
      }
    };

    checkConnection();
  }, []);

  const handleConnectWallet = async () => {
    try {
      // Clear previous errors
      setConnectionError("");
      // Set local connecting state to prevent double-clicks
      setIsConnecting(true);

      const { success, error } = await login();

      if (!success) {
        setConnectionError(error || "Failed to connect wallet");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setConnectionError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Login - CertChain</title>
        <meta
          name="description"
          content="Connect your wallet to access the blockchain certificate platform"
        />
      </Head>

      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Connect Your Wallet
              </CardTitle>
              <CardDescription className="text-center">
                Connect with MetaMask to access the certificate platform
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Database Status Indicator */}
              {dbStatus === "error" && (
                <Alert className="mb-4 border-amber-500 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Database Connection Issue</AlertTitle>
                  <AlertDescription>
                    Cannot connect to the database. Some features may not work
                    properly.
                  </AlertDescription>
                </Alert>
              )}

              {dbStatus === "missing" && (
                <Alert className="mb-4 border-amber-500 bg-amber-50">
                  <Info className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Database Configuration Missing</AlertTitle>
                  <AlertDescription>
                    MySQL credentials are not set. Please configure your .env
                    file.
                  </AlertDescription>
                </Alert>
              )}

              {/* MetaMask Status */}
              {!hasMetaMask && (
                <Alert className="mb-4 border-amber-500 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>MetaMask Not Found</AlertTitle>
                  <AlertDescription>
                    <span className="block mb-2">
                      MetaMask is required to use this application.
                    </span>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline">
                      Install MetaMask
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleConnectWallet}
                  disabled={loading || isConnecting || !hasMetaMask}
                  className="w-full py-6 text-lg">
                  {loading || isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MetaMaskIcon className="mr-2 h-5 w-5" />
                      Connect with MetaMask
                    </>
                  )}
                </Button>

                {/* Error Message */}
                {(connectionError || error) && (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>
                      {connectionError || error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-center border-t pt-4">
              <Link
                href="/verify"
                className="text-sm text-blue-600 hover:underline">
                Verify a certificate without logging in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

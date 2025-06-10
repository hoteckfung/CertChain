import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import IssuerDashboard from "../components/dashboard/IssuerDashboard";
import HolderDashboard from "../components/dashboard/HolderDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Head from "next/head";

const DashboardPage = () => {
  const { user, loading } = useAuth();
  // Initialize with default tab - will be updated by useEffect once user loads
  const [activeTab, setActiveTab] = useState("certificates");

  // Simplified role checking - only use user.role string
  const isIssuer = user?.role === "issuer";
  const isAdmin = user?.role === "admin";
  const isHolder = user?.role === "holder";

  // Show loading state - this comes AFTER all hooks are called
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Define available tabs based on user role
  const availableTabs = [
    // Admin tabs
    { id: "users", label: "User Management", available: isAdmin },
    { id: "activity", label: "Activity Log", available: isAdmin },
    // Issuer/Holder tabs
    {
      id: "certificates",
      label: isIssuer ? "Issued Certificates" : "My Certificates",
      available: !isAdmin, // Hide for admin since they have different tabs
    },
    {
      id: "create",
      label: "Create Certificates",
      available: isIssuer && !isAdmin,
    },
    {
      id: "issue",
      label: "Issue Certificates",
      available: isIssuer && !isAdmin,
    },
  ].filter((tab) => tab.available);

  // Set correct tab based on role when user loads
  React.useEffect(() => {
    if (user?.role) {
      if (isAdmin) {
        setActiveTab("users");
      } else if (isIssuer) {
        setActiveTab("create");
      } else if (isHolder) {
        setActiveTab("certificates");
      }
    }
  }, [user?.role, isAdmin, isIssuer, isHolder]);

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>
          {isAdmin
            ? "Admin Dashboard"
            : isIssuer
            ? "Issuer Dashboard"
            : "Holder Dashboard"}{" "}
          - CertChain
        </title>
        <meta
          name="description"
          content={
            isAdmin
              ? "Manage users and monitor certificate activities"
              : isIssuer
              ? "Issue and manage certificates on the blockchain"
              : "View and manage your certificates"
          }
        />
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isAdmin
              ? "Admin Dashboard"
              : isIssuer
              ? "Issuer Dashboard"
              : "Holder Dashboard"}
          </h1>
          <p className="text-xl text-gray-600">
            {isAdmin
              ? "Manage users and monitor certificate activities"
              : isIssuer
              ? "Create, issue, and manage blockchain certificates"
              : "View, download, and share your certificates"}
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-500">Role:</span>
              <span className="ml-2 font-semibold text-blue-600 capitalize">
                {user?.role}
              </span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="text-sm text-gray-500">Wallet:</span>
              <span className="ml-2 font-mono text-sm">
                {user?.walletAddress?.slice(0, 6)}...
                {user?.walletAddress?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="flex border-b">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium ${
                  activeTab === tab.id
                    ? "text-primary-blue border-b-2 border-primary-blue"
                    : "text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Role-specific Dashboard Content */}
        {isAdmin ? (
          <AdminDashboard activeTab={activeTab} />
        ) : isIssuer ? (
          <IssuerDashboard activeTab={activeTab} />
        ) : (
          <HolderDashboard activeTab={activeTab} />
        )}
      </main>

      <Footer />
    </div>
  );
};

const ProtectedDashboard = () => (
  <ProtectedRoute allowedRoles={["admin", "issuer", "holder"]}>
    <DashboardPage />
  </ProtectedRoute>
);

export default ProtectedDashboard;

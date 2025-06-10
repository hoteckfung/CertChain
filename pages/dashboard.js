import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import IssuerDashboard from "../components/dashboard/IssuerDashboard";
import HolderDashboard from "../components/dashboard/HolderDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Head from "next/head";

const DashboardPage = () => {
  const { user, loading } = useAuth();
  // Set initial tab based on role
  const getInitialTab = () => {
    if (!user) return "certificates";
    const isIssuer = user?.roles?.isIssuer || user?.role === "issuer";
    return isIssuer ? "create" : "certificates";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Fix role checking - check both the new structure and fallback to simple role
  const isIssuer = user?.roles?.isIssuer || user?.role === "issuer";
  const isAdmin = user?.roles?.isAdmin || user?.role === "admin";
  const isHolder = user?.roles?.isHolder || user?.role === "holder";

  // Debug logging to see user structure
  React.useEffect(() => {
    if (user) {
      console.log("🔍 Dashboard User Object:", user);
      console.log("🔍 User Role:", user?.role);
      console.log("🔍 User Roles Object:", user?.roles);
    }
  }, [user]);

  // Set default tab based on role when user changes
  React.useEffect(() => {
    if (user) {
      if (isIssuer) {
        setActiveTab("create");
      } else if (isHolder) {
        setActiveTab("certificates");
      }
    }
  }, [user?.role, isIssuer, isHolder]);

  // Show loading state - this comes AFTER all hooks are called
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Define available tabs based on user role - removed Overview tab
  const availableTabs = [
    {
      id: "certificates",
      label: isIssuer ? "Issued Certificates" : "My Certificates",
      available: true,
    },
    { id: "create", label: "Create Certificate", available: isIssuer },
    { id: "issue", label: "Issue Certificate", available: isIssuer },
  ].filter((tab) => tab.available);

  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>
          {isIssuer ? "Issuer Dashboard" : "Holder Dashboard"} - CertChain
        </title>
        <meta
          name="description"
          content={
            isIssuer
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
            {isIssuer ? "Issuer Dashboard" : "Your Certificates"}
          </h1>
          <p className="text-xl text-gray-600">
            {isIssuer
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

          {/* Debug Info - Remove this after testing */}
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm">
              <strong>Debug Info:</strong>
            </p>
            <p className="text-sm">isIssuer: {isIssuer ? "true" : "false"}</p>
            <p className="text-sm">isAdmin: {isAdmin ? "true" : "false"}</p>
            <p className="text-sm">isHolder: {isHolder ? "true" : "false"}</p>
            <p className="text-sm">user.role: {user?.role}</p>
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
        {isIssuer ? (
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
  <ProtectedRoute allowedRoles={["issuer", "holder"]}>
    <DashboardPage />
  </ProtectedRoute>
);

export default ProtectedDashboard;

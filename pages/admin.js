import ProtectedRoute from "../components/ProtectedRoute";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import UserRoleManager from "../components/UserRoleManager";
import Link from "next/link";
import { useRouter } from "next/router";
import { ROLES } from "../lib/auth-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Database } from "lucide-react";
import ActivityLogViewer from "../components/ActivityLogViewer";

export default function AdminPage() {
  // State for active tab
  const [activeTab, setActiveTab] = useState("users");

  // Add user filter state
  const [userFilter, setUserFilter] = useState("all");

  // State for issuers management
  const [issuers, setIssuers] = useState([
    {
      id: 1,
      address: "0x1234...5678",
      name: "University of Blockchain",
      dateAdded: "2023-05-10",
      status: "Active",
    },
    {
      id: 2,
      address: "0x8765...4321",
      name: "Tech Institute",
      dateAdded: "2023-06-15",
      status: "Active",
    },
    {
      id: 3,
      address: "0xabcd...efgh",
      name: "Digital Academy",
      dateAdded: "2023-07-20",
      status: "Inactive",
    },
  ]);

  // State for holders
  const [holders, setHolders] = useState([
    {
      id: 1,
      address: "0xaaaa...bbbb",
      name: "John Doe",
      certificates: 3,
      lastActive: "2023-08-15",
    },
    {
      id: 2,
      address: "0xcccc...dddd",
      name: "Jane Smith",
      certificates: 2,
      lastActive: "2023-08-10",
    },
    {
      id: 3,
      address: "0xeeee...ffff",
      name: "Bob Johnson",
      certificates: 1,
      lastActive: "2023-07-28",
    },
  ]);

  // Note: Activity logs are now handled by the ActivityLogViewer component

  // State for new issuer form
  const [newIssuer, setNewIssuer] = useState({ address: "", name: "" });

  // Functions for issuer management
  const handleAddIssuer = (e) => {
    e.preventDefault();

    if (!newIssuer.address || !newIssuer.name) return;

    const issuer = {
      id: issuers.length + 1,
      address: newIssuer.address,
      name: newIssuer.name,
      dateAdded: new Date().toISOString().split("T")[0],
      status: "Active",
    };

    setIssuers([...issuers, issuer]);

    // Activity logging is now handled by API calls and the ActivityLogViewer component

    // Reset form
    setNewIssuer({ address: "", name: "" });
  };

  const handleRemoveIssuer = (id) => {
    const issuerToRemove = issuers.find((issuer) => issuer.id === id);

    // Update issuers list
    const updatedIssuers = issuers.map((issuer) =>
      issuer.id === id ? { ...issuer, status: "Inactive" } : issuer
    );

    setIssuers(updatedIssuers);

    // Activity logging is now handled by API calls and the ActivityLogViewer component
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return "";
    if (address.includes("...")) return address; // Already truncated
    return address.substr(0, 6) + "..." + address.substr(-4);
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>Admin Dashboard | CertChain</title>
          <meta
            name="description"
            content="Admin dashboard for managing issuers and monitoring certificate activities."
          />
        </Head>

        <Navbar />

        <main className="flex-grow py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
            </div>

            {/* Dashboard Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "users"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("users")}>
                    User Management
                  </button>
                  <button
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "activity"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("activity")}>
                    Activity Log
                  </button>
                  <button
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "database"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("database")}>
                    Database
                  </button>
                </nav>
              </div>
            </div>

            {/* User Role Management Tab */}
            {activeTab === "users" && (
              <div className="mb-8">
                <UserRoleManager />
              </div>
            )}

            {/* Tab Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2">
                {/* All User Details Tab */}
                {activeTab === "users" && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Users Overview</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserFilter("all")}
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            userFilter === "all"
                              ? "bg-primary-blue text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                          All Users
                        </button>
                        <button
                          onClick={() => setUserFilter("issuer")}
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            userFilter === "issuer"
                              ? "bg-primary-blue text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                          Issuer
                        </button>
                        <button
                          onClick={() => setUserFilter("holder")}
                          className={`px-3 py-1 text-sm font-medium rounded ${
                            userFilter === "holder"
                              ? "bg-primary-blue text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                          Holder
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Wallet Address
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Certificates
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Active
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(userFilter === "all" || userFilter === "issuer") &&
                            issuers.map((user) => (
                              <tr key={`issuer-${user.id}`}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 bg-primary-blue rounded-full flex items-center justify-center text-white">
                                      {user.name.charAt(0)}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                                  {user.address}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Issuer
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  -
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {user.dateAdded}
                                </td>
                              </tr>
                            ))}
                          {(userFilter === "all" || userFilter === "holder") &&
                            holders.map((user) => (
                              <tr key={`holder-${user.id}`}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 bg-gray-500 rounded-full flex items-center justify-center text-white">
                                      {user.name.charAt(0)}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                                  {user.address}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Holder
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {user.certificates}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {user.lastActive}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Activity Logs Tab */}
                {activeTab === "activity" && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
                    <ActivityLogViewer />
                  </div>
                )}

                {/* Database Setup Tab */}
                {activeTab === "database" && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Database Status
                    </h2>

                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">
                          Connection Information
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          Your application is configured to connect to the MySQL
                          database. Database tables have been manually set up in
                          MySQL Workbench.
                        </p>
                      </div>

                      <div className="border-t pt-6">
                        <h3 className="font-medium mb-2">Database Tables</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              User Table
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Stores user accounts and roles
                            </p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              Activity Log
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Tracks user activities and system events
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="md:col-span-1">
                {/* User Stats */}
                {activeTab === "users" && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      User Statistics
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-500 mb-1">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold">
                          {issuers.length + holders.length}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded">
                        <p className="text-sm text-gray-500 mb-1">Issuers</p>
                        <p className="text-2xl font-bold">{issuers.length}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {issuers.filter((i) => i.status === "Active").length}{" "}
                          active
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded">
                        <p className="text-sm text-gray-500 mb-1">Holders</p>
                        <p className="text-2xl font-bold">{holders.length}</p>
                      </div>
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Recent Registrations
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-sm">This week</p>
                            <p className="text-sm font-medium">3 users</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-sm">This month</p>
                            <p className="text-sm font-medium">12 users</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Stats */}
                {activeTab === "activity" && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Activity Overview
                    </h2>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-500 mb-1">
                          Activity Overview
                        </p>
                        <p className="text-sm text-gray-600">
                          View detailed activity logs in the Activity Log tab
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Certificate Issuance</p>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Live Data
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">Certificate Verification</p>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Real-time
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm">User Management</p>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            Blockchain
                          </span>
                        </div>
                      </div>
                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm text-gray-500 mb-2">
                          Activity Timeline
                        </p>
                        <div className="h-24 flex items-end justify-between">
                          {[...Array(7)].map((_, i) => (
                            <div key={i} className="w-8">
                              <div
                                className="bg-primary-blue rounded-t"
                                style={{
                                  height: `${
                                    Math.floor(Math.random() * 70) + 10
                                  }px`,
                                }}></div>
                              <p className="text-xs text-center mt-1">
                                {new Date(
                                  Date.now() - (6 - i) * 24 * 60 * 60 * 1000
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Database Management Card */}
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      Database Management
                    </CardTitle>
                    <CardDescription>
                      View database connection status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Check database connection and view database settings
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/admin/database">View Database Status</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}

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

  // Note: Activity logs are now handled by the ActivityLogViewer component

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
                </nav>
              </div>
            </div>

            {/* User Role Management Tab */}
            {activeTab === "users" && (
              <div className="mb-8">
                <UserRoleManager />
              </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === "activity" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
                    <ActivityLogViewer />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-1">
                  {/* Activity Stats */}
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
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}

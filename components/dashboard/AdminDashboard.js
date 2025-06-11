import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import UserRoleManager from "../UserRoleManager";
import ActivityLogViewer from "../ActivityLogViewer";
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

function AdminDashboard({ activeTab }) {
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

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "users":
        return (
          <div className="mb-8">
            <UserRoleManager />
          </div>
        );

      case "activity":
        return (
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
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
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
        );

      default:
        return (
          <div className="mb-8">
            <UserRoleManager />
          </div>
        );
    }
  };

  return <div>{renderTabContent()}</div>;
}

export default AdminDashboard;

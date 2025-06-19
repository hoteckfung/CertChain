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
import ActivityOverview from "../ActivityOverview";
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
              {/* Enhanced Activity Overview */}
              <ActivityOverview className="sticky top-4" />
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

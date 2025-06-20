import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Shield,
  Activity,
  Loader2,
  Ban,
  AlertOctagon,
} from "lucide-react";

// Activity type configurations
const ACTIVITY_TYPES = {
  certificate_issued: {
    label: "Certificate Issued",
    icon: FileText,
    color: "bg-green-100 text-green-800",
    description: "New certificate minted on blockchain",
  },
  certificate_revoked: {
    label: "Certificate Revoked",
    icon: Ban,
    color: "bg-red-100 text-red-800",
    description: "Certificate revoked by issuer",
  },
  user_login: {
    label: "User Login",
    icon: User,
    color: "bg-gray-100 text-gray-800",
    description: "User connected wallet",
  },
};

export default function ActivityLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "all",
    searchTerm: "",
  });
  const [searchInput, setSearchInput] = useState(""); // Separate state for search input
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch activity logs
  const fetchLogs = async (page = 1, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value && value !== "all"
          )
        ),
      });

      const response = await fetch(`/api/activity/get-logs?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch logs");
      }

      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, []);

  // Refresh when filters change (but not search term since we handle that manually)
  useEffect(() => {
    if (pagination.currentPage === 1) {
      fetchLogs(1);
    } else {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      fetchLogs(1);
    }
  }, [filters.type, filters.searchTerm]); // Include searchTerm to trigger refresh when search is performed

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle search - only when search icon is clicked
  const handleSearch = () => {
    handleFilterChange("searchTerm", searchInput);
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs(pagination.currentPage, false);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      type: "all",
      searchTerm: "",
    });
    setSearchInput("");
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  // Format wallet address
  const formatAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Get activity type config
  const getActivityConfig = (type) => {
    // Map uppercase activity types to lowercase keys used in ACTIVITY_TYPES
    const normalizedType =
      type === "CERTIFICATE_REVOKED"
        ? "certificate_revoked"
        : type === "CERTIFICATE_ISSUED"
        ? "certificate_issued"
        : type === "USER_LOGIN"
        ? "user_login"
        : type.toLowerCase();

    return (
      ACTIVITY_TYPES[normalizedType] || {
        label: type,
        icon: Activity,
        color: "bg-gray-100 text-gray-800",
        description: "Unknown activity type",
      }
    );
  };

  // Render activity icon
  const ActivityIcon = ({ type, className = "w-4 h-4" }) => {
    const config = getActivityConfig(type);
    const IconComponent = config.icon;
    return <IconComponent className={className} />;
  };

  // Render log entry
  const renderLogEntry = (log) => {
    const config = getActivityConfig(log.type);

    return (
      <div key={log.id} className="border-b border-gray-100 py-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${config.color}`}>
            <ActivityIcon type={log.type} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatTimestamp(log.created_at)}
                </span>
              </div>

              {log.transaction_hash && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://etherscan.io/tx/${log.transaction_hash}`,
                      "_blank"
                    )
                  }
                  className="text-xs">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Tx
                </Button>
              )}
            </div>

            <div className="mt-1">
              <p className="text-sm text-gray-900">
                {log.details || config.description}
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  From: {formatAddress(log.wallet_address)}
                </span>

                {log.target_address && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    To: {formatAddress(log.target_address)}
                  </span>
                )}

                {log.token_id && (
                  <span className="flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    Token: #{log.token_id}
                  </span>
                )}

                {log.block_number && (
                  <span className="flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    Block: {log.block_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading activity logs...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Activity Log
            <Badge variant="outline" className="ml-2">
              {pagination.totalCount} total
            </Badge>
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}>
            <RefreshCw
              className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Activity Type Filter */}
            <div className="md:col-span-3">
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {Object.entries(ACTIVITY_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search with manual trigger */}
            <div className="relative md:col-span-7">
              <Input
                placeholder="Search details, addresses..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearch}
                className="absolute right-1 top-1 h-7 w-7 p-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Clear Filters Button */}
            <div className="md:col-span-2">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-sm w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4">
            <AlertDescription>
              Error loading activity logs: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Activity Log Entries */}
        <div className="space-y-0">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No activity logs found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            logs.map(renderLogEntry)
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}>
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

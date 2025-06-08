import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { ROLES } from "../lib/auth-client";
import { useAuth } from "../contexts/AuthContext";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Trash2,
} from "lucide-react";

const UserRoleManager = () => {
  const { refreshUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Hardcoded admin address for special handling
  const adminAddress =
    "0x241dBc6d5f283964536A94e33E2323B7580CE45A".toLowerCase();

  // Fetch all users on component mount
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let usersData = data.users || [];

      // Filter by role if specified
      if (roleFilter) {
        usersData = usersData.filter((user) => user.role === roleFilter);
      }

      setUsers(usersData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load users:", err);

      // If database error, show mock data for the admin
      const mockUsers = [
        {
          id: "1",
          wallet_address: adminAddress,
          username: "Admin User",
          role: ROLES.ADMIN,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
      setUsers(mockUsers);
      setError("Database connection issue. Showing mock data for now.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setSuccess("");
    setError("");
    setUpdatingUserId(userId);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId, newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Update the local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      setSuccess(`User role updated successfully to ${newRole}`);

      // Refresh the current user's role if they were the one updated
      if (refreshUserRole) {
        await refreshUserRole();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to update role:", err);
      setError("Failed to update role: " + (err.message || "Unknown error"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId, userWalletAddress) => {
    // Show confirmation
    if (
      !confirm(
        `Are you sure you want to delete user ${userWalletAddress}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setSuccess("");
    setError("");
    setDeletingUserId(userId);

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        // Try to parse as JSON, but handle case where response is HTML
        const contentType = response.headers.get("content-type");
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error("Error parsing JSON:", jsonError);
          }
        } else {
          // Response is likely HTML (error page)
          const responseText = await response.text();
          console.error("Non-JSON response:", responseText);
          errorMessage =
            "Server returned an error page instead of JSON. Check browser console for details.";
        }

        throw new Error(errorMessage);
      }

      // Remove user from local state
      setUsers(users.filter((user) => user.id !== userId));

      setSuccess("User deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("Failed to delete user: " + (err.message || "Unknown error"));
    } finally {
      setDeletingUserId(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      user.wallet_address.toLowerCase().includes(searchLower) ||
      (user.username && user.username.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          View and modify user roles in the system
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by wallet address or username"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                <SelectItem value={ROLES.ISSUER}>Issuer</SelectItem>
                <SelectItem value={ROLES.HOLDER}>Holder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={loadUsers}
            variant="outline"
            className="w-full sm:w-auto">
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.wallet_address.substring(0, 6)}...
                      {user.wallet_address.substring(
                        user.wallet_address.length - 4
                      )}
                    </TableCell>
                    <TableCell>{user.username || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          user.role === ROLES.ADMIN
                            ? "bg-purple-100 text-purple-800"
                            : user.role === ROLES.ISSUER
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        disabled={
                          updatingUserId === user.id ||
                          user.wallet_address.toLowerCase() === adminAddress
                        }
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value)
                        }>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ROLES.ADMIN}>
                            Make Admin
                          </SelectItem>
                          <SelectItem value={ROLES.ISSUER}>
                            Make Issuer
                          </SelectItem>
                          <SelectItem value={ROLES.HOLDER}>
                            Make Holder
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {user.wallet_address.toLowerCase() === adminAddress && (
                        <p className="text-xs text-gray-500 mt-1">
                          Cannot change primary admin
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.wallet_address.toLowerCase() !== adminAddress && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingUserId === user.id}
                          onClick={() =>
                            handleDeleteUser(user.id, user.wallet_address)
                          }
                          className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">Total users: {users.length}</div>
      </CardFooter>
    </Card>
  );
};

export default UserRoleManager;

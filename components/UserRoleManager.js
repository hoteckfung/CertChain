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
import { useAuth } from "../contexts/AuthContext";
import {
  checkUserRoles,
  grantIssuerRole,
  revokeIssuerRole,
} from "../utils/contract";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const UserRoleManager = () => {
  const { refreshUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingAddress, setUpdatingAddress] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Hardcoded addresses for demonstration - in production you might get these from database or other sources
  const knownAddresses = [
    {
      address: "0x241dBc6d5f283964536A94e33E2323B7580CE45A",
    },
    {
      address: "0x6ae5ffe48c1395260cf096134e5e32725c24080a",
    },
    {
      address: "0x01178ee99F7E50957Ab591b0C7ca307E593254C9",
    },
  ];

  // Load users and their blockchain roles
  useEffect(() => {
    loadUsersWithRoles();
  }, []);

  const loadUsersWithRoles = async () => {
    setLoading(true);
    setError("");

    try {
      const usersWithRoles = [];

      for (const knownUser of knownAddresses) {
        try {
          const { success, isAdmin, isIssuer } = await checkUserRoles(
            knownUser.address
          );

          if (success) {
            // Determine primary role
            let role = "holder";
            if (isAdmin) role = "admin";
            else if (isIssuer) role = "issuer";

            usersWithRoles.push({
              id: knownUser.address,
              wallet_address: knownUser.address,
              role: role,
              isAdmin,
              isIssuer,
              last_active: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error(`Error checking roles for ${knownUser.address}:`, err);
        }
      }

      setUsers(usersWithRoles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load users with roles:", err);
      setError("Failed to load blockchain roles: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockchainRoleChange = async (walletAddress, newRole) => {
    setSuccess("");
    setError("");
    setUpdatingAddress(walletAddress);

    try {
      let result;

      // Get current roles
      const currentRoles = await checkUserRoles(walletAddress);
      if (!currentRoles.success) {
        throw new Error("Failed to check current roles");
      }

      // Determine what blockchain operation to perform
      if (newRole === "issuer") {
        if (!currentRoles.isIssuer) {
          result = await grantIssuerRole(walletAddress);
        } else {
          throw new Error("User already has issuer role");
        }
      } else if (newRole === "holder") {
        if (currentRoles.isIssuer) {
          result = await revokeIssuerRole(walletAddress);
        } else {
          throw new Error("User is already a holder");
        }
      } else if (newRole === "admin") {
        throw new Error(
          "Admin roles cannot be granted through this interface. Only the contract deployer can be admin."
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Blockchain transaction failed");
      }

      setSuccess(
        `Role updated successfully! Transaction: ${result.transactionHash}`
      );

      // Reload users after successful role change
      await loadUsersWithRoles();

      // Refresh current user's role if they were the one updated
      if (refreshUserRole) {
        await refreshUserRole();
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (err) {
      console.error("Failed to update blockchain role:", err);
      setError("Failed to update role: " + (err.message || "Unknown error"));
    } finally {
      setUpdatingAddress(null);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesRole;
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
                placeholder="Search by wallet address"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="issuer">Issuer</SelectItem>
                <SelectItem value="holder">Holder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={loadUsersWithRoles}
            variant="outline"
            className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
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
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "issuer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        disabled={
                          updatingAddress === user.wallet_address ||
                          user.role === "admin"
                        }
                        onValueChange={(value) =>
                          handleBlockchainRoleChange(user.wallet_address, value)
                        }>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="issuer">Make Issuer</SelectItem>
                          <SelectItem value="holder">Make Holder</SelectItem>
                        </SelectContent>
                      </Select>
                      {user.role === "admin" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Cannot change primary admin
                        </p>
                      )}
                      {updatingAddress === user.wallet_address && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Updating on blockchain...
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://etherscan.io/address/${user.wallet_address}`,
                            "_blank"
                          )
                        }
                        className="text-blue-600 hover:text-blue-800">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">
          Total users: {users.length}
          {lastUpdated && (
            <span className="ml-4">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          Role changes require blockchain transactions
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserRoleManager;

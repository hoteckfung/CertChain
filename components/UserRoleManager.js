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
import { isResultUserRejection } from "../utils/errorHandling";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  Users,
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

  // Load users and their blockchain roles
  useEffect(() => {
    loadUsersWithRoles();
  }, []);

  const loadUsersWithRoles = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all users from database instead of using hardcoded addresses
      const response = await fetch("/api/admin/users-with-blockchain-roles");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch users");
      }

      if (result.success && result.users) {
        // Transform the data to match our component's expected format
        const formattedUsers = result.users.map((user) => ({
          id: user.wallet_address,
          wallet_address: user.wallet_address,
          role: determineDisplayRole(user.blockchainRole),
          isAdmin: user.blockchainRole?.isAdmin || false,
          isIssuer: user.blockchainRole?.isIssuer || false,
          last_active: user.last_active,
          created_at: user.created_at,
        }));

        setUsers(formattedUsers);
        console.log(`📊 Loaded ${formattedUsers.length} users from database`);
      } else {
        throw new Error("Invalid response format");
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load users with roles:", err);
      setError("Failed to load users: " + err.message);

      // Fallback to empty array on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine display role from blockchain roles
  const determineDisplayRole = (blockchainRole) => {
    if (!blockchainRole) return "holder";

    if (blockchainRole.isAdmin) return "admin";
    if (blockchainRole.isIssuer) return "issuer";
    return "holder";
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

          // Role granted activity logging removed as per requirement
        } else {
          throw new Error("User already has issuer role");
        }
      } else if (newRole === "holder") {
        if (currentRoles.isIssuer) {
          result = await revokeIssuerRole(walletAddress);

          // Role revoked activity logging removed as per requirement
        } else {
          throw new Error("User is already a holder");
        }
      } else if (newRole === "admin") {
        throw new Error(
          "Admin roles cannot be granted through this interface. Only the contract deployer can be admin."
        );
      }

      if (!result.success) {
        // Handle user rejection gracefully - don't throw error
        if (isResultUserRejection(result)) {
          setError("Transaction was cancelled by user.");
          return; // Exit gracefully without throwing
        }
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

        {/* Admin Role Information */}
        <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Admin Role:</strong> Admin status is determined by the
            blockchain smart contract (deployer address). Database only stores
            'issuer' and 'holder' roles. Admin permissions are automatically
            granted to the contract deployer.
          </AlertDescription>
        </Alert>

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

        {lastUpdated && (
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {lastUpdated.toLocaleString()}
            {users.length === 0 && (
              <span className="ml-2 text-blue-600">
                • Connect new wallets to see them appear here automatically
              </span>
            )}
          </div>
        )}

        {users.length === 0 && !loading && (
          <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>No users found.</strong>
              <br />
              • New wallet connections will automatically appear here
              <br />
              • Connect with MetaMask to add your wallet to the system
              <br />• The deployer address will automatically get admin role
            </AlertDescription>
          </Alert>
        )}

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

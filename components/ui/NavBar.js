import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get navigation links based on user role
  const getNavLinks = () => {
    if (!user) {
      return [
        { name: "Home", href: "/" },
        { name: "Verify Certificate", href: "/verify" },
      ];
    }

    const links = [
      { name: "Home", href: "/" },
      { name: "Verify Certificate", href: "/verify" },
    ];

    switch (user.role) {
      case "admin":
        links.push(
          { name: "Admin Dashboard", href: "/admin" },
          { name: "Issuers", href: "/admin/issuers" },
          { name: "Users", href: "/admin/users" }
        );
        break;
      case "issuer":
        links.push(
          { name: "Issuer Dashboard", href: "/issuer" },
          { name: "Issue Certificates", href: "/issuer/issue" },
          { name: "My Certificates", href: "/issuer/certificates" }
        );
        break;
      case "holder":
        links.push(
          { name: "My Dashboard", href: "/holder" },
          { name: "My Certificates", href: "/holder/certificates" }
        );
        break;
      default:
        break;
    }

    return links;
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Site Title */}
          <div className="flex items-center">
            <Link href="/">
              <span className="flex-shrink-0 text-xl font-bold cursor-pointer">
                CertChain
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {getNavLinks().map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === link.href
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallet Connection Status */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <div className="text-sm text-gray-300 mr-4">
                    <span className="text-xs text-gray-400 block">
                      {user.role.toUpperCase()}
                    </span>
                    {formatWalletAddress(user.wallet_address)}
                  </div>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium">
                    Disconnect
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <span className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium cursor-pointer">
                    Connect Wallet
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {getNavLinks().map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  router.pathname === link.href
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}>
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile wallet status */}
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              {isAuthenticated ? (
                <div className="w-full">
                  <div className="text-base font-medium leading-none text-white mb-2">
                    {user.username || "User"}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-400 mb-3">
                    {formatWalletAddress(user.wallet_address)}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium">
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <span className="w-full block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium text-center cursor-pointer">
                    Connect Wallet
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

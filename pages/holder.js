import ProtectedRoute from "../components/ProtectedRoute";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { getIPFSUrl, isValidIPFSHash } from "../utils/ipfs";
import QRCode from "qrcode.react";
import useNotification from "../utils/useNotification";
import Notification from "../components/Notification";
import { getHolderCertificates } from "../utils/dataOperations";

export default function HolderPage() {
  // Notification state
  const {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useNotification();

  // User profile states
  const [activeTab, setActiveTab] = useState("certificates");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("John Doe");
  const [profileEmail, setProfileEmail] = useState("john.doe@example.com");
  const [profileWallet, setProfileWallet] = useState(
    "0xD8f24D419153E5D03d614c5155f900f4B5C8A65a"
  );
  const [profilePhone, setProfilePhone] = useState("+1 (555) 123-4567");

  // Certificate states
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const [filter, setFilter] = useState("all");

  // Load sample certificates (would be loaded from blockchain/API in production)
  useEffect(() => {
    async function fetchCertificates() {
      const certificates = await getHolderCertificates();
      if (certificates && certificates.length > 0) {
        setCertificates(certificates);
      }
    }

    fetchCertificates();
  }, []);

  // View certificate details
  const viewCertificate = (cert) => {
    setSelectedCertificate(cert);
  };

  // Close certificate viewer
  const closeViewer = () => {
    setSelectedCertificate(null);
  };

  // Save profile changes
  const saveProfileChanges = () => {
    // In a real app, would save to an API/database
    setIsEditingProfile(false);
    showSuccess("Profile updated successfully!");
  };

  // Handle certificate download
  const handleDownload = (cert, format) => {
    setIsDownloading(true);

    // Simulate download process
    setTimeout(() => {
      // In production would use IPFS URL to fetch and download the file
      const url = getIPFSUrl(cert.hash, true);
      console.log(`Downloading certificate in ${format} format from: ${url}`);

      // Show notification for download completion
      showSuccess(
        `Certificate "${
          cert.title
        }" downloaded in ${format.toUpperCase()} format`
      );
      setIsDownloading(false);
    }, 1500);
  };

  // Generate share link
  const getShareLink = (cert) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify?hash=${cert.hash}`;
  };

  // Filter certificates based on status
  const filteredCertificates = certificates.filter((cert) => {
    if (filter === "all") return true;
    return cert.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <ProtectedRoute allowedRoles={["holder"]}>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>My Certificates | CertChain</title>
          <meta
            name="description"
            content="View and manage your blockchain certificates."
          />
        </Head>

        <Navbar />

        {/* Notification component */}
        <Notification
          show={notification.show}
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />

        <main className="flex-grow py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                My Certificates
              </h1>
              <div className="text-sm text-gray-500">
                Logged in as <span className="font-medium">Holder</span>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-8">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("certificates")}
                  className={`px-6 py-3 font-medium ${
                    activeTab === "certificates"
                      ? "text-primary-blue border-b-2 border-primary-blue"
                      : "text-gray-500"
                  }`}>
                  My Certificates
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-6 py-3 font-medium ${
                    activeTab === "profile"
                      ? "text-primary-blue border-b-2 border-primary-blue"
                      : "text-gray-500"
                  }`}>
                  Profile
                </button>
              </div>
            </div>

            {/* Certificates Tab */}
            {activeTab === "certificates" && (
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      Certificate Portfolio
                    </h2>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        Filter:
                      </span>
                      <select
                        className="p-2 border border-gray-300 rounded-md text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">All Certificates</option>
                        <option value="issued">Issued</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {filteredCertificates.length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-500">
                        {certificates.length === 0
                          ? "Loading your certificates..."
                          : "No certificates match the selected filter."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredCertificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-medium text-gray-800">
                              {cert.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                cert.status === "Issued"
                                  ? "bg-green-100 text-green-800"
                                  : cert.status === "Verified"
                                  ? "bg-blue-100 text-blue-800"
                                  : cert.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                              {cert.status}
                            </span>
                          </div>
                          <div className="mb-4">
                            <p className="text-gray-600 text-sm">
                              <span className="font-medium">Issuer:</span>{" "}
                              {cert.issuer}
                            </p>
                            <p className="text-gray-600 text-sm">
                              <span className="font-medium">Issue Date:</span>{" "}
                              {cert.issueDate}
                            </p>
                            <p className="text-gray-600 text-sm">
                              <span className="font-medium">Type:</span>{" "}
                              {cert.type}
                            </p>
                          </div>
                          <div className="border-t border-gray-200 pt-4 flex justify-between">
                            <div className="space-x-2">
                              <button
                                onClick={() => viewCertificate(cert)}
                                className="px-3 py-1 bg-primary-blue text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCertificate(cert);
                                  setShareModalOpen(true);
                                }}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
                                Share
                              </button>
                            </div>
                            <div className="relative">
                              <select
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors appearance-none pr-8"
                                value={downloadFormat}
                                onChange={(e) =>
                                  setDownloadFormat(e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}>
                                <option value="pdf">PDF</option>
                                <option value="jpg">JPG</option>
                                <option value="png">PNG</option>
                                <option value="qr">QR Code</option>
                              </select>
                              <button
                                onClick={() =>
                                  handleDownload(cert, downloadFormat)
                                }
                                disabled={isDownloading}
                                className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Verification Process
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-send-icon lucide-send">
                          <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                          <path d="m21.854 2.147-10.94 10.939" />
                        </svg>
                      </div>
                      <h3 className="font-medium">Issued</h3>
                      <p className="text-sm text-gray-500">
                        Certificate is issued to your wallet
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-share-icon lucide-share">
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" x2="12" y1="2" y2="15" />
                        </svg>
                      </div>
                      <h3 className="font-medium">Shared</h3>
                      <p className="text-sm text-gray-500">
                        You share it with a verifier
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-file-check-icon lucide-file-check">
                          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                          <path d="m9 15 2 2 4-4" />
                        </svg>
                      </div>
                      <h3 className="font-medium">Verified</h3>
                      <p className="text-sm text-gray-500">
                        Verifier validates on blockchain
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 text-primary-blue rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-badge-check-icon lucide-badge-check">
                          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <h3 className="font-medium">Accepted</h3>
                      <p className="text-sm text-gray-500">
                        Certificate authenticity confirmed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">
                        Personal Profile
                      </h2>
                      <Button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        variant={isEditingProfile ? "secondary" : "primary"}>
                        {isEditingProfile ? "Cancel" : "Edit Profile"}
                      </Button>
                    </div>

                    <div className="border-b border-gray-200 pb-6 mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        Account Information
                      </h3>
                      {isEditingProfile ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="fullName"
                              className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="fullName"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                              value={profileEmail}
                              onChange={(e) => setProfileEmail(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="wallet"
                              className="block text-sm font-medium text-gray-700 mb-1">
                              Wallet Address
                            </label>
                            <input
                              type="text"
                              id="wallet"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue bg-gray-100"
                              value={profileWallet}
                              disabled
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Your wallet address cannot be changed
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium">{profileName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Email Address
                            </p>
                            <p className="font-medium">{profileEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Phone Number
                            </p>
                            <p className="font-medium">{profilePhone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Wallet Address
                            </p>
                            <p className="font-mono text-sm">{profileWallet}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isEditingProfile && (
                      <div className="flex justify-end">
                        <Button onClick={saveProfileChanges}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-medium mb-4">Wallet Status</h3>
                    <div className="flex items-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Connected</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Your wallet is securely connected to CertChain and ready
                      to receive certificates.
                    </p>
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium mb-2">Your Certificates</h4>
                      <div className="flex justify-between text-sm">
                        <span>Total Certificates</span>
                        <span className="font-medium">
                          {certificates.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-medium mb-4">
                      Privacy Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor="publicProfile" className="text-sm">
                          Public Profile
                        </label>
                        <input
                          type="checkbox"
                          id="publicProfile"
                          className="h-4 w-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                          defaultChecked
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label htmlFor="showCertificates" className="text-sm">
                          Show Certificates Publicly
                        </label>
                        <input
                          type="checkbox"
                          id="showCertificates"
                          className="h-4 w-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                          defaultChecked
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="receiveNotifications"
                          className="text-sm">
                          Receive Email Notifications
                        </label>
                        <input
                          type="checkbox"
                          id="receiveNotifications"
                          className="h-4 w-4 text-primary-blue focus:ring-primary-blue border-gray-300 rounded"
                          defaultChecked
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Certificate Viewer Modal */}
        {selectedCertificate && !shareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Certificate Details
                  </h2>
                  <button
                    onClick={closeViewer}
                    className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Certificate Preview Image */}
                <div className="mb-6 bg-gray-100 p-4 rounded-md flex items-center justify-center">
                  <div className="bg-white shadow-md p-8 w-full max-w-2xl aspect-[4/3] flex flex-col items-center justify-center text-center">
                    <div className="text-primary-blue text-lg mb-2">
                      {selectedCertificate.issuer}
                    </div>
                    <div className="text-gray-400 mb-2">
                      proudly presents this
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {selectedCertificate.type.toUpperCase()}
                    </div>
                    <div className="text-gray-400 mb-4">to</div>
                    <div className="text-xl font-medium mb-6">
                      {profileName}
                    </div>
                    <div className="text-gray-600 mb-8">
                      {selectedCertificate.title}
                    </div>
                    <div className="flex justify-between w-full">
                      <div className="text-sm text-gray-500">
                        Date: {selectedCertificate.issueDate}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {selectedCertificate.id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Certificate Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Title</p>
                        <p className="font-medium">
                          {selectedCertificate.title}
                        </p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Issuer</p>
                        <p className="font-medium">
                          {selectedCertificate.issuer}
                        </p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">
                          {selectedCertificate.type}
                        </p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Issue Date</p>
                        <p className="font-medium">
                          {selectedCertificate.issueDate}
                        </p>
                      </div>
                      {selectedCertificate.expiryDate && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">Expiry Date</p>
                          <p className="font-medium">
                            {selectedCertificate.expiryDate}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p
                          className={`font-medium ${
                            selectedCertificate.status === "Issued"
                              ? "text-green-600"
                              : selectedCertificate.status === "Verified"
                              ? "text-blue-600"
                              : selectedCertificate.status === "Pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}>
                          {selectedCertificate.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Blockchain Verification
                    </h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="flex items-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-500 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">
                            {selectedCertificate.status === "Pending"
                              ? "Pending Verification"
                              : "Verified on Blockchain"}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-500 mb-1">IPFS Hash</p>
                        <div className="flex items-center">
                          <p className="font-mono text-sm break-all">
                            {selectedCertificate.hash}
                          </p>
                          <button
                            onClick={() =>
                              window.open(
                                getIPFSUrl(selectedCertificate.hash, true),
                                "_blank"
                              )
                            }
                            className="ml-2 text-primary-blue hover:text-blue-700 flex-shrink-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">
                          Description
                        </p>
                        <p className="text-sm">
                          {selectedCertificate.description}
                        </p>
                      </div>

                      {selectedCertificate.metadata && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-1">Metadata</p>
                          <div className="text-sm">
                            {Object.entries(selectedCertificate.metadata).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between py-1 border-b border-gray-100">
                                  <span className="capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}:
                                  </span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="secondary" onClick={closeViewer}>
                    Close
                  </Button>
                  <div className="space-x-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShareModalOpen(true);
                      }}>
                      Share Certificate
                    </Button>
                    <Button
                      onClick={() =>
                        handleDownload(selectedCertificate, downloadFormat)
                      }>
                      Download Certificate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {selectedCertificate && shareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Share Certificate
                  </h2>
                  <button
                    onClick={() => {
                      setShareModalOpen(false);
                      setSelectedCertificate(null);
                    }}
                    className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <p className="mb-4 text-gray-600">
                  Share your certificate with verifiers using the following link
                  or QR code:
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                      value={getShareLink(selectedCertificate)}
                      readOnly
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          getShareLink(selectedCertificate)
                        );
                        showInfo("Link copied to clipboard!");
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-r-md border border-gray-300 border-l-0 hover:bg-gray-200">
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="block text-sm font-medium text-gray-700 mb-3">
                    QR Code
                  </p>
                  <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-md">
                    <QRCode
                      value={getShareLink(selectedCertificate)}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShareModalOpen(false);
                      setSelectedCertificate(null);
                    }}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // In a real app, would generate and download the QR code
                      showSuccess("QR Code downloaded successfully!");
                      setShareModalOpen(false);
                      setSelectedCertificate(null);
                    }}>
                    Download QR Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}

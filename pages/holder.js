import ProtectedRoute from "../components/ProtectedRoute";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { getIPFSUrl, isValidIPFSHash } from "../utils/ipfs";
import { QRCodeSVG as QRCode } from "qrcode.react";
import jsPDF from "jspdf";
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

  const [activeTab, setActiveTab] = useState("certificates");

  // Certificate states
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showQRSection, setShowQRSection] = useState(false);

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

  // Handle certificate download with format conversion
  const handleDownload = async (cert, requestedFormat) => {
    setIsDownloading(true);

    try {
      const url = getIPFSUrl(cert.hash, true);

      // Fetch the file from IPFS
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch certificate from IPFS");
      }

      const contentType = response.headers.get("content-type") || "";
      const blob = await response.blob();

      // If the original format matches the requested format, download directly
      if (
        (requestedFormat === "pdf" &&
          contentType.includes("application/pdf")) ||
        (requestedFormat === "jpg" &&
          (contentType.includes("image/jpeg") ||
            contentType.includes("image/jpg"))) ||
        (requestedFormat === "png" && contentType.includes("image/png"))
      ) {
        // Direct download without conversion
        downloadBlob(
          blob,
          `certificate-${cert.title.replace(/[^a-zA-Z0-9]/g, "_")}-${
            cert.id
          }.${requestedFormat}`
        );
        showSuccess(
          `Certificate "${
            cert.title
          }" downloaded as ${requestedFormat.toUpperCase()} file!`
        );
        return;
      }

      // Handle format conversion
      if (
        contentType.includes("image/") &&
        (requestedFormat === "jpg" || requestedFormat === "png")
      ) {
        // Convert between image formats
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          // Set background color for JPG (since JPG doesn't support transparency)
          if (requestedFormat === "jpg") {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          // Convert to blob and download
          canvas.toBlob(
            (convertedBlob) => {
              downloadBlob(
                convertedBlob,
                `certificate-${cert.title.replace(/[^a-zA-Z0-9]/g, "_")}-${
                  cert.id
                }.${requestedFormat}`
              );
              showSuccess(
                `Certificate "${
                  cert.title
                }" converted and downloaded as ${requestedFormat.toUpperCase()} file!`
              );
            },
            `image/${requestedFormat === "jpg" ? "jpeg" : requestedFormat}`,
            0.95
          );
        };

        img.onerror = () => {
          throw new Error(
            `Failed to load image for conversion to ${requestedFormat.toUpperCase()}`
          );
        };

        img.src = URL.createObjectURL(blob);
      } else if (contentType.includes("image/") && requestedFormat === "pdf") {
        // Convert image to PDF using jsPDF
        const img = new Image();
        img.onload = () => {
          try {
            // Create a new jsPDF instance
            const pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
            });

            // Get A4 dimensions in mm
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Calculate image dimensions to fit the page with margins
            const margin = 20; // 20mm margin
            const maxWidth = pageWidth - margin * 2;
            const maxHeight = pageHeight - margin * 2;

            // Calculate scaling to fit image on page
            let imgWidth = img.width * 0.264583; // Convert pixels to mm (96 DPI)
            let imgHeight = img.height * 0.264583;

            if (imgWidth > maxWidth || imgHeight > maxHeight) {
              const scale = Math.min(
                maxWidth / imgWidth,
                maxHeight / imgHeight
              );
              imgWidth *= scale;
              imgHeight *= scale;
            }

            // Center the image on the page
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            // Add the image to PDF
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw white background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            // Get image data as base64
            const imgData = canvas.toDataURL("image/jpeg", 0.95);

            // Add image to PDF
            pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

            // Add certificate metadata as text (optional)
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Certificate: ${cert.title}`, margin, pageHeight - 15);
            pdf.text(`Issuer: ${cert.issuer}`, margin, pageHeight - 10);
            pdf.text(`Issue Date: ${cert.issueDate}`, margin, pageHeight - 5);

            // Generate and download the PDF
            const pdfBlob = pdf.output("blob");
            downloadBlob(
              pdfBlob,
              `certificate-${cert.title.replace(/[^a-zA-Z0-9]/g, "_")}-${
                cert.id
              }.pdf`
            );

            showSuccess(
              `Certificate "${cert.title}" converted and downloaded as PDF file!`
            );
          } catch (error) {
            console.error("PDF conversion error:", error);
            // Fallback to original file with PDF extension
            downloadBlob(
              blob,
              `certificate-${cert.title.replace(/[^a-zA-Z0-9]/g, "_")}-${
                cert.id
              }.pdf`
            );
            showSuccess(
              `Certificate "${cert.title}" downloaded with PDF extension!`
            );
          }
        };

        img.onerror = () => {
          // Fallback to original file with PDF extension
          downloadBlob(
            blob,
            `certificate-${cert.title.replace(/[^a-zA-Z0-9]/g, "_")}-${
              cert.id
            }.pdf`
          );
          showSuccess(
            `Certificate "${cert.title}" downloaded with PDF extension!`
          );
        };

        img.src = URL.createObjectURL(blob);
      } else {
        // Fallback: download with requested extension but original format
        downloadBlob(
          blob,
          `certificate-${cert.title.replace(/[^a-zA-Z0-9]/g, "_")}-${
            cert.id
          }.${requestedFormat}`
        );
        showSuccess(
          `Certificate "${
            cert.title
          }" downloaded with ${requestedFormat.toUpperCase()} extension!`
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      showError(`Failed to download certificate: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper function to download blob
  const downloadBlob = (blob, filename) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  // Generate share link
  const getShareLink = (cert) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify?hash=${cert.hash}`;
  };

  // Copy text to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed: ", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Filter certificates based on status and search query
  const filteredCertificates = certificates.filter((cert) => {
    // Filter by status
    const statusMatch =
      filter === "all" || cert.status.toLowerCase() === filter.toLowerCase();

    // Filter by search query (search in title, issuer, type, and description)
    const searchMatch =
      searchQuery === "" ||
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cert.description &&
        cert.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && searchMatch;
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
              </div>
            </div>

            {/* Certificates Tab */}
            {activeTab === "certificates" && (
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold">
                      Certificate Portfolio
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-4 w-4 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Search certificates..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <svg
                              className="h-4 w-4 text-gray-400 hover:text-gray-600"
                              xmlns="http://www.w3.org/2000/svg"
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
                        )}
                      </div>
                      {/* Status Filter */}
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
                          : searchQuery || filter !== "all"
                          ? "No certificates match your search criteria."
                          : "No certificates found."}
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
                          <div className="border-t border-gray-200 pt-4 flex justify-center">
                            <button
                              onClick={() => viewCertificate(cert)}
                              className="px-4 py-2 bg-primary-blue text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                              View
                            </button>
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
          </div>
        </main>

        {/* Certificate Viewer Modal */}
        {selectedCertificate && !shareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto">
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
                <div className="mb-6 bg-gray-100 p-4 rounded-md">
                  {selectedCertificate.hash &&
                  isValidIPFSHash(selectedCertificate.hash) ? (
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                      <div className="w-full h-[600px] flex items-center justify-center p-4">
                        <img
                          src={getIPFSUrl(selectedCertificate.hash, true)}
                          alt="Certificate Preview"
                          className="max-w-full max-h-full object-contain rounded shadow-md"
                          style={{
                            imageRendering: "high-quality",
                          }}
                          onError={(e) => {
                            // Fallback to generic certificate display if IPFS fails
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                        {/* Fallback generic certificate display */}
                        <div className="hidden bg-white shadow-md p-8 w-full max-w-lg mx-auto flex flex-col items-center justify-center text-center rounded">
                          <div className="text-primary-blue text-lg mb-2">
                            {selectedCertificate.issuer}
                          </div>
                          <div className="text-gray-400 mb-2">
                            proudly presents this
                          </div>
                          <div className="text-2xl font-bold mb-1">
                            CERTIFICATE
                          </div>
                          <div className="text-gray-400 mb-4">to</div>
                          <div className="text-xl font-medium mb-6">
                            {selectedCertificate.metadata?.holderName ||
                              "Certificate Holder"}
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
                    </div>
                  ) : (
                    <div className="bg-white shadow-md p-8 w-full aspect-[4/3] flex flex-col items-center justify-center text-center">
                      <div className="text-primary-blue text-lg mb-2">
                        {selectedCertificate.issuer}
                      </div>
                      <div className="text-gray-400 mb-2">
                        proudly presents this
                      </div>
                      <div className="text-2xl font-bold mb-1">CERTIFICATE</div>
                      <div className="text-gray-400 mb-4">to</div>
                      <div className="text-xl font-medium mb-6">
                        {selectedCertificate.metadata?.holderName ||
                          "Certificate Holder"}
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
                  )}
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
                            className="ml-2 text-primary-blue hover:text-blue-700 flex-shrink-0"
                            title="View on IPFS">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(selectedCertificate.hash)
                            }
                            className="ml-2 text-primary-blue hover:text-blue-700 p-1"
                            title="Copy IPFS hash to clipboard">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          {showCopiedMessage && (
                            <span className="ml-2 text-green-600 text-sm">
                              Copied!
                            </span>
                          )}
                        </div>
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
                  <Button
                    onClick={() => {
                      setShareModalOpen(true);
                    }}>
                    Share Certificate
                  </Button>
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

                <p className="mb-6 text-gray-600">
                  Choose how you want to share your certificate:
                </p>

                {/* Share Format Options */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handleDownload(selectedCertificate, "pdf")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-red-500 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">PDF</p>
                    <p className="text-xs text-gray-500">Download as PDF</p>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedCertificate, "jpg")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-blue-500 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">JPG</p>
                    <p className="text-xs text-gray-500">Download as JPG</p>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedCertificate, "png")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-green-500 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">PNG</p>
                    <p className="text-xs text-gray-500">Download as PNG</p>
                  </button>

                  <button
                    onClick={() => {
                      // Show QR section
                      setShowQRSection(true);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className="text-purple-500 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M3,11H5V13H3V11M11,5H13V9H11V5M9,11H13V15H11V13H9V11M15,11H17V13H15V11M19,11H21V13H19V11M12,15H14V17H12V15M3,5H9V9H7V7H5V9H3V5M3,15H9V21H7V19H5V21H3V15M15,5H21V9H19V7H17V9H15V5Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">QR Code</p>
                    <p className="text-xs text-gray-500">Generate QR Code</p>
                  </button>
                </div>

                {/* QR Code Section - Hidden by default */}
                {showQRSection && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        QR Code & Link
                      </p>
                      <button
                        onClick={() => setShowQRSection(false)}
                        className="text-gray-400 hover:text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
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

                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1">
                        Verification Link
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
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
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-r-md border border-gray-300 border-l-0 hover:bg-gray-200 text-sm">
                          Copy
                        </button>
                      </div>
                    </div>

                    <div
                      id="qr-code"
                      className="flex justify-center p-4 bg-white border border-gray-200 rounded-md mb-4">
                      <QRCode
                        value={getShareLink(selectedCertificate)}
                        size={180}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          const shareText = `Check out my certificate: ${
                            selectedCertificate.title
                          } from ${
                            selectedCertificate.issuer
                          }. Verify it here: ${getShareLink(
                            selectedCertificate
                          )}`;

                          if (navigator.share) {
                            navigator.share({
                              title: `Certificate: ${selectedCertificate.title}`,
                              text: shareText,
                              url: getShareLink(selectedCertificate),
                            });
                          } else {
                            navigator.clipboard.writeText(shareText);
                            showSuccess("Share message copied to clipboard!");
                          }
                        }}>
                        Share Link
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          const svg = document.querySelector("#qr-code svg");
                          if (svg) {
                            const svgData =
                              new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const img = new Image();

                            canvas.width = 200;
                            canvas.height = 200;

                            img.onload = () => {
                              ctx.fillStyle = "white";
                              ctx.fillRect(0, 0, canvas.width, canvas.height);
                              ctx.drawImage(img, 0, 0);

                              const link = document.createElement("a");
                              link.download = `certificate-${selectedCertificate.id}-qr.png`;
                              link.href = canvas.toDataURL("image/png");
                              link.click();
                              showSuccess("QR Code downloaded successfully!");
                            };

                            img.src =
                              "data:image/svg+xml;base64," + btoa(svgData);
                          }
                        }}>
                        Download QR
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShareModalOpen(false);
                      setSelectedCertificate(null);
                      setShowQRSection(false);
                    }}>
                    Close
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

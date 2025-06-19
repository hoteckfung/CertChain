import React, { useState, useEffect } from "react";
import { getIPFSUrl, isValidIPFSHash } from "../../utils/ipfs";
import { QRCodeSVG as QRCode } from "qrcode.react";
import jsPDF from "jspdf";
import useNotification from "../../utils/useNotification";
import Notification from "../Notification";
import { getHolderCertificates } from "../../utils/dataOperations";
import { verifyCertificateByHash } from "../../utils/contract";
import Button from "../Button";

export default function HolderDashboard({ activeTab, user }) {
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

  // Certificate states
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showQRSection, setShowQRSection] = useState(false);
  const [originalFormat, setOriginalFormat] = useState(null);

  // Load certificates
  useEffect(() => {
    async function fetchCertificates() {
      if (!user?.walletAddress) {
        console.warn("No wallet address available for fetching certificates");
        return;
      }

      try {
        const certificates = await getHolderCertificates(user.walletAddress);
        if (certificates && certificates.length > 0) {
          // Verify each certificate on blockchain to get current status
          const verifiedCertificates = await Promise.all(
            certificates.map(async (cert) => {
              try {
                // Only verify if we have a valid IPFS hash
                if (cert.hash && isValidIPFSHash(cert.hash)) {
                  const blockchainResult = await verifyCertificateByHash(
                    cert.hash
                  );
                  if (blockchainResult.success && blockchainResult.exists) {
                    // Update status based on blockchain verification
                    return {
                      ...cert,
                      status: blockchainResult.isValid ? "issued" : "revoked",
                      blockchainVerified: true,
                    };
                  }
                }
                // If blockchain verification fails, keep original status
                return {
                  ...cert,
                  blockchainVerified: false,
                };
              } catch (error) {
                console.warn(`Failed to verify certificate ${cert.id}:`, error);
                return {
                  ...cert,
                  blockchainVerified: false,
                };
              }
            })
          );
          setCertificates(verifiedCertificates);
        } else {
          setCertificates([]);
        }
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
        showError("Failed to load certificates");
        setCertificates([]);
      }
    }

    fetchCertificates();
  }, [user?.walletAddress]);

  // Core functions
  const viewCertificate = (cert) => setSelectedCertificate(cert);
  const closeViewer = () => setSelectedCertificate(null);

  // Helper function to get certificate format from MIME type
  const detectCertificateFormat = async (hash) => {
    try {
      const url = getIPFSUrl(hash, true);
      const response = await fetch(url, { method: "HEAD" });
      const mimeType = response.headers.get("content-type") || "";

      if (mimeType.includes("pdf")) return "PDF";
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "JPG";
      if (mimeType.includes("png")) return "PNG";
      return "Unknown";
    } catch (error) {
      return "Unknown";
    }
  };

  const handleDownload = async (cert, requestedFormat) => {
    setIsDownloading(true);
    try {
      const url = getIPFSUrl(cert.hash, true);
      const response = await fetch(url);
      if (!response.ok)
        throw new Error("Failed to fetch certificate from IPFS");

      const blob = await response.blob();
      const mimeType = blob.type;

      // Determine the original format of the certificate
      let originalFormat = "unknown";
      if (mimeType.includes("pdf")) {
        originalFormat = "pdf";
      } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        originalFormat = "jpg";
      } else if (mimeType.includes("png")) {
        originalFormat = "png";
      }

      // Check if conversion is needed and possible
      if (originalFormat === "unknown") {
        throw new Error("Unable to determine certificate format");
      }

      let downloadBlob = blob;
      let actualFormat = originalFormat;

      // Handle format conversion
      if (requestedFormat !== originalFormat) {
        if (
          originalFormat === "pdf" &&
          (requestedFormat === "jpg" || requestedFormat === "png")
        ) {
          // PDF to image conversion using PDF.js
          try {
            const pdfUrl = URL.createObjectURL(blob);
            showInfo("Converting PDF to image format...");

            // Import PDF.js dynamically with correct worker path
            const pdfjsLib = await import("pdfjs-dist/build/pdf");
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              "pdfjs-dist/build/pdf.worker.mjs",
              import.meta.url
            ).toString();

            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            // Scale for better quality
            const scale = 2.0;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext("2d");

            // For JPG conversion, add white background
            if (requestedFormat === "jpg") {
              context.fillStyle = "white";
              context.fillRect(0, 0, canvas.width, canvas.height);
            }

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            await page.render(renderContext).promise;

            // Convert canvas to blob with proper quality
            downloadBlob = await new Promise((resolve, reject) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error("Failed to convert canvas to blob"));
                  }
                },
                `image/${requestedFormat}`,
                0.95
              );
            });

            actualFormat = requestedFormat;
            URL.revokeObjectURL(pdfUrl);
            showInfo(
              `Successfully converted PDF to ${requestedFormat.toUpperCase()}`
            );
          } catch (conversionError) {
            console.error("PDF conversion failed:", conversionError);
            showWarning(
              `Cannot convert PDF to ${requestedFormat.toUpperCase()}. Downloading original PDF format. Error: ${
                conversionError.message
              }`
            );
            actualFormat = originalFormat;
          }
        } else if (
          (originalFormat === "jpg" || originalFormat === "png") &&
          requestedFormat === "pdf"
        ) {
          // Image to PDF conversion using jsPDF
          try {
            showInfo("Converting image to PDF format...");
            const jsPDF = (await import("jspdf")).default;

            // Create image element to get dimensions
            const img = new Image();
            const imageUrl = URL.createObjectURL(blob);

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageUrl;
            });

            // Create PDF with image
            const pdf = new jsPDF({
              orientation: img.width > img.height ? "landscape" : "portrait",
              unit: "mm",
              format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgRatio = img.width / img.height;
            const pdfRatio = pdfWidth / pdfHeight;

            let finalWidth, finalHeight;
            if (imgRatio > pdfRatio) {
              finalWidth = pdfWidth;
              finalHeight = pdfWidth / imgRatio;
            } else {
              finalHeight = pdfHeight;
              finalWidth = pdfHeight * imgRatio;
            }

            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;

            pdf.addImage(img, "JPEG", x, y, finalWidth, finalHeight);

            // Get PDF as blob
            downloadBlob = pdf.output("blob");
            actualFormat = "pdf";
            URL.revokeObjectURL(imageUrl);
          } catch (conversionError) {
            console.error("Image to PDF conversion failed:", conversionError);
            showWarning(
              `Cannot convert ${originalFormat.toUpperCase()} to PDF. Downloading original ${originalFormat.toUpperCase()} format.`
            );
            actualFormat = originalFormat;
          }
        } else if (
          (originalFormat === "jpg" && requestedFormat === "png") ||
          (originalFormat === "png" && requestedFormat === "jpg")
        ) {
          // Image format conversion using canvas
          try {
            showInfo(
              `Converting ${originalFormat.toUpperCase()} to ${requestedFormat.toUpperCase()}...`
            );
            const img = new Image();
            const imageUrl = URL.createObjectURL(blob);

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageUrl;
            });

            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");

            // For JPG conversion, add white background
            if (requestedFormat === "jpg") {
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0);

            downloadBlob = await new Promise((resolve) => {
              canvas.toBlob(resolve, `image/${requestedFormat}`, 0.95);
            });
            actualFormat = requestedFormat;
            URL.revokeObjectURL(imageUrl);
          } catch (conversionError) {
            console.error("Image format conversion failed:", conversionError);
            showWarning(
              `Cannot convert ${originalFormat.toUpperCase()} to ${requestedFormat.toUpperCase()}. Downloading original format.`
            );
            actualFormat = originalFormat;
          }
        } else {
          showWarning(
            `Format conversion from ${originalFormat.toUpperCase()} to ${requestedFormat.toUpperCase()} is not supported. Downloading original format.`
          );
          actualFormat = originalFormat;
        }
      }

      const filename = `certificate-${cert.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}-${cert.id}.${actualFormat}`;

      const downloadUrl = window.URL.createObjectURL(downloadBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showSuccess(
        `Certificate "${
          cert.title
        }" downloaded successfully as ${actualFormat.toUpperCase()}!`
      );
    } catch (error) {
      showError(`Failed to download certificate: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getShareLink = (cert) =>
    `${window.location.origin}/verify?hash=${cert.hash}`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      showError("Failed to copy to clipboard");
    }
  };

  // Filter certificates by search query and status
  const filteredCertificates = certificates.filter((cert) => {
    const searchMatch =
      searchQuery === "" ||
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.type.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "valid" && cert.status === "issued") ||
      (statusFilter === "revoked" && cert.status === "revoked");

    return searchMatch && statusMatch;
  });

  if (activeTab !== "certificates") return null;

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* Certificates Tab */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold break-words">My Portfolio</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-none">
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
              </div>

              {/* Status Filter */}
              <div className="relative flex-shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent appearance-none bg-white">
                  <option value="all">All Status</option>
                  <option value="valid">✅ Valid</option>
                  <option value="revoked">🚫 Revoked</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
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
                  : "No certificates match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className={`border rounded-lg p-5 hover:shadow-md transition-shadow overflow-hidden ${
                    cert.status === "revoked"
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}>
                  <div className="mb-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        className={`text-lg font-medium flex-1 min-w-0 ${
                          cert.status === "revoked"
                            ? "text-red-800"
                            : "text-gray-800"
                        }`}
                        title={cert.title}>
                        <span className="line-clamp-2 break-words">
                          {cert.title}
                        </span>
                      </h3>
                      <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                        {cert.status === "revoked" && (
                          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full whitespace-nowrap">
                            <i className="bx bx-error-circle"></i> Revoked
                          </span>
                        )}
                        {cert.status === "issued" && (
                          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full whitespace-nowrap">
                            <i className="bx bx-check-circle"></i> Valid
                          </span>
                        )}
                        {cert.blockchainVerified && (
                          <span
                            className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full whitespace-nowrap"
                            title="Verified on blockchain">
                            <i className="bx bx-badge-check"></i> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 space-y-2">
                    <p
                      className={`text-sm break-words ${
                        cert.status === "revoked"
                          ? "text-red-700"
                          : "text-gray-600"
                      }`}>
                      <span className="font-medium">Issuer:</span>{" "}
                      <span className="line-clamp-1" title={cert.issuer}>
                        {cert.issuer}
                      </span>
                    </p>
                    <p
                      className={`text-sm ${
                        cert.status === "revoked"
                          ? "text-red-700"
                          : "text-gray-600"
                      }`}>
                      <span className="font-medium">Issue Date:</span>{" "}
                      {cert.issueDate}
                    </p>
                    <p
                      className={`text-sm break-words ${
                        cert.status === "revoked"
                          ? "text-red-700"
                          : "text-gray-600"
                      }`}>
                      <span className="font-medium">Type:</span>{" "}
                      <span className="line-clamp-1" title={cert.type}>
                        {cert.type}
                      </span>
                    </p>
                    {cert.status === "revoked" && (
                      <p className="text-sm text-red-600 mt-2 italic break-words">
                        This certificate has been revoked by the issuer.
                      </p>
                    )}
                  </div>
                  <div className="border-t pt-4 flex justify-center border-gray-200">
                    <button
                      onClick={() => viewCertificate(cert)}
                      className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        cert.status === "revoked"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-primary-blue text-white hover:bg-blue-700"
                      }`}>
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

              {/* Certificate Preview */}
              <div className="mb-6 bg-gray-100 p-4 rounded-md">
                {selectedCertificate.hash &&
                isValidIPFSHash(selectedCertificate.hash) ? (
                  <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                    <div className="w-full h-[600px] flex items-center justify-center p-4">
                      <img
                        src={getIPFSUrl(selectedCertificate.hash, true)}
                        alt="Certificate Preview"
                        className="max-w-full max-h-full object-contain rounded shadow-md"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                      {/* Fallback display */}
                      <div className="hidden bg-white shadow-md p-8 w-full max-w-lg mx-auto flex flex-col items-center justify-center text-center rounded">
                        <div className="text-primary-blue text-lg mb-2">
                          {selectedCertificate.issuer}
                        </div>
                        <div className="text-2xl font-bold mb-1">
                          CERTIFICATE
                        </div>
                        <div className="text-xl font-medium mb-6">
                          Certificate Holder
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
                    <div className="text-2xl font-bold mb-1">CERTIFICATE</div>
                    <div className="text-xl font-medium mb-6">
                      Certificate Holder
                    </div>
                    <div className="text-gray-600 mb-8">
                      {selectedCertificate.title}
                    </div>
                  </div>
                )}
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Certificate Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Title</p>
                      <p className="font-medium">{selectedCertificate.title}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Issuer</p>
                      <p className="font-medium">
                        {selectedCertificate.issuer}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium">
                        {selectedCertificate.issueDate}
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
                      <i className="bx bx-check-circle text-lg text-green-500 mr-2"></i>
                      <div>
                        <p className="font-medium">Verified on Blockchain</p>
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
                          <i className="bx bx-link-external text-lg"></i>
                        </button>
                        <button
                          onClick={() =>
                            copyToClipboard(selectedCertificate.hash)
                          }
                          className="ml-2 text-primary-blue hover:text-blue-700 p-1"
                          title="Copy IPFS hash">
                          <i className="bx bx-copy text-base"></i>
                        </button>
                        {showCopiedMessage && (
                          <span className="ml-2 text-green-600 text-sm">
                            Copied!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={closeViewer}>
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    setShareModalOpen(true);
                    setOriginalFormat(null);
                    const format = await detectCertificateFormat(
                      selectedCertificate.hash
                    );
                    setOriginalFormat(format);
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
                    setOriginalFormat(null);
                    setShowQRSection(false);
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
                Choose how you want to share your certificate:
              </p>

              {/* Original Format Info */}
              {originalFormat && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-info-circle text-blue-500"></i>
                    <span className="text-sm text-blue-800">
                      Original format: <strong>{originalFormat}</strong>
                    </span>
                  </div>
                  {originalFormat === "PDF" ? (
                    <p className="text-xs text-blue-600 mt-1">
                      PDF certificates can only be downloaded in PDF format to
                      maintain document integrity
                    </p>
                  ) : (
                    <p className="text-xs text-blue-600 mt-1">
                      Format conversion is automatically handled when needed
                    </p>
                  )}
                </div>
              )}

              {/* Share Format Options */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  {
                    format: "pdf",
                    color: "text-red-500",
                    label: "PDF",
                    desc: "Download as PDF",
                    icon: "bx-file",
                  },
                  {
                    format: "jpg",
                    color: "text-blue-500",
                    label: "JPG",
                    desc: "Download as JPG",
                    icon: "bx-image",
                  },
                  {
                    format: "png",
                    color: "text-green-500",
                    label: "PNG",
                    desc: "Download as PNG",
                    icon: "bx-image",
                  },
                  {
                    format: "qr",
                    color: "text-purple-500",
                    label: "QR Code",
                    desc: "Generate QR Code",
                    icon: "bx-qr",
                  },
                ]
                  .filter(({ format }) => {
                    // If original format is PDF, only allow PDF and QR Code
                    if (originalFormat === "PDF") {
                      return format === "pdf" || format === "qr";
                    }
                    // Otherwise, allow all formats
                    return true;
                  })
                  .map(({ format, color, label, desc, icon }) => (
                    <button
                      key={format}
                      onClick={() => {
                        if (format === "qr") {
                          setShowQRSection(true);
                        } else {
                          handleDownload(selectedCertificate, format);
                        }
                      }}
                      disabled={isDownloading}
                      className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center relative ${
                        isDownloading ? "opacity-50 cursor-not-allowed" : ""
                      }`}>
                      <div className={`${color} mb-2`}>
                        <i className={`bx ${icon} text-3xl`}></i>
                      </div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                      {format !== "qr" && (
                        <div className="absolute top-2 right-2">
                          <div
                            className="w-2 h-2 bg-green-400 rounded-full"
                            title="Format conversion supported"></div>
                        </div>
                      )}
                    </button>
                  ))}
              </div>

              {/* QR Code Section */}
              {showQRSection && (
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <i className="bx bx-qr text-purple-500"></i>
                      QR Code & Share Link
                    </h3>
                    <button
                      onClick={() => setShowQRSection(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors">
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

                  {/* Verification Link */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md bg-white text-sm font-mono"
                        value={getShareLink(selectedCertificate)}
                        readOnly
                      />
                      <button
                        onClick={() => {
                          copyToClipboard(getShareLink(selectedCertificate));
                          showInfo("Link copied to clipboard!");
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-md border border-blue-600 hover:bg-blue-700 transition-colors text-sm flex items-center gap-1">
                        <i className="bx bx-copy text-sm"></i>
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* QR Code Display */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <QRCode
                      value={getShareLink(selectedCertificate)}
                      size={200}
                      level="H"
                      includeMargin={true}
                      className="mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-3">
                      Scan this QR code to verify the certificate
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShareModalOpen(false);
                    setSelectedCertificate(null);
                    setOriginalFormat(null);
                    setShowQRSection(false);
                  }}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

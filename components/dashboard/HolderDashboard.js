import React, { useState, useEffect } from "react";
import { getIPFSUrl, isValidIPFSHash } from "../../utils/ipfs";
import { QRCodeSVG as QRCode } from "qrcode.react";
import jsPDF from "jspdf";
import useNotification from "../../utils/useNotification";
import Notification from "../Notification";
import { getHolderCertificates } from "../../utils/dataOperations";
import Button from "../Button";

export default function HolderDashboard({ activeTab }) {
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
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showQRSection, setShowQRSection] = useState(false);

  // Load certificates
  useEffect(() => {
    async function fetchCertificates() {
      const certificates = await getHolderCertificates();
      if (certificates && certificates.length > 0) {
        setCertificates(certificates);
      }
    }
    fetchCertificates();
  }, []);

  // Core functions
  const viewCertificate = (cert) => setSelectedCertificate(cert);
  const closeViewer = () => setSelectedCertificate(null);

  const handleDownload = async (cert, requestedFormat) => {
    setIsDownloading(true);
    try {
      const url = getIPFSUrl(cert.hash, true);
      const response = await fetch(url);
      if (!response.ok)
        throw new Error("Failed to fetch certificate from IPFS");

      const blob = await response.blob();
      const filename = `certificate-${cert.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}-${cert.id}.${requestedFormat}`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showSuccess(`Certificate "${cert.title}" downloaded successfully!`);
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

  // Filter certificates (only by search query now)
  const filteredCertificates = certificates.filter((cert) => {
    const searchMatch =
      searchQuery === "" ||
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.type.toLowerCase().includes(searchQuery.toLowerCase());
    return searchMatch;
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">Certificate Portfolio</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-gray-800">
                      {cert.title}
                    </h3>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Issuer:</span> {cert.issuer}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Issue Date:</span>{" "}
                      {cert.issueDate}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Type:</span> {cert.type}
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

        {/* Verification Process Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Verification Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {[
              {
                icon: "📤",
                title: "Issued",
                desc: "Certificate is issued to your wallet",
              },
              {
                icon: "📤",
                title: "Shared",
                desc: "You share it with a verifier",
              },
              {
                icon: "✅",
                title: "Verified",
                desc: "Verifier validates on blockchain",
              },
              {
                icon: "🎉",
                title: "Accepted",
                desc: "Certificate authenticity confirmed",
              },
            ].map((step, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">{step.icon}</div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
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
                          title="Copy IPFS hash">
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
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={closeViewer}>
                  Close
                </Button>
                <Button onClick={() => setShareModalOpen(true)}>
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
                {[
                  {
                    format: "pdf",
                    color: "text-red-500",
                    label: "PDF",
                    desc: "Download as PDF",
                  },
                  {
                    format: "jpg",
                    color: "text-blue-500",
                    label: "JPG",
                    desc: "Download as JPG",
                  },
                  {
                    format: "png",
                    color: "text-green-500",
                    label: "PNG",
                    desc: "Download as PNG",
                  },
                ].map(({ format, color, label, desc }) => (
                  <button
                    key={format}
                    onClick={() => handleDownload(selectedCertificate, format)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                    <div className={`${color} mb-2`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                ))}

                <button
                  onClick={() => setShowQRSection(true)}
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

              {/* QR Code Section */}
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
                          copyToClipboard(getShareLink(selectedCertificate));
                          showInfo("Link copied to clipboard!");
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-r-md border border-gray-300 border-l-0 hover:bg-gray-200 text-sm">
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-md mb-4">
                    <QRCode
                      value={getShareLink(selectedCertificate)}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
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
    </>
  );
}

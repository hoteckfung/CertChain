import ProtectedRoute from "../components/ProtectedRoute";
import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { uploadToPinata, getIPFSUrl, testAuthentication } from "../utils/ipfs";
import useNotification from "../utils/useNotification";
import Notification from "../components/Notification";
import SignaturePad from "../components/SignaturePad";
import DraggableElement from "../components/DraggableElement";

export default function IssuerPage() {
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

  const [activeTab, setActiveTab] = useState("create");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [certificateType, setCertificateType] = useState("degree");
  const [previewVisible, setPreviewVisible] = useState(true);

  // Form states for certificate generation
  const [recipientName, setRecipientName] = useState("Certificate Recipient");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [certificateTitle, setCertificateTitle] = useState("Certificate Title");
  const [issuerName, setIssuerName] = useState("Issuing Institution");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [certificateDescription, setCertificateDescription] = useState(
    "For successfully completing the requirements"
  );
  const [leftSignature, setLeftSignature] = useState("");
  const [leftSignatureName, setLeftSignatureName] = useState("Rufus Stewart");
  const [rightSignature, setRightSignature] = useState("");
  const [rightSignatureName, setRightSignatureName] = useState("Olivia Wilson");
  const [certificateId, setCertificateId] = useState("");
  const [certificateTemplate, setCertificateTemplate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Refs
  const certificateContainerRef = useRef(null);

  // Element positions
  const [elementPositions, setElementPositions] = useState({
    recipientName: { x: 100, y: 150 },
    description: { x: 100, y: 220 },
    leftSignature: { x: 100, y: 300 },
    rightSignature: { x: 300, y: 300 },
    certificateId: { x: 400, y: 380 },
  });

  // Handle position changes
  const handlePositionChange = (elementId, newPosition) => {
    setElementPositions((prev) => ({
      ...prev,
      [elementId]: newPosition,
    }));
  };

  // IPFS states
  const [certificateFile, setCertificateFile] = useState(null);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [ipfsError, setIpfsError] = useState("");
  const [pinataAuthenticated, setPinataAuthenticated] = useState(null);

  // Certificate viewer state
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // Form states for issuing certificates
  const [holderAddress, setHolderAddress] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [issuedCertificates, setIssuedCertificates] = useState([
    {
      id: "cert-001",
      holder: "0xaaaa...bbbb",
      name: "John Doe",
      type: "Degree",
      title: "Blockchain Development",
      issueDate: "2023-08-15",
      status: "Issued",
      institution: "Blockchain University",
      details: "Completed with distinction",
      hash: "QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB",
    },
    {
      id: "cert-002",
      holder: "0xcccc...dddd",
      name: "Jane Smith",
      type: "Course",
      title: "Smart Contract Development",
      issueDate: "2023-08-10",
      status: "Issued",
      institution: "Blockchain University",
      details: "Advanced course in Solidity",
      hash: "QmXS2LfM4sg39AbjxHKiWQB9PsZgUKaBmtEP764e7CDer5",
    },
  ]);

  // Test Pinata authentication when component mounts
  useEffect(() => {
    async function checkPinataAuth() {
      try {
        // In development mode, consider authentication successful
        if (process.env.NODE_ENV === "development") {
          console.log("Development mode: Using mock Pinata authentication");
          setPinataAuthenticated(true);
          return;
        }

        const isAuthenticated = await testAuthentication();
        setPinataAuthenticated(isAuthenticated);
        console.log(
          "Pinata authentication:",
          isAuthenticated ? "Successful" : "Failed"
        );

        if (!isAuthenticated) {
          setIpfsError(
            "Pinata authentication failed. Please check your API keys."
          );
        }
      } catch (error) {
        console.error("Error checking Pinata authentication:", error);

        // In development mode, don't show errors
        if (process.env.NODE_ENV === "development") {
          setPinataAuthenticated(true);
          return;
        }

        setPinataAuthenticated(false);
        setIpfsError(
          "Error connecting to Pinata. Please check your network connection and API keys."
        );
      }
    }

    checkPinataAuth();
  }, []);

  // Handle file upload for Excel files
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle certificate file upload for IPFS
  const handleCertificateFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
      // Reset IPFS states
      setIpfsHash("");
      setIpfsError("");
    }
  };

  // Process Excel file
  const handleProcessExcel = () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Simulate file upload and processing
    setTimeout(() => {
      setIsUploading(false);
      showSuccess(
        "Excel file processed successfully! Ready to customize certificates."
      );
    }, 1500);
  };

  // Upload certificate to IPFS
  const handleUploadToIPFS = async () => {
    if (!certificateFile) {
      setIpfsError("Please select a certificate file to upload");
      return;
    }

    setIsUploadingToIPFS(true);
    setIpfsError("");

    try {
      console.log(
        "Starting IPFS upload process for file:",
        certificateFile.name
      );

      // Upload the file to IPFS via Pinata
      const fileName = `${certificateType}_${Date.now()}`;
      console.log("Generated file name:", fileName);

      try {
        const result = await uploadToPinata(certificateFile, fileName);
        console.log("Upload successful, received result:", result);

        // Set the IPFS hash and clear certificate file
        setIpfsHash(result.hash);

        // Set certificate name if not already set
        if (!certificateName) {
          setCertificateName(
            certificateFile.name.split(".")[0] || "Certificate"
          );
        }

        showSuccess(
          `Certificate uploaded to IPFS successfully! Hash: ${result.hash}`
        );

        // In development mode, show additional info
        if (process.env.NODE_ENV === "development" && result.mockData) {
          showInfo("Note: Using mock IPFS data in development mode.");
        }
      } catch (uploadError) {
        console.error("Upload failed with error:", uploadError);
        let errorMessage = "Failed to upload to IPFS. ";

        if (uploadError.message) {
          errorMessage += uploadError.message;
        } else {
          errorMessage +=
            "Please check the console for more details and try again.";
        }

        setIpfsError(errorMessage);
        showError(errorMessage);
      }
    } catch (error) {
      console.error("Error in handleUploadToIPFS:", error);
      setIpfsError("Failed to upload to IPFS. Please try again.");
      showError("Failed to upload to IPFS. Please try again.");
    } finally {
      setIsUploadingToIPFS(false);
    }
  };

  // Issue certificate
  const handleIssueCertificate = (e) => {
    e.preventDefault();

    if (!holderAddress || !certificateName || !completionDate) {
      showWarning("Please fill in all required fields");
      return;
    }

    if (!ipfsHash) {
      showWarning("Please upload a certificate file to IPFS first");
      return;
    }

    setIssuingCertificate(true);

    // Simulate certificate issuance (would interact with blockchain in production)
    setTimeout(() => {
      const newCertificate = {
        id: `cert-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
        holder: holderAddress,
        name: "New Recipient", // In real app, would be fetched from database
        type:
          certificateType.charAt(0).toUpperCase() + certificateType.slice(1),
        title: certificateName,
        issueDate: completionDate,
        status: "Issued",
        institution: "Blockchain University",
        details: additionalDetails || "Certificate details not provided",
        hash: ipfsHash,
      };

      setIssuedCertificates([newCertificate, ...issuedCertificates]);
      setIssuingCertificate(false);

      // Clear form
      setHolderAddress("");
      setCertificateName("");
      setCompletionDate("");
      setAdditionalDetails("");
      setCertificateFile(null);
      setIpfsHash("");

      // Store in localStorage for persistence between refreshes (development only)
      const storedCertificates = JSON.parse(
        localStorage.getItem("issuedCertificates") || "[]"
      );
      localStorage.setItem(
        "issuedCertificates",
        JSON.stringify([newCertificate, ...storedCertificates])
      );

      showSuccess("Certificate issued successfully!");
    }, 2000);
  };

  // View certificate details
  const viewCertificate = (id) => {
    const certificate = issuedCertificates.find((cert) => cert.id === id);
    if (certificate) {
      setViewingCertificate(certificate);
    }
  };

  // Close certificate viewer
  const closeViewer = () => {
    setViewingCertificate(null);
  };

  // Toggle certificate preview
  const handlePreviewToggle = () => {
    setPreviewVisible(!previewVisible);
  };

  // Load certificates from localStorage on initial render (development only)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCertificates = JSON.parse(
        localStorage.getItem("issuedCertificates") || "[]"
      );
      if (storedCertificates.length > 0) {
        setIssuedCertificates((prevCerts) => {
          // Merge stored certificates with initial state, avoiding duplicates by ID
          const existingIds = prevCerts.map((cert) => cert.id);
          const newCerts = storedCertificates.filter(
            (cert) => !existingIds.includes(cert.id)
          );
          return [...prevCerts, ...newCerts];
        });
      }
    }
  }, []);

  // Function to generate a new certificate ID in IPFS hash-like format
  const generateCertificateId = () => {
    // Create a hash-like ID that resembles IPFS format (Qm + 44 chars of base58)
    const chars =
      "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456789";
    let hash = "Qm";
    for (let i = 0; i < 44; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCertificateId(hash);
  };

  // Generate certificate ID on initial load
  useEffect(() => {
    generateCertificateId();
  }, []);

  // Generate certificate PDF (placeholder function)
  const generateCertificatePDF = () => {
    showInfo(
      "Certificate generation feature will be implemented with a PDF library in the future."
    );
    // In a real implementation, would use a library like jsPDF to generate the PDF
  };

  // Handle certificate template upload
  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCertificateTemplate(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle edit mode for positioning elements
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <ProtectedRoute allowedRoles={["issuer"]}>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>Issuer Dashboard | CertChain</title>
          <meta
            name="description"
            content="Issue and manage blockchain certificates for your institution."
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
                Issuer Dashboard
              </h1>
              <div className="text-sm text-gray-500">
                Logged in as <span className="font-medium">Issuer</span>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-8">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`px-6 py-3 font-medium ${
                    activeTab === "create"
                      ? "text-primary-blue border-b-2 border-primary-blue"
                      : "text-gray-500"
                  }`}>
                  Create Certificate
                </button>
                <button
                  onClick={() => setActiveTab("issue")}
                  className={`px-6 py-3 font-medium ${
                    activeTab === "issue"
                      ? "text-primary-blue border-b-2 border-primary-blue"
                      : "text-gray-500"
                  }`}>
                  Issue Certificate
                </button>
                <button
                  onClick={() => setActiveTab("issued")}
                  className={`px-6 py-3 font-medium ${
                    activeTab === "issued"
                      ? "text-primary-blue border-b-2 border-primary-blue"
                      : "text-gray-500"
                  }`}>
                  Issued Certificate
                </button>
              </div>
            </div>

            {/* Certificate Creation Tab */}
            {activeTab === "create" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                      Upload Certificate Data
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Upload an Excel file with certificate data including
                      holder names, wallet addresses, and certificate details.
                    </p>

                    <div className="mb-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                        {selectedFile ? (
                          <div className="mb-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto mb-2 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-green-600 font-medium">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto mb-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <p className="mb-2">
                              Drag and drop an Excel file here
                            </p>
                            <p className="text-sm">or</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="file-upload"
                          className="mt-4 inline-block px-4 py-2 bg-primary-blue text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
                          Browse Files
                        </label>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Accepted file formats: .xlsx, .xls, .csv
                      </p>
                    </div>

                    <Button
                      onClick={handleProcessExcel}
                      disabled={!selectedFile || isUploading}
                      className="w-full">
                      {isUploading ? "Processing..." : "Process Excel File"}
                    </Button>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Certificate Generator
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Design and create certificates directly on the web app.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate Type
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          value={certificateType}
                          onChange={(e) => setCertificateType(e.target.value)}>
                          <option value="degree">Degree</option>
                          <option value="diploma">Diploma</option>
                          <option value="course">Course Completion</option>
                          <option value="certification">
                            Professional Certification
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate ID
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={certificateId}
                            readOnly
                          />
                          <button
                            onClick={generateCertificateId}
                            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-md hover:bg-gray-200 text-gray-600"
                            title="Generate new ID">
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Certificate details form */}
                    <div className="border-t border-gray-200 pt-4 mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        Certificate Detail
                      </h3>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate Template
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                          {certificateTemplate ? (
                            <div className="mb-2">
                              <img
                                src={certificateTemplate}
                                alt="Certificate Template"
                                className="max-h-40 mx-auto"
                              />
                            </div>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto mb-2 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="template-upload"
                            onChange={handleTemplateUpload}
                          />
                          <label
                            htmlFor="template-upload"
                            className="mt-2 inline-block px-4 py-2 bg-primary-blue text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
                            {certificateTemplate
                              ? "Change Template"
                              : "Upload Template"}
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Upload a certificate template image (PNG or JPG)
                          exported from Canva or any design tool
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient Name *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Enter recipient's full name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient Email
                          </label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="recipient@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Title *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={certificateTitle}
                            onChange={(e) =>
                              setCertificateTitle(e.target.value)
                            }
                            placeholder="e.g., Bachelor of Science in Computer Science"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issuing Institution *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={issuerName}
                            onChange={(e) => setIssuerName(e.target.value)}
                            placeholder="Enter institution name"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Date *
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                          rows="3"
                          value={certificateDescription}
                          onChange={(e) =>
                            setCertificateDescription(e.target.value)
                          }
                          placeholder="Describe what the certificate is for"></textarea>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Left Signature
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue mb-2"
                                value={leftSignatureName}
                                onChange={(e) =>
                                  setLeftSignatureName(e.target.value)
                                }
                                placeholder="Signer name"
                              />
                            </div>
                          </div>
                          <SignaturePad
                            onSignatureChange={setLeftSignature}
                            label="Signature"
                          />
                        </div>
                        <div>
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Right Signature
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue mb-2"
                                value={rightSignatureName}
                                onChange={(e) =>
                                  setRightSignatureName(e.target.value)
                                }
                                placeholder="Signer name"
                              />
                            </div>
                          </div>
                          <SignaturePad
                            onSignatureChange={setRightSignature}
                            label="Signature"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certificate ID
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 focus:outline-none font-mono text-sm"
                            value={certificateId}
                            readOnly
                          />
                          <button
                            onClick={generateCertificateId}
                            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-md hover:bg-gray-200 text-gray-600"
                            title="Generate new ID">
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          System-generated unique identifier for this
                          certificate (IPFS format)
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <Button
                        onClick={handlePreviewToggle}
                        variant="secondary"
                        className="flex-1">
                        {previewVisible ? "Hide Preview" : "Show Preview"}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={generateCertificatePDF}>
                        Generate Certificate
                      </Button>
                    </div>

                    {previewVisible && (
                      <div className="mt-6 p-4 border border-gray-200 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium">
                            Certificate Preview
                          </h3>
                          <div>
                            <button
                              type="button"
                              onClick={toggleEditMode}
                              className={`px-3 py-1 text-sm rounded-md ${
                                isEditMode
                                  ? "bg-red-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}>
                              {isEditMode
                                ? "Exit Positioning Mode"
                                : "Position Elements"}
                            </button>
                          </div>
                        </div>

                        {isEditMode && (
                          <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <p>
                              <strong>Positioning Mode:</strong> Drag and drop
                              elements to position them precisely on your
                              certificate template. Changes will be saved
                              automatically.
                            </p>
                          </div>
                        )}

                        <div className="bg-gray-100 p-8 rounded-md flex items-center justify-center">
                          <div
                            ref={certificateContainerRef}
                            className="bg-white shadow-lg w-full max-w-2xl aspect-[4/3] relative border border-gray-200 overflow-hidden">
                            {certificateTemplate ? (
                              // Display uploaded template as background
                              <img
                                src={certificateTemplate}
                                alt="Certificate Template"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              // Display message to upload template
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                <p className="text-gray-400 text-center px-8">
                                  Upload a certificate template image to see
                                  preview with your content
                                </p>
                              </div>
                            )}

                            {/* Draggable elements */}
                            {certificateTemplate && (
                              <>
                                <DraggableElement
                                  id="recipientName"
                                  position={elementPositions.recipientName}
                                  onPositionChange={handlePositionChange}
                                  isEditMode={isEditMode}
                                  containerRef={certificateContainerRef}
                                  className="text-center">
                                  <div className="text-3xl font-medium px-4 py-1 min-w-[200px]">
                                    {recipientName}
                                  </div>
                                </DraggableElement>

                                <DraggableElement
                                  id="description"
                                  position={elementPositions.description}
                                  onPositionChange={handlePositionChange}
                                  isEditMode={isEditMode}
                                  containerRef={certificateContainerRef}
                                  className="text-center">
                                  <div className="text-sm max-w-md px-4 py-1 min-w-[200px]">
                                    {certificateDescription}
                                  </div>
                                </DraggableElement>

                                <DraggableElement
                                  id="leftSignature"
                                  position={elementPositions.leftSignature}
                                  onPositionChange={handlePositionChange}
                                  isEditMode={isEditMode}
                                  containerRef={certificateContainerRef}>
                                  <div className="text-center">
                                    {leftSignature ? (
                                      leftSignature.startsWith("data:image") ? (
                                        <img
                                          src={leftSignature}
                                          alt="Signature"
                                          className="h-10 mx-auto mb-1"
                                        />
                                      ) : (
                                        <div className="text-lg font-script mb-1">
                                          {leftSignature}
                                        </div>
                                      )
                                    ) : (
                                      <div className="text-lg font-script mb-1">
                                        Signature
                                      </div>
                                    )}
                                    <p className="text-sm">
                                      {leftSignatureName}
                                    </p>
                                  </div>
                                </DraggableElement>

                                <DraggableElement
                                  id="rightSignature"
                                  position={elementPositions.rightSignature}
                                  onPositionChange={handlePositionChange}
                                  isEditMode={isEditMode}
                                  containerRef={certificateContainerRef}>
                                  <div className="text-center">
                                    {rightSignature ? (
                                      rightSignature.startsWith(
                                        "data:image"
                                      ) ? (
                                        <img
                                          src={rightSignature}
                                          alt="Signature"
                                          className="h-10 mx-auto mb-1"
                                        />
                                      ) : (
                                        <div className="text-lg font-script mb-1">
                                          {rightSignature}
                                        </div>
                                      )
                                    ) : (
                                      <div className="text-lg font-script mb-1">
                                        Signature
                                      </div>
                                    )}
                                    <p className="text-sm">
                                      {rightSignatureName}
                                    </p>
                                  </div>
                                </DraggableElement>

                                {certificateId && (
                                  <DraggableElement
                                    id="certificateId"
                                    position={elementPositions.certificateId}
                                    onPositionChange={handlePositionChange}
                                    isEditMode={isEditMode}
                                    containerRef={certificateContainerRef}>
                                    <div className="text-xs">
                                      ID: {certificateId}
                                    </div>
                                  </DraggableElement>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {isEditMode && (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={toggleEditMode}
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                              Save Positions
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                    <ol className="list-decimal list-inside space-y-4 text-gray-600">
                      <li>
                        <span className="font-medium">Upload Data:</span> Use an
                        Excel file with certificate details like names and
                        addresses.
                      </li>
                      <li>
                        <span className="font-medium">
                          Design Certificates:
                        </span>{" "}
                        Choose templates and customize the appearance of your
                        certificates.
                      </li>
                      <li>
                        <span className="font-medium">Review & Generate:</span>{" "}
                        Preview certificates and make any necessary adjustments.
                      </li>
                      <li>
                        <span className="font-medium">
                          Issue on Blockchain:
                        </span>{" "}
                        Securely issue certificates to recipients' wallet
                        addresses.
                      </li>
                    </ol>

                    <div className="mt-8 p-4 bg-blue-50 rounded-md">
                      <h3 className="text-primary-blue font-medium mb-2">
                        Blockcerts Standard
                      </h3>
                      <p className="text-sm text-gray-600">
                        All certificates follow the Blockcerts standard for
                        blockchain verification, ensuring interoperability and
                        authenticity across platforms.
                      </p>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded-md">
                      <h3 className="text-gray-700 font-medium mb-2">
                        How to Use Your Own Template
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>
                          Design your certificate in Canva exactly how you want
                          it to look
                        </li>
                        <li>
                          Export it as a PNG (with transparent background if
                          applicable)
                        </li>
                        <li>
                          In the certificate generator, use the "Upload
                          Template" button to upload your Canva design
                        </li>
                        <li>
                          Your certificate design will appear as the background
                        </li>
                        <li>
                          Click "Position Elements" to drag and place text and
                          signatures exactly where you want them
                        </li>
                        <li>
                          Click "Save Positions" when you're satisfied with the
                          layout
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issue Certificates Tab */}
            {activeTab === "issue" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                      Upload Certificate to IPFS
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Upload your certificate file to IPFS for decentralized
                      storage. This will provide a unique hash that will be used
                      to issue the certificate on the blockchain.
                    </p>

                    <div className="mb-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                        {certificateFile ? (
                          <div className="mb-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto mb-2 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <p className="text-green-600 font-medium">
                              {certificateFile.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(certificateFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 mx-auto mb-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <p className="mb-2">
                              Drag and drop a certificate file here
                            </p>
                            <p className="text-sm">or</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.json"
                          className="hidden"
                          id="certificate-upload"
                          onChange={handleCertificateFileUpload}
                        />
                        <label
                          htmlFor="certificate-upload"
                          className="mt-4 inline-block px-4 py-2 bg-primary-blue text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
                          Browse Files
                        </label>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Accepted file formats: PDF, JPG, PNG, JSON (Blockcerts)
                      </p>
                    </div>

                    {ipfsError && (
                      <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                        {ipfsError}
                      </div>
                    )}

                    {/* Display Pinata authentication status */}
                    <div
                      className="mb-4 p-3 rounded-md text-sm"
                      style={{
                        backgroundColor:
                          pinataAuthenticated === null
                            ? "#f8f9fa"
                            : pinataAuthenticated
                            ? "#d1fae5"
                            : "#fee2e2",
                        color:
                          pinataAuthenticated === null
                            ? "#6b7280"
                            : pinataAuthenticated
                            ? "#065f46"
                            : "#b91c1c",
                      }}>
                      <div className="font-medium">
                        Pinata Authentication Status:{" "}
                        {pinataAuthenticated === null
                          ? "Checking..."
                          : pinataAuthenticated
                          ? "Connected ✓"
                          : "Failed ✗"}
                        {process.env.NODE_ENV === "development" && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                            DEV MODE
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        {pinataAuthenticated === null
                          ? "Verifying connection to Pinata IPFS service..."
                          : process.env.NODE_ENV === "development"
                          ? "Using mock Pinata service in development mode. All operations will succeed with mock data."
                          : pinataAuthenticated
                          ? "Ready to upload files to IPFS via Pinata"
                          : "Cannot connect to Pinata. Please check API keys and network connection."}
                      </div>
                      {process.env.NODE_ENV !== "development" && (
                        <button
                          onClick={async () => {
                            try {
                              setPinataAuthenticated(null);
                              setIpfsError("");

                              const response = await fetch("/api/check-pinata");
                              const data = await response.json();

                              console.log("Pinata check result:", data);

                              if (data.success) {
                                setPinataAuthenticated(true);
                                showSuccess(
                                  `Pinata connection successful! Test upload hash: ${data.testUpload.hash}`
                                );
                              } else {
                                setPinataAuthenticated(false);
                                setIpfsError(
                                  `Pinata connection failed: ${data.message}`
                                );
                                showError(
                                  `Pinata connection failed: ${data.message}`
                                );
                              }
                            } catch (error) {
                              console.error("Error checking Pinata:", error);
                              setPinataAuthenticated(false);
                              setIpfsError(
                                `Error checking Pinata: ${error.message}`
                              );
                              showError(
                                `Error checking Pinata: ${error.message}`
                              );
                            }
                          }}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline">
                          Test Pinata Connection
                        </button>
                      )}
                    </div>

                    {ipfsHash && (
                      <div className="mb-6 p-4 bg-green-50 rounded-md">
                        <h3 className="text-green-700 font-medium mb-2">
                          File Uploaded to IPFS
                        </h3>
                        <div className="flex items-center">
                          <p className="text-sm font-mono break-all">
                            {ipfsHash}
                          </p>
                          <button
                            onClick={() =>
                              window.open(getIPFSUrl(ipfsHash, true), "_blank")
                            }
                            className="ml-2 text-primary-blue hover:text-blue-700">
                            View
                          </button>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleUploadToIPFS}
                      disabled={
                        !certificateFile ||
                        isUploadingToIPFS ||
                        ipfsHash ||
                        pinataAuthenticated === false
                      }
                      className="w-full">
                      {isUploadingToIPFS
                        ? "Uploading to IPFS..."
                        : pinataAuthenticated === false
                        ? "Pinata Connection Failed"
                        : "Upload to IPFS"}
                    </Button>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Issue Certificate
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Issue a certificate to a holder by providing their
                      details.
                    </p>

                    <form onSubmit={handleIssueCertificate}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="md:col-span-2">
                          <label
                            htmlFor="holderAddress"
                            className="block text-sm font-medium text-gray-700 mb-1">
                            Holder's Wallet Address
                          </label>
                          <input
                            type="text"
                            id="holderAddress"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono"
                            placeholder="0x..."
                            value={holderAddress}
                            onChange={(e) => setHolderAddress(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="certificateType"
                            className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Type
                          </label>
                          <select
                            id="certificateType"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={certificateType}
                            onChange={(e) => setCertificateType(e.target.value)}
                            required>
                            <option value="degree">Degree</option>
                            <option value="diploma">Diploma</option>
                            <option value="course">Course Completion</option>
                            <option value="certification">
                              Professional Certification
                            </option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="completionDate"
                            className="block text-sm font-medium text-gray-700 mb-1">
                            Completion Date
                          </label>
                          <input
                            type="date"
                            id="completionDate"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            htmlFor="certificateName"
                            className="block text-sm font-medium text-gray-700 mb-1">
                            Certificate Name/Title
                          </label>
                          <input
                            type="text"
                            id="certificateName"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="e.g., Bachelor of Science in Computer Science"
                            value={certificateName}
                            onChange={(e) => setCertificateName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            htmlFor="additionalDetails"
                            className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Details (Optional)
                          </label>
                          <textarea
                            id="additionalDetails"
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="Enter any additional information to include in the certificate..."
                            value={additionalDetails}
                            onChange={(e) =>
                              setAdditionalDetails(e.target.value)
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            IPFS Hash
                            {ipfsHash ? (
                              <span className="text-green-600 ml-2">
                                ✓ Ready to issue
                              </span>
                            ) : (
                              <span className="text-red-600 ml-2">
                                Required - Please upload certificate first
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono"
                            value={ipfsHash}
                            readOnly
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            This is the IPFS hash of your uploaded certificate
                            file
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={issuingCertificate || !ipfsHash}
                        className="w-full">
                        {issuingCertificate
                          ? "Issuing Certificate..."
                          : "Issue Certificate"}
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">IPFS Storage</h2>
                    <p className="text-gray-600 mb-4">
                      Your certificate files are securely stored on IPFS
                      (InterPlanetary File System), a decentralized storage
                      network.
                    </p>

                    <div className="space-y-4 text-gray-600 text-sm">
                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-primary-blue mr-2 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Permanent Storage</p>
                          <p>
                            Files stored on IPFS cannot be modified or deleted,
                            ensuring certificate integrity.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-primary-blue mr-2 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Supported Formats</p>
                          <p>
                            We support various file formats, including PDF, JPG,
                            PNG, and Blockcerts JSON.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-primary-blue mr-2 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="font-medium">Verification</p>
                          <p>
                            Anyone can verify a certificate using its IPFS hash
                            without requiring special software.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Blockchain Issuance
                    </h2>
                    <p className="text-gray-600 mb-4">
                      When you issue a certificate, the following happens behind
                      the scenes:
                    </p>

                    <ol className="list-decimal list-inside space-y-3 text-gray-600">
                      <li>Certificate file is uploaded to IPFS</li>
                      <li>An IPFS hash is generated for the file</li>
                      <li>The hash is recorded on the blockchain</li>
                      <li>A Blockcerts-compliant credential is created</li>
                      <li>The certificate is linked to the holder's wallet</li>
                    </ol>

                    <div className="mt-8 p-4 bg-yellow-50 rounded-md">
                      <h3 className="text-yellow-700 font-medium mb-2">
                        Important Note
                      </h3>
                      <p className="text-sm text-gray-600">
                        Once issued, certificates cannot be modified. Ensure all
                        information is correct before issuing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issued Certificates Tab */}
            {activeTab === "issued" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Issued Certificates
                </h2>
                <p className="text-gray-600 mb-6">
                  View all certificates you have issued.
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Holder
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Issued
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IPFS Hash
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {issuedCertificates.map((cert) => (
                        <tr key={cert.id}>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                            {cert.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {cert.name}
                              </div>
                              <div className="ml-2 text-xs text-gray-500">
                                ({cert.holder})
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {cert.type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {cert.title}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {cert.issueDate}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                            <div className="flex items-center">
                              <span className="truncate max-w-[100px]">
                                {cert.hash}
                              </span>
                              <button
                                onClick={() =>
                                  window.open(
                                    getIPFSUrl(cert.hash, true),
                                    "_blank"
                                  )
                                }
                                className="ml-2 text-primary-blue hover:text-blue-700 flex-shrink-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => viewCertificate(cert.id)}
                              className="text-primary-blue hover:text-blue-800 mr-3">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Certificate Viewer Modal */}
            {viewingCertificate && (
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

                    {/* Check if we can fetch the certificate from IPFS */}
                    {viewingCertificate.hash && (
                      <div className="mb-6 overflow-hidden rounded-md shadow">
                        <iframe
                          src={getIPFSUrl(viewingCertificate.hash, true)}
                          className="w-full h-96 border-0"
                          title="Certificate Preview"
                          sandbox="allow-scripts"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Recipient Information
                        </h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">
                              {viewingCertificate.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">
                              Wallet Address
                            </p>
                            <p className="font-mono text-sm">
                              {viewingCertificate.holder}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Certificate Information
                        </h3>
                        <div className="bg-gray-50 p-4 rounded">
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Title</p>
                            <p className="font-medium">
                              {viewingCertificate.title}
                            </p>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium">
                              {viewingCertificate.type}
                            </p>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Issue Date</p>
                            <p className="font-medium">
                              {viewingCertificate.issueDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium text-green-600">
                              {viewingCertificate.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">
                        Additional Details
                      </h3>
                      <div className="bg-gray-50 p-4 rounded">
                        <p>{viewingCertificate.details}</p>
                      </div>
                    </div>

                    <div className="mb-6">
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
                              Verified on Blockchain
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-sm text-gray-500 mb-1">
                            IPFS Hash
                          </p>
                          <div className="flex items-center">
                            <p className="font-mono break-all">
                              {viewingCertificate.hash}
                            </p>
                            <button
                              onClick={() =>
                                window.open(
                                  getIPFSUrl(viewingCertificate.hash, true),
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
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="secondary" onClick={closeViewer}>
                        Close
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(
                            getIPFSUrl(viewingCertificate.hash, true),
                            "_blank"
                          )
                        }>
                        View Original Certificate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}

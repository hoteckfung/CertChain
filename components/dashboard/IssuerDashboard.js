import React, { useState, useEffect, useRef } from "react";
import {
  uploadToPinata,
  getIPFSUrl,
  testAuthentication,
} from "../../utils/ipfs";
import useNotification from "../../utils/useNotification";
import Notification from "../Notification";
import SignaturePad from "../SignaturePad";
import DraggableElement from "../DraggableElement";
import { connectWallet, issueCertificateOnChain } from "../../utils/contract";
import Button from "../Button";

export default function IssuerDashboard({ activeTab }) {
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

  // State for various functionalities
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOverExcel, setIsDragOverExcel] = useState(false);
  const [processedExcelData, setProcessedExcelData] = useState([]);
  const [isDragOverCertificate, setIsDragOverCertificate] = useState(false);

  // Form states for certificate generation
  const [recipientName, setRecipientName] = useState("");
  const [certificateTitle, setCertificateTitle] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [certificateDescription, setCertificateDescription] = useState(
    "For successfully completing the requirements"
  );
  const [leftSignature, setLeftSignature] = useState("");
  const [leftSignatureName, setLeftSignatureName] = useState("");
  const [rightSignature, setRightSignature] = useState("");
  const [rightSignatureName, setRightSignatureName] = useState("");
  const [certificateId, setCertificateId] = useState("");
  const [certificateTemplate, setCertificateTemplate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);

  // IPFS states
  const [certificateFile, setCertificateFile] = useState(null);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [ipfsError, setIpfsError] = useState("");
  const [ipfsConnectionStatus, setIpfsConnectionStatus] = useState(null);
  const [isTestingIPFS, setIsTestingIPFS] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Certificate viewer state
  const [viewingCertificate, setViewingCertificate] = useState(null);

  // Form states for issuing certificates
  const [holderAddress, setHolderAddress] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [issuedCertificates, setIssuedCertificates] = useState([]);

  // Blockchain-related state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [contractAddress, setContractAddress] = useState("");

  // Refs
  const certificateContainerRef = useRef(null);

  // Element positions for draggable elements
  const [elementPositions, setElementPositions] = useState({
    certificateTitle: { x: 100, y: 80 },
    issuerName: { x: 100, y: 120 },
    recipientName: { x: 100, y: 180 },
    description: { x: 100, y: 240 },
    leftSignature: { x: 100, y: 320 },
    rightSignature: { x: 300, y: 320 },
  });

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    loadContractAddress();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const loadContractAddress = () => {
    const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (address && address !== "0x...") {
      setContractAddress(address);
    }
  };

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletConnected(true);
        setWalletAddress(result.address);
        showSuccess("Wallet connected successfully!");
      } else {
        showError(result.error || "Failed to connect wallet");
      }
    } catch (error) {
      showError("Error connecting wallet: " + error.message);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleCertificateFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
      setIpfsHash("");
      setIpfsError("");
    }
  };

  const testIPFSConnection = async () => {
    setIsTestingIPFS(true);
    try {
      const status = await testAuthentication();
      setIpfsConnectionStatus(status);
      if (status.connected) {
        showSuccess(
          `Connected to IPFS! Peer ID: ${status.peerID?.substring(0, 12)}...`
        );
      } else {
        showError(`IPFS connection failed: ${status.error}`);
      }
    } catch (error) {
      setIpfsConnectionStatus({ connected: false, error: error.message });
      showError(`IPFS connection failed: ${error.message}`);
    } finally {
      setIsTestingIPFS(false);
    }
  };

  const handleUploadToIPFS = async () => {
    if (!certificateFile) {
      setIpfsError("Please select a certificate file to upload");
      return;
    }

    setIsUploadingToIPFS(true);
    setIpfsError("");

    try {
      const fileName = `certificate_${Date.now()}`;
      const result = await uploadToPinata(certificateFile, fileName);
      setIpfsHash(result.hash);

      if (!certificateName) {
        setCertificateName(certificateFile.name.split(".")[0] || "Certificate");
      }

      showSuccess(
        `Certificate uploaded to IPFS successfully! Hash: ${result.hash}`
      );
    } catch (error) {
      const errorMessage =
        error.message || "Failed to upload to IPFS. Please try again.";
      setIpfsError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsUploadingToIPFS(false);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();

    if (!holderAddress || !ipfsHash || !certificateName || !institutionName) {
      showError("Please fill in all required fields and upload a file to IPFS");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(holderAddress)) {
      showError("Please enter a valid Ethereum address (e.g., 0x123...)");
      return;
    }

    setIssuingCertificate(true);

    try {
      showInfo("Issuing certificate on blockchain...");

      const result = await issueCertificateOnChain({
        recipientAddress: holderAddress,
        ipfsHash: ipfsHash,
        certificateType: "Certificate",
        recipientName: "New Recipient",
        issuerName: institutionName,
      });

      if (!result.success) {
        throw new Error(
          result.error || "Failed to issue certificate on blockchain"
        );
      }

      const newCertificate = {
        id: `cert-${result.tokenId}`,
        holder: holderAddress,
        name: "New Recipient",
        type: "Certificate",
        title: certificateName,
        issueDate: completionDate,
        status: "Issued",
        institution: institutionName,
        details: "Certificate issued successfully on blockchain",
        hash: ipfsHash,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
      };

      setIssuedCertificates([newCertificate, ...issuedCertificates]);

      // Clear form
      setHolderAddress("");
      setCertificateName("");
      setCompletionDate("");
      setInstitutionName("");
      setCertificateFile(null);
      setIpfsHash("");

      showSuccess(
        `Certificate issued successfully! Token ID: ${result.tokenId}`
      );
    } catch (error) {
      console.error("Error issuing certificate:", error);
      showError(`Failed to issue certificate: ${error.message}`);
    } finally {
      setIssuingCertificate(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      showError("Failed to copy to clipboard");
    }
  };

  // Handle position changes for draggable elements
  const handlePositionChange = (elementId, newPosition) => {
    setElementPositions((prev) => ({
      ...prev,
      [elementId]: newPosition,
    }));
  };

  // Handle drag and drop events for Excel files
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverExcel(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverExcel(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverExcel(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (["xlsx", "xls", "csv"].includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        showError("Please upload a valid Excel file (.xlsx, .xls) or CSV file");
      }
    }
  };

  // Handle drag and drop events for certificate files
  const handleCertificateDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCertificateDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverCertificate(true);
  };

  const handleCertificateDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverCertificate(false);
  };

  const handleCertificateDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverCertificate(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (["pdf", "jpg", "jpeg", "png", "json"].includes(fileExtension)) {
        setCertificateFile(file);
        setIpfsHash("");
        setIpfsError("");
      } else {
        showError(
          "Please upload a valid certificate file (PDF, JPG, PNG, JSON)"
        );
      }
    }
  };

  // Process Excel file
  const handleProcessExcel = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
        showError("Please upload a valid Excel file (.xlsx, .xls) or CSV file");
        setIsUploading(false);
        return;
      }

      let XLSX;
      try {
        XLSX = await import("xlsx");
      } catch (error) {
        showError(
          "Excel processing library not available. Please install xlsx package: npm install xlsx"
        );
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            showError(
              "The Excel file appears to be empty or has no valid data"
            );
            setIsUploading(false);
            return;
          }

          processCertificateData(jsonData);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          showError(`Error processing Excel file: ${error.message}`);
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        showError("Error reading the file");
        setIsUploading(false);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error("Error in handleProcessExcel:", error);
      showError(`Error processing file: ${error.message}`);
      setIsUploading(false);
    }
  };

  // Process certificate data from Excel
  const processCertificateData = (data) => {
    console.log("Processing certificate data:", data);

    const firstRow = data[0];
    const requiredFields = ["Name", "Address"];
    const missingFields = requiredFields.filter(
      (field) => !(field in firstRow)
    );

    if (missingFields.length > 0) {
      showWarning(
        `Missing required columns: ${missingFields.join(
          ", "
        )}. Found columns: ${Object.keys(firstRow).join(", ")}`
      );
    }

    setProcessedExcelData(data);
    setIsUploading(false);
    showSuccess(
      `Excel file processed successfully! Found ${data.length} certificate recipient(s). Ready to customize certificates.`
    );
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

  // Toggle certificate preview
  const handlePreviewToggle = () => {
    setPreviewVisible(!previewVisible);
  };

  // Function to generate a certificate ID based on recipient details
  const generateCertificateId = (recipientName, issuerName, issueDate) => {
    const input = `${recipientName}|${issuerName}|${issueDate}|${Date.now()}`;
    let hash = "";
    const chars =
      "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456789";

    let seed = 0;
    for (let i = 0; i < input.length; i++) {
      seed = ((seed << 5) - seed + input.charCodeAt(i)) & 0xffffffff;
    }

    for (let i = 0; i < 44; i++) {
      const variation = seed + i * 1234567 + input.charCodeAt(i % input.length);
      const index = Math.abs(variation) % chars.length;
      hash += chars[index];
      seed = (seed * 1103515245 + 12345) & 0xffffffff;
    }

    return `Qm${hash}`;
  };

  // Generate certificate PDF
  const generateCertificatePDF = async () => {
    if (!recipientName || !certificateTitle || !issuerName) {
      showError(
        "Please fill in at least Recipient Name, Certificate Title, and Issuing Institution"
      );
      return;
    }

    try {
      let jsPDF, html2canvas;
      try {
        const jsPDFModule = await import("jspdf");
        const html2canvasModule = await import("html2canvas");
        jsPDF = jsPDFModule.default;
        html2canvas = html2canvasModule.default;
      } catch (error) {
        showError(
          "PDF generation libraries not available. Please install: npm install jspdf html2canvas"
        );
        return;
      }

      showInfo("Generating certificate PDF...");

      const certificateElement = certificateContainerRef.current;
      if (!certificateElement) {
        showError("Certificate preview not found");
        return;
      }

      certificateElement.offsetHeight;

      const draggableElements =
        certificateElement.querySelectorAll(".absolute");
      const originalStyles = [];

      draggableElements.forEach((element, index) => {
        originalStyles[index] = {
          border: element.style.border,
          padding: element.style.padding,
          backgroundColor: element.style.backgroundColor,
        };
        element.style.border = "none";
        element.style.padding = "0";
        element.style.backgroundColor = "transparent";
      });

      const canvas = await html2canvas(certificateElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: certificateElement.offsetWidth,
        height: certificateElement.offsetHeight,
        x: 0,
        y: 0,
      });

      draggableElements.forEach((element, index) => {
        if (originalStyles[index]) {
          element.style.border = originalStyles[index].border;
          element.style.padding = originalStyles[index].padding;
          element.style.backgroundColor = originalStyles[index].backgroundColor;
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

      const filename = `${recipientName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${certificateTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Certificate.pdf`;

      pdf.save(filename);

      showSuccess("Certificate PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showError(`Error generating PDF: ${error.message}`);
    }
  };

  // Helper function to update DOM content directly and wait for changes
  const updateCertificateContentAndCapture = async (
    recipientNameValue,
    certificateIdValue
  ) => {
    return new Promise((resolve) => {
      setRecipientName(recipientNameValue);
      setCertificateId(certificateIdValue);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  };

  // Generate certificates for all Excel data
  const generateBulkCertificates = async () => {
    if (processedExcelData.length === 0) {
      showError(
        "No Excel data found. Please upload and process an Excel file first."
      );
      return;
    }

    if (!certificateTitle || !issuerName) {
      showError(
        "Please fill in Certificate Title and Issuing Institution before generating bulk certificates"
      );
      return;
    }

    try {
      let jsPDF, html2canvas;
      try {
        const jsPDFModule = await import("jspdf");
        const html2canvasModule = await import("html2canvas");
        jsPDF = jsPDFModule.default;
        html2canvas = html2canvasModule.default;
      } catch (error) {
        showError(
          "PDF generation libraries not available. Please install: npm install jspdf html2canvas"
        );
        return;
      }

      showInfo(`Generating ${processedExcelData.length} certificates...`);

      const originalName = recipientName;
      const originalCertId = certificateId;

      for (let i = 0; i < processedExcelData.length; i++) {
        const recipient = processedExcelData[i];

        const recipientNameForId =
          recipient.Name || recipient.name || `Recipient ${i + 1}`;
        const uniqueHash = generateCertificateId(
          recipientNameForId,
          issuerName,
          issueDate
        );

        const currentRecipientName =
          recipient.Name || recipient.name || `Recipient ${i + 1}`;

        await updateCertificateContentAndCapture(
          currentRecipientName,
          uniqueHash
        );

        const certificateElement = certificateContainerRef.current;
        if (!certificateElement) continue;

        certificateElement.offsetHeight;

        const draggableElements =
          certificateElement.querySelectorAll(".absolute");
        const originalStyles = [];

        draggableElements.forEach((element, index) => {
          originalStyles[index] = {
            border: element.style.border,
            padding: element.style.padding,
            backgroundColor: element.style.backgroundColor,
          };
          element.style.border = "none";
          element.style.padding = "0";
          element.style.backgroundColor = "transparent";
        });

        const canvas = await html2canvas(certificateElement, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: certificateElement.offsetWidth,
          height: certificateElement.offsetHeight,
          x: 0,
          y: 0,
        });

        draggableElements.forEach((element, index) => {
          if (originalStyles[index]) {
            element.style.border = originalStyles[index].border;
            element.style.padding = originalStyles[index].padding;
            element.style.backgroundColor =
              originalStyles[index].backgroundColor;
          }
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

        const filename = `${currentRecipientName.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_${certificateTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Certificate.pdf`;

        pdf.save(filename);

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setRecipientName(originalName);
      setCertificateId(originalCertId);

      showSuccess(
        `Successfully generated ${processedExcelData.length} certificates!`
      );
    } catch (error) {
      console.error("Error generating bulk certificates:", error);
      showError(`Error generating bulk certificates: ${error.message}`);
      setRecipientName(originalName);
      setCertificateId(originalCertId);
    }
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

  // Load certificates from localStorage on initial render
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCertificates = JSON.parse(
        localStorage.getItem("issuedCertificates") || "[]"
      );
      if (storedCertificates.length > 0) {
        setIssuedCertificates((prevCerts) => {
          const existingIds = prevCerts.map((cert) => cert.id);
          const newCerts = storedCertificates.filter(
            (cert) => !existingIds.includes(cert.id)
          );
          return [...prevCerts, ...newCerts];
        });
      }
    }
  }, []);

  const renderBlockchainStatus = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        🔗 Blockchain Status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Wallet Connection */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Wallet</p>
            <p
              className={`font-medium ${
                walletConnected ? "text-green-600" : "text-red-600"
              }`}>
              {walletConnected ? "Connected" : "Not Connected"}
            </p>
            {walletConnected && walletAddress && (
              <p className="text-xs text-gray-500 mt-1">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            )}
          </div>
          {!walletConnected && (
            <button
              onClick={handleConnectWallet}
              disabled={isConnectingWallet}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {isConnectingWallet ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>

        {/* Contract Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Smart Contract</p>
            <p
              className={`font-medium ${
                contractAddress && contractAddress !== "0x..."
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}>
              {contractAddress && contractAddress !== "0x..."
                ? "Deployed"
                : "Not Deployed"}
            </p>
            {contractAddress && contractAddress !== "0x..." && (
              <p className="text-xs text-gray-500 mt-1">
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Network Info */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Network</p>
            <p className="font-medium text-blue-600">
              {process.env.NEXT_PUBLIC_CHAIN_ID === "31337"
                ? "Local Hardhat"
                : process.env.NEXT_PUBLIC_CHAIN_ID === "11155111"
                ? "Sepolia Testnet"
                : "Ethereum"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Chain ID: {process.env.NEXT_PUBLIC_CHAIN_ID || "31337"}
            </p>
          </div>
        </div>
      </div>

      {(!contractAddress || contractAddress === "0x...") && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ <strong>Smart contract not deployed.</strong> Please deploy your
            CertificateNFT contract and update the NEXT_PUBLIC_CONTRACT_ADDRESS
            environment variable.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={hideNotification}
      />

      {renderBlockchainStatus()}

      {/* Create Certificate Tab */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Upload Certificate Data
              </h2>
              <p className="text-gray-600 mb-6">
                Upload an Excel file with certificate data including recipient
                names and wallet addresses.
              </p>

              <div className="mb-6">
                <div
                  className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                    isDragOverExcel
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}>
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
                      <p className="mb-2">Drag and drop an Excel file here</p>
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
                className="w-full mb-6">
                {isUploading ? "Processing..." : "Process Excel File"}
              </Button>

              {/* Display processed Excel data */}
              {processedExcelData.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-green-800 font-medium mb-2">
                    ✓ Excel Data Processed Successfully
                  </h4>
                  <p className="text-green-700 mb-3">
                    Found {processedExcelData.length} recipients
                  </p>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="text-left p-1">Name</th>
                          <th className="text-left p-1">Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedExcelData.slice(0, 5).map((item, index) => (
                          <tr key={index} className="border-b border-green-200">
                            <td className="p-1">
                              {item.Name || item.name || "N/A"}
                            </td>
                            <td className="p-1 font-mono text-xs">
                              {item.Address || item.address || "N/A"}
                            </td>
                          </tr>
                        ))}
                        {processedExcelData.length > 5 && (
                          <tr>
                            <td
                              colSpan="2"
                              className="p-1 text-center text-green-600">
                              ... and {processedExcelData.length - 5} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    onClick={generateBulkCertificates}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700"
                    disabled={!certificateTitle || !issuerName}>
                    Generate All Certificates ({processedExcelData.length} PDFs)
                  </Button>
                  <p className="text-xs text-green-600 mt-1">
                    Make sure to fill in Certificate Title and Issuing
                    Institution below before generating bulk certificates
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Certificate Generator
              </h2>
              <p className="text-gray-600 mb-6">
                Design and create certificates directly on the web app.
              </p>

              {/* Basic form for certificate creation */}
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
                    placeholder="Full Name"
                    required
                  />
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Certificate Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    value={certificateTitle}
                    onChange={(e) => setCertificateTitle(e.target.value)}
                    placeholder="e.g., Bachelor of Computer Science"
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
                    placeholder="Institution Name"
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
                  onChange={(e) => setCertificateDescription(e.target.value)}
                  placeholder="Describe what the certificate is for"
                />
              </div>

              <Button onClick={generateCertificatePDF} className="w-full">
                Generate Certificate PDF
              </Button>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              <ol className="list-decimal list-inside space-y-4 text-gray-600">
                <li>
                  <span className="font-medium">Upload Data:</span> Use an Excel
                  file with certificate details.
                </li>
                <li>
                  <span className="font-medium">Design Certificates:</span>{" "}
                  Choose templates and customize appearance.
                </li>
                <li>
                  <span className="font-medium">Review & Generate:</span>{" "}
                  Preview certificates and make adjustments.
                </li>
                <li>
                  <span className="font-medium">Issue on Blockchain:</span>{" "}
                  Securely issue certificates to recipients.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Issue Certificate Tab */}
      {activeTab === "issue" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Upload Certificate to IPFS
              </h2>
              <p className="text-gray-600 mb-4">
                Upload your certificate file to IPFS for decentralized storage.
              </p>

              {/* IPFS Connection Status */}
              <div className="mb-6 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">IPFS Connection</h3>
                  <Button
                    onClick={testIPFSConnection}
                    disabled={isTestingIPFS}
                    variant="outline"
                    size="sm">
                    {isTestingIPFS ? "Testing..." : "Test Connection"}
                  </Button>
                </div>

                {ipfsConnectionStatus && (
                  <div
                    className={`flex items-center ${
                      ipfsConnectionStatus.connected
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      {ipfsConnectionStatus.connected ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      )}
                    </svg>
                    <span className="text-sm">
                      {ipfsConnectionStatus.connected
                        ? `Connected (Peer ID: ${ipfsConnectionStatus.peerID?.substring(
                            0,
                            12
                          )}...)`
                        : `Not connected: ${ipfsConnectionStatus.error}`}
                    </span>
                  </div>
                )}
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <div className="border-2 border-dashed rounded-md p-6 text-center border-gray-300">
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
                  Accepted file formats: PDF, JPG, PNG
                </p>
              </div>

              {ipfsError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {ipfsError}
                </div>
              )}

              {ipfsHash && (
                <div className="mb-6 p-4 bg-green-50 rounded-md">
                  <h3 className="text-green-700 font-medium mb-2">
                    File Uploaded to IPFS
                  </h3>
                  <div className="flex items-center">
                    <p className="text-sm font-mono break-all">{ipfsHash}</p>
                    <button
                      onClick={() =>
                        window.open(getIPFSUrl(ipfsHash, true), "_blank")
                      }
                      className="ml-2 text-primary-blue hover:text-blue-700">
                      View
                    </button>
                    <button
                      onClick={() => copyToClipboard(ipfsHash)}
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
              )}

              <Button
                onClick={handleUploadToIPFS}
                disabled={!certificateFile || isUploadingToIPFS || ipfsHash}
                className="w-full">
                {isUploadingToIPFS ? "Uploading to IPFS..." : "Upload to IPFS"}
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Issue Certificate</h2>
              <p className="text-gray-600 mb-6">
                Issue a certificate to a holder by providing their details.
              </p>

              <form onSubmit={handleIssueCertificate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Holder's Wallet Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue font-mono"
                      placeholder="0x..."
                      value={holderAddress}
                      onChange={(e) => setHolderAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Name/Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="e.g., Bachelor of Computer Science"
                      value={certificateName}
                      onChange={(e) => setCertificateName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      placeholder="e.g., Multimedia University"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      required
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
                      This is the IPFS hash of your uploaded certificate file
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">IPFS Storage</h2>
              <p className="text-gray-600 mb-4">
                Your certificate files are securely stored on IPFS
                (InterPlanetary File System), a decentralized storage network.
              </p>

              <div className="space-y-4 text-gray-600">
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
                      We support various file formats, including PDF, JPG, and
                      PNG.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issued Certificates Tab */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Issued Certificates</h2>
          <p className="text-gray-600 mb-6">
            View all certificates you have issued.
          </p>

          {issuedCertificates.length === 0 ? (
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
              <p className="text-gray-500">No certificates issued yet.</p>
            </div>
          ) : (
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
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Issued
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                            ({cert.holder.slice(0, 6)}...{cert.holder.slice(-4)}
                            )
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cert.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cert.issueDate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-green-600 font-medium text-sm">
                          ✅ {cert.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() =>
                            window.open(getIPFSUrl(cert.hash, true), "_blank")
                          }
                          className="text-primary-blue hover:text-blue-800 mr-3">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { getIPFSUrl, testAuthentication, uploadToIPFS } from "../../utils/ipfs";
import useNotification from "../../utils/useNotification";
import Notification from "../Notification";
import SignaturePad from "../SignaturePad";
import DraggableElement from "../DraggableElement";
import {
  connectWallet,
  issueCertificateOnChain,
  revokeCertificate,
  unpauseContract,
  getContractStatus,
} from "../../utils/contract";
import { isResultUserRejection } from "../../utils/errorHandling";
import Button from "../Button";

export default function IssuerDashboard({ activeTab, user }) {
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

  // Revoke certificate state
  const [revokeConfirmModal, setRevokeConfirmModal] = useState({
    show: false,
    certificate: null,
  });
  const [isRevoking, setIsRevoking] = useState(false);

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

  // Blockchain connection state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isIssuer, setIsIssuer] = useState(false);
  const [contractPaused, setContractPaused] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

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

  // Load certificates and check blockchain status on component mount
  useEffect(() => {
    checkBlockchainStatus(); // Check blockchain status on component mount
    if (user?.walletAddress) {
      loadIssuerCertificates(user.walletAddress);
    }
  }, [user?.walletAddress]);

  // Add a trigger to force refresh certificates periodically
  useEffect(() => {
    // Only set up if user is connected
    if (!user?.walletAddress) return;

    // Refresh certificates every 5 seconds to catch any blockchain updates
    const intervalId = setInterval(() => {
      console.log("Refreshing certificates (interval)");
      loadIssuerCertificates(user.walletAddress);
    }, 5000);

    return () => clearInterval(intervalId); // Clean up on unmount
  }, [user?.walletAddress]);

  // Function to load issuer certificates from database
  const loadIssuerCertificates = async (walletAddress) => {
    try {
      console.log("Loading certificates for issuer:", walletAddress);
      const response = await fetch(`/api/certificates/issuer/${walletAddress}`);

      if (response.ok) {
        const data = await response.json();
        console.log("Certificates loaded:", data);
        if (data.success && data.certificates) {
          // Make sure certificates have correct capitalized status
          const fixedCertificates = data.certificates.map((cert) => ({
            ...cert,
            status:
              cert.status === "revoked" || cert.status === "Revoked"
                ? "Revoked"
                : "Issued",
          }));
          console.log("Setting certificates with status:", fixedCertificates);
          setIssuedCertificates(fixedCertificates);
        } else {
          setIssuedCertificates([]);
        }
      } else if (response.status === 404) {
        // No certificates found for this issuer - this is normal
        setIssuedCertificates([]);
      } else {
        console.error("Failed to load issuer certificates:", response.status);
        setIssuedCertificates([]);
      }
    } catch (error) {
      console.error("Error loading issuer certificates:", error);
      setIssuedCertificates([]);
    }
  };

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
      const result = await uploadToIPFS(certificateFile, fileName);
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

      console.log("🔍 DEBUG: Starting certificate issuance with:", {
        recipientAddress: holderAddress,
        ipfsHash: ipfsHash,
        certificateType: "Certificate",
        recipientName: "New Recipient",
        issuerName: institutionName,
        walletConnected,
        walletAddress,
        contractAddress,
      });

      const result = await issueCertificateOnChain({
        recipientAddress: holderAddress,
        ipfsHash: ipfsHash,
        certificateType: "Certificate",
        recipientName: "New Recipient",
        issuerName: institutionName,
      });

      console.log("🔍 DEBUG: Blockchain result:", result);

      if (!result.success) {
        console.error("🚨 DEBUG: Blockchain call failed:", result.error);

        // Handle user rejection gracefully
        if (isResultUserRejection(result)) {
          showInfo("Transaction was cancelled. No certificate was issued.");
          return; // Exit early without showing error
        }

        throw new Error(
          result.error || "Failed to issue certificate on blockchain"
        );
      }

      console.log(
        "✅ DEBUG: Certificate issued successfully with tokenId:",
        result.tokenId
      );

      // Save certificate to database
      try {
        const dbSaveResponse = await fetch("/api/certificates/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenId: result.tokenId,
            ipfsHash: ipfsHash,
            issuerWallet: walletAddress, // Current user's wallet
            holderWallet: holderAddress,
            title: certificateName,
            description: `Certificate: ${certificateName}`,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
          }),
        });

        if (!dbSaveResponse.ok) {
          const dbError = await dbSaveResponse.json();
          console.warn("⚠️ Failed to save certificate to database:", dbError);
          showWarning(
            "Certificate issued on blockchain but failed to save to database"
          );
        } else {
          console.log("✅ Certificate saved to database successfully");
          // Reload certificates from database to get the updated list
          if (user?.walletAddress) {
            await loadIssuerCertificates(user.walletAddress);
          }
        }
      } catch (dbError) {
        console.warn("⚠️ Database save error:", dbError);
        showWarning(
          "Certificate issued on blockchain but failed to save to database"
        );
      }

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
      console.error("🚨 DEBUG: Error issuing certificate:", error);
      console.error("🚨 DEBUG: Error details:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });

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
  const updateCertificateContentAndCapture = async (recipientNameValue) => {
    return new Promise((resolve) => {
      setRecipientName(recipientNameValue);

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

      for (let i = 0; i < processedExcelData.length; i++) {
        const recipient = processedExcelData[i];

        const currentRecipientName =
          recipient.Name || recipient.name || `Recipient ${i + 1}`;

        await updateCertificateContentAndCapture(currentRecipientName);

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

      showSuccess(
        `Successfully generated ${processedExcelData.length} certificates!`
      );
    } catch (error) {
      console.error("Error generating bulk certificates:", error);
      showError(`Error generating bulk certificates: ${error.message}`);
      setRecipientName(originalName);
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

  // LocalStorage migration functionality has been removed
  // All certificates are now stored directly in the database

  // Clean up any legacy localStorage data on component mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if legacy data exists
      const legacyData = localStorage.getItem("issuedCertificates");
      if (legacyData) {
        console.log("🧹 Cleaning up legacy localStorage certificates data");
        localStorage.removeItem("issuedCertificates");
      }
    }
  }, []);

  // Handle certificate revocation
  const handleRevokeCertificate = async (certificate) => {
    if (!certificate.tokenId) {
      showError("Cannot revoke certificate: Token ID not found");
      return;
    }

    setIsRevoking(true);

    try {
      showInfo(
        "Revoking certificate on blockchain. Please confirm in MetaMask..."
      );
      console.log("Revoking certificate with tokenId:", certificate.tokenId);

      // Use the direct contract function call which will trigger MetaMask
      const result = await revokeCertificate(certificate.tokenId);
      console.log("Revocation result:", result);

      if (!result.success) {
        if (result.userRejected) {
          showInfo("Transaction was cancelled by user.");
          setRevokeConfirmModal({ show: false, certificate: null });
          return;
        }
        throw new Error(result.error || "Failed to revoke certificate");
      }

      // Update in database after successful blockchain transaction
      const response = await fetch(`/api/certificates/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: certificate.tokenId,
          status: "Revoked",
          transactionHash: result.transactionHash,
        }),
      });

      if (!response.ok) {
        console.warn(
          "Database update warning: Status update failed in database, but blockchain transaction succeeded"
        );
      }

      // Force certificate status update immediately for UI responsiveness
      console.log("Updating certificate status in UI");

      // Create a completely new array with the updated certificate to force re-render
      const updatedCertificates = issuedCertificates.map((cert) => {
        if (cert.id === certificate.id) {
          return { ...cert, status: "Revoked" };
        }
        return cert;
      });

      console.log("Updated certificates array:", updatedCertificates);

      // Set the state with the new array
      setIssuedCertificates([...updatedCertificates]);

      // Also reload from database to ensure data consistency
      if (user?.walletAddress) {
        console.log("Reloading certificates from database");
        await loadIssuerCertificates(user.walletAddress);
      }

      showSuccess(
        `Certificate revoked successfully! Transaction: ${result.transactionHash}`
      );
      setRevokeConfirmModal({ show: false, certificate: null });
    } catch (error) {
      console.error("Error revoking certificate:", error);
      showError(`Failed to revoke certificate: ${error.message}`);
    } finally {
      setIsRevoking(false);
    }
  };

  const openRevokeConfirmation = (certificate) => {
    setRevokeConfirmModal({ show: true, certificate });
  };

  const closeRevokeConfirmation = () => {
    setRevokeConfirmModal({ show: false, certificate: null });
  };

  const renderBlockchainStatus = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        🔗 Blockchain Status
        {isCheckingStatus && (
          <span className="ml-2 text-sm text-gray-500">Checking...</span>
        )}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Wallet Connection */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Wallet</p>
            <p
              className={`font-medium ${
                isWalletConnected ? "text-green-600" : "text-red-600"
              }`}>
              {isWalletConnected ? "Connected" : "Not Connected"}
            </p>
            {isWalletConnected && walletAddress && (
              <p className="text-xs text-gray-500 mt-1">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            )}
          </div>
          {!isWalletConnected && (
            <button
              onClick={checkBlockchainStatus}
              disabled={isCheckingStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {isCheckingStatus ? "Connecting..." : "Connect Wallet"}
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

        {/* Contract Pause Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Contract Status</p>
            <p
              className={`font-medium ${
                contractPaused ? "text-red-600" : "text-green-600"
              }`}>
              {contractPaused ? (
                <>
                  <i className="bx bx-pause-circle"></i> Paused
                </>
              ) : (
                <>
                  <i className="bx bx-play-circle"></i> Active
                </>
              )}
            </p>
            {contractPaused && (
              <p className="text-xs text-gray-500 mt-1">
                Certificate issuance disabled
              </p>
            )}
          </div>
          {contractPaused && isAdmin && (
            <button
              onClick={handleUnpauseContract}
              disabled={isCheckingStatus}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50">
              {isCheckingStatus ? "..." : "Unpause"}
            </button>
          )}
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

      {contractPaused && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            🚨 <strong>Contract is paused.</strong> Certificate issuance is
            currently disabled.
            {isAdmin
              ? " Click the Unpause button above to resume operations."
              : " Contact an admin to unpause the contract."}
          </p>
        </div>
      )}

      {!isWalletConnected && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            ℹ️ <strong>Connect your wallet</strong> to check your issuer role
            and begin issuing certificates.
          </p>
        </div>
      )}
    </div>
  );

  const checkBlockchainStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const result = await connectWallet();
      if (result.success) {
        setWalletAddress(result.address);
        setIsWalletConnected(true);
        setIsIssuer(result.isIssuer);
        setIsAdmin(result.isAdmin);
        setContractAddress(result.contractAddress);

        // Check contract status (paused state)
        const statusResult = await getContractStatus();
        if (statusResult.success) {
          setContractPaused(statusResult.isPaused);
        }
      } else {
        setIsWalletConnected(false);
        setWalletAddress("");
        setIsIssuer(false);
        setIsAdmin(false);
        setContractPaused(false);
        setContractAddress("");
      }
    } catch (error) {
      console.error("Error checking blockchain status:", error);
      setIsWalletConnected(false);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleUnpauseContract = async () => {
    setIsCheckingStatus(true);
    try {
      showInfo("Unpausing contract...");
      const result = await unpauseContract();

      if (result.success) {
        showSuccess("Contract unpaused successfully!");
        // Refresh blockchain status
        await checkBlockchainStatus();
      } else {
        // Handle user rejection gracefully
        if (isResultUserRejection(result)) {
          showInfo("Transaction was cancelled. Contract remains paused.");
          return; // Exit early without showing error
        }

        showError(`Failed to unpause contract: ${result.error}`);
      }
    } catch (error) {
      console.error("Error unpausing contract:", error);

      showError("Failed to unpause contract");
    } finally {
      setIsCheckingStatus(false);
    }
  };

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

              {/* Certificate details form */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="text-lg font-medium mb-4">Certificate Detail</h3>

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
                    Upload a certificate template image (PNG or JPG) exported
                    from Canva or any design tool
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
                  <label className="block text-sm font-medium text-gray-700">
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
                          onChange={(e) => setLeftSignatureName(e.target.value)}
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
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handlePreviewToggle}
                  variant="secondary"
                  className="flex-1">
                  {previewVisible ? "Hide Preview" : "Show Preview"}
                </Button>
                <Button className="flex-1" onClick={generateCertificatePDF}>
                  Generate Certificate PDF
                </Button>
              </div>

              {previewVisible && (
                <div className="mt-6 p-4 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">Certificate Preview</h3>
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
                        elements to position them precisely on your certificate
                        template. Changes will be saved automatically.
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
                            Upload a certificate template image to see preview
                            with your content
                          </p>
                        </div>
                      )}

                      {/* Draggable elements */}
                      {certificateTemplate && (
                        <>
                          <DraggableElement
                            id="certificateTitle"
                            position={elementPositions.certificateTitle}
                            onPositionChange={handlePositionChange}
                            isEditMode={isEditMode}
                            containerRef={certificateContainerRef}
                            className="text-center">
                            <div
                              className="text-2xl font-bold px-4 py-1 min-w-[200px]"
                              style={{
                                fontFamily: "Times New Roman, serif",
                              }}>
                              {certificateTitle || "Certificate Title"}
                            </div>
                          </DraggableElement>

                          <DraggableElement
                            id="issuerName"
                            position={elementPositions.issuerName}
                            onPositionChange={handlePositionChange}
                            isEditMode={isEditMode}
                            containerRef={certificateContainerRef}
                            className="text-center">
                            <div
                              className="text-lg font-medium px-4 py-1 min-w-[200px]"
                              style={{
                                fontFamily: "Times New Roman, serif",
                              }}>
                              {issuerName || "Institution Name"}
                            </div>
                          </DraggableElement>

                          <DraggableElement
                            id="recipientName"
                            position={elementPositions.recipientName}
                            onPositionChange={handlePositionChange}
                            isEditMode={isEditMode}
                            containerRef={certificateContainerRef}
                            className="text-center">
                            <div className="text-4xl font-script px-4 py-1 min-w-[200px]">
                              {recipientName || "Recipient Name"}
                            </div>
                          </DraggableElement>

                          <DraggableElement
                            id="description"
                            position={elementPositions.description}
                            onPositionChange={handlePositionChange}
                            isEditMode={isEditMode}
                            containerRef={certificateContainerRef}
                            className="text-center">
                            <div
                              className="text-sm max-w-md px-4 py-1 min-w-[200px]"
                              style={{
                                fontFamily: "Times New Roman, serif",
                              }}>
                              {certificateDescription ||
                                "Certificate Description"}
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
                              <p
                                className="text-sm"
                                style={{
                                  fontFamily: "Times New Roman, serif",
                                }}>
                                {leftSignatureName || "Left Signer"}
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
                                rightSignature.startsWith("data:image") ? (
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
                              <p
                                className="text-sm"
                                style={{
                                  fontFamily: "Times New Roman, serif",
                                }}>
                                {rightSignatureName || "Right Signer"}
                              </p>
                            </div>
                          </DraggableElement>
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
            <div className="sticky top-6 space-y-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <ol className="list-decimal list-inside space-y-4 text-gray-600">
                  <li>
                    <span className="font-medium">Upload Data:</span> Use an
                    Excel file with certificate details.
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

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  How to Use Your Own Template
                </h2>
                <ol className="list-decimal list-inside space-y-4 text-gray-600">
                  <li>
                    Design your certificate in Canva exactly how you want it to
                    look
                  </li>
                  <li>
                    Export it as a PNG (with transparent background if
                    applicable)
                  </li>
                  <li>
                    In the certificate generator, use the "Upload Template"
                    button to upload your Canva design
                  </li>
                  <li>Your certificate design will appear as the background</li>
                  <li>
                    Click "Position Elements" to drag and place text and
                    signatures exactly where you want them
                  </li>
                  <li>
                    Click "Save Positions" when you're satisfied with the layout
                  </li>
                </ol>
              </div>
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

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                How Certificate Issuance Works
              </h2>
              <p className="text-gray-600 mb-4">
                Understanding the blockchain certificate issuance process,
                costs, and requirements.
              </p>

              <div className="space-y-4 text-gray-600">
                {/* Requirements */}
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-yellow-800">Requirements</p>
                    <p className="text-yellow-700">
                      You need a connected MetaMask wallet with sufficient ETH
                      for gas fees, a valid recipient wallet address (0x...),
                      and a certificate file uploaded to IPFS. Ensure your
                      wallet is connected to the correct network before issuing.
                    </p>
                  </div>
                </div>

                {/* Cost Information */}
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-blue-800">
                      Transaction Costs
                    </p>
                    <p className="text-blue-700">
                      Only blockchain gas fees required ($0.50 - $5.00 USD).
                      IPFS storage is free.
                    </p>
                  </div>
                </div>

                {/* Step by Step Guide */}
                <div>
                  <p className="font-medium">Step-by-Step Process</p>
                  <div className="space-y-1">
                    <p>
                      1. Upload your certificate file (PDF, JPG, or PNG) to IPFS
                      for permanent decentralized storage
                    </p>
                    <p>
                      2. Enter recipient's wallet address, certificate name,
                      institution, and completion date
                    </p>
                    <p>
                      3. Connect your MetaMask wallet and confirm the blockchain
                      transaction
                    </p>
                    <p>
                      4. Certificate is minted as an NFT and permanently
                      recorded on the blockchain
                    </p>
                  </div>
                </div>

                {/* What Happens After */}
                <div>
                  <p className="font-medium">What Happens After Issuance</p>
                  <p>
                    The certificate appears in the recipient's wallet as an NFT
                    and becomes permanently verifiable on the blockchain. Anyone
                    can verify the certificate's authenticity using the
                    transaction hash, and the certificate file remains
                    accessible via IPFS forever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issued Certificates Tab */}
      {activeTab === "certificates" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Issued Certificate</h2>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revoke
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {issuedCertificates.map((cert) => (
                    <tr
                      key={`cert-${cert.id}-${cert.status}-${
                        cert.tokenId || "none"
                      }`}>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                        {cert.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {cert.name}
                          </div>
                          <div className="ml-2 text-xs text-gray-500">
                            (
                            {cert.holder
                              ? `${cert.holder.slice(
                                  0,
                                  6
                                )}...${cert.holder.slice(-4)}`
                              : "N/A"}
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
                        <span
                          className={`font-medium text-sm ${
                            cert.status === "Revoked" ||
                            cert.status === "revoked"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                          data-status={cert.status}>
                          {" "}
                          {/* Added data attribute for debugging */}
                          {cert.status === "Revoked" ||
                          cert.status === "revoked"
                            ? "🚫 Revoked"
                            : "✅ Issued"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cert.status !== "Revoked" &&
                        cert.status !== "revoked" &&
                        cert.tokenId ? (
                          <button
                            onClick={() => openRevokeConfirmation(cert)}
                            disabled={isRevoking}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50">
                            Revoke
                          </button>
                        ) : (
                          <button
                            disabled={true}
                            className="bg-gray-400 text-white px-3 py-1 rounded text-sm opacity-50 cursor-not-allowed">
                            {cert.status === "Revoked" ||
                            cert.status === "revoked"
                              ? "Revoked"
                              : "N/A"}
                          </button>
                        )}
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

      {/* Revoke Confirmation Modal */}
      {revokeConfirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-800">
                Revoke Certificate
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                <strong>WARNING:</strong> This action will permanently revoke
                the certificate on the blockchain. This cannot be undone.
              </p>

              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-red-800 text-sm mb-2">
                  <strong>Certificate to revoke:</strong>
                </p>
                <p className="text-red-700 text-sm break-words leading-relaxed">
                  <strong>Title:</strong>{" "}
                  {revokeConfirmModal.certificate?.title &&
                  revokeConfirmModal.certificate.title.length > 60
                    ? `${revokeConfirmModal.certificate.title.substring(
                        0,
                        60
                      )}...`
                    : revokeConfirmModal.certificate?.title}
                </p>
                <p className="text-red-700 text-sm mt-1">
                  <strong>Holder:</strong>{" "}
                  {revokeConfirmModal.certificate?.name}
                </p>
              </div>

              <p className="text-gray-600">
                Do you wish to proceed with revoking this certificate?
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={closeRevokeConfirmation}
                disabled={isRevoking}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={() =>
                  handleRevokeCertificate(revokeConfirmModal.certificate)
                }
                disabled={isRevoking}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {isRevoking ? "Revoking..." : "Revoke Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

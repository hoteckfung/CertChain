import ProtectedRoute from "../components/ProtectedRoute";
import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import {
  uploadToPinata,
  getIPFSUrl,
  testAuthentication,
  getIPFSInfo,
} from "../utils/ipfs";
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
  const [isDragOverExcel, setIsDragOverExcel] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(true);
  const [processedExcelData, setProcessedExcelData] = useState([]);
  const [isDragOverCertificate, setIsDragOverCertificate] = useState(false);

  // Form states for certificate generation
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
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

  // Refs
  const certificateContainerRef = useRef(null);

  // Element positions
  const [elementPositions, setElementPositions] = useState({
    certificateTitle: { x: 100, y: 80 },
    issuerName: { x: 100, y: 120 },
    recipientName: { x: 100, y: 180 },
    description: { x: 100, y: 240 },
    leftSignature: { x: 100, y: 320 },
    rightSignature: { x: 300, y: 320 },
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

  // Handle file upload for Excel files
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
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
      // Check file type
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (["xlsx", "xls", "csv"].includes(fileExtension)) {
        setSelectedFile(file);
      } else {
        showError("Please upload a valid Excel file (.xlsx, .xls) or CSV file");
      }
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
      // Check file type for certificate files
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (["pdf", "jpg", "jpeg", "png", "json"].includes(fileExtension)) {
        setCertificateFile(file);
        // Reset IPFS states
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
      // Check if the file is a valid Excel file
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
        showError("Please upload a valid Excel file (.xlsx, .xls) or CSV file");
        setIsUploading(false);
        return;
      }

      // Try to import XLSX dynamically
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

          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            showError(
              "The Excel file appears to be empty or has no valid data"
            );
            setIsUploading(false);
            return;
          }

          // Process the data and set up certificates
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

      // Read the file
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

    // Validate required columns
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

    // Store the processed data
    setProcessedExcelData(data);
    setIsUploading(false);
    showSuccess(
      `Excel file processed successfully! Found ${data.length} certificate recipient(s). Ready to customize certificates.`
    );
  };

  // Test IPFS connection
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
      const fileName = `certificate_${Date.now()}`;
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

        // Show IPFS upload success
        if (result.ipfsData) {
          showInfo("File successfully uploaded to your local IPFS node!");
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

    if (
      !holderAddress ||
      !certificateName ||
      !completionDate ||
      !institutionName
    ) {
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
        type: "Certificate",
        title: certificateName,
        issueDate: completionDate,
        status: "Issued",
        institution: institutionName,
        details: "Certificate issued successfully",
        hash: ipfsHash,
      };

      setIssuedCertificates([newCertificate, ...issuedCertificates]);
      setIssuingCertificate(false);

      // Clear form
      setHolderAddress("");
      setCertificateName("");
      setCompletionDate("");
      setInstitutionName("");
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

  // Save profile changes

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

  // Function to generate a certificate ID based on recipient details
  const generateCertificateId = (recipientName, issuerName, issueDate) => {
    // Create a comprehensive input string
    const input = `${recipientName}|${issuerName}|${issueDate}|${Date.now()}`;

    // Create a more sophisticated hash
    let hash = "";
    const chars =
      "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456789";

    // Convert input to a numeric seed
    let seed = 0;
    for (let i = 0; i < input.length; i++) {
      seed = ((seed << 5) - seed + input.charCodeAt(i)) & 0xffffffff;
    }

    // Generate 44 characters using the seed
    for (let i = 0; i < 44; i++) {
      // Create variation by combining seed with position
      const variation = seed + i * 1234567 + input.charCodeAt(i % input.length);
      const index = Math.abs(variation) % chars.length;
      hash += chars[index];

      // Update seed for next iteration
      seed = (seed * 1103515245 + 12345) & 0xffffffff;
    }

    // Return IPFS-like format
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
      // Try to import required libraries dynamically
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

      // Get the certificate preview element
      const certificateElement = certificateContainerRef.current;
      if (!certificateElement) {
        showError("Certificate preview not found");
        return;
      }

      // Force a repaint/reflow to ensure positioning is applied
      certificateElement.offsetHeight;

      // Get the exact bounds of the certificate container
      const rect = certificateElement.getBoundingClientRect();

      // Temporarily hide edit mode styling for clean capture
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

      // Create canvas from the certificate element with precise positioning
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

      // Restore original styling
      draggableElements.forEach((element, index) => {
        if (originalStyles[index]) {
          element.style.border = originalStyles[index].border;
          element.style.padding = originalStyles[index].padding;
          element.style.backgroundColor = originalStyles[index].backgroundColor;
        }
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit the image
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

      // Generate filename
      const filename = `${recipientName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${certificateTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Certificate.pdf`;

      // Save the PDF
      pdf.save(filename);

      showSuccess("Certificate PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showError(`Error generating PDF: ${error.message}`);
    }
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
      // Try to import required libraries dynamically
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

      // Store the original recipient name
      const originalName = recipientName;

      for (let i = 0; i < processedExcelData.length; i++) {
        const recipient = processedExcelData[i];

        // Generate a certificate ID based on recipient details
        const recipientNameForId =
          recipient.Name || recipient.name || `Recipient ${i + 1}`;
        const uniqueHash = generateCertificateId(
          recipientNameForId,
          issuerName,
          issueDate
        );
        setCertificateId(uniqueHash);

        // Temporarily set the recipient name for this certificate
        setRecipientName(
          recipient.Name || recipient.name || `Recipient ${i + 1}`
        );

        // Wait longer for the state to update and re-render
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Force a repaint/reflow to ensure positioning is applied
        const certificateElement = certificateContainerRef.current;
        if (!certificateElement) continue;

        // Force reflow by accessing offsetHeight
        certificateElement.offsetHeight;

        // Get the exact bounds of the certificate container
        const rect = certificateElement.getBoundingClientRect();

        // Temporarily hide edit mode styling for clean capture
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

        // Create canvas from the certificate element with precise positioning
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

        // Restore original styling
        draggableElements.forEach((element, index) => {
          if (originalStyles[index]) {
            element.style.border = originalStyles[index].border;
            element.style.padding = originalStyles[index].padding;
            element.style.backgroundColor =
              originalStyles[index].backgroundColor;
          }
        });

        // Create PDF
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        // Calculate dimensions to fit the image
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        // Add image to PDF
        pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);

        // Generate filename
        const currentRecipientName =
          recipient.Name || recipient.name || `Recipient_${i + 1}`;
        const filename = `${currentRecipientName.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_${certificateTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Certificate.pdf`;

        // Save the PDF
        pdf.save(filename);

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Restore original recipient name
      setRecipientName(originalName);

      showSuccess(
        `Successfully generated ${processedExcelData.length} certificates!`
      );
    } catch (error) {
      console.error("Error generating bulk certificates:", error);
      showError(`Error generating bulk certificates: ${error.message}`);
    }
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
                      recipient names and wallet addresses.
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

                    {/* Display processed Excel data */}
                    {processedExcelData.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
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
                              {processedExcelData
                                .slice(0, 5)
                                .map((item, index) => (
                                  <tr
                                    key={index}
                                    className="border-b border-green-200">
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
                          Generate All Certificates ({processedExcelData.length}{" "}
                          PDFs)
                        </Button>
                        <p className="text-xs text-green-600 mt-1">
                          Make sure to fill in Certificate Title and Issuing
                          Institution above before generating bulk certificates
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
                            onChange={(e) =>
                              setCertificateTitle(e.target.value)
                            }
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
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none font-mono text-sm"
                          value={certificateId}
                          readOnly
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Auto-generated identifier based on certificate details
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
                        Generate Certificate PDF
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
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
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
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      How to Use Your Own Template
                    </h2>
                    <ol className="list-decimal list-inside space-y-4 text-gray-600">
                      <li>
                        Design your certificate in Canva exactly how you want it
                        to look
                      </li>
                      <li>
                        Export it as a PNG (with transparent background if
                        applicable)
                      </li>
                      <li>
                        In the certificate generator, use the "Upload Template"
                        button to upload your Canva design
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
            )}

            {/* Issue Certificates Tab */}
            {activeTab === "issue" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                      Upload Certificate to IPFS
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Upload your certificate file to IPFS for decentralized
                      storage. This will provide a unique hash that will be used
                      to issue the certificate on the blockchain.
                    </p>

                    {/* IPFS Connection Status */}
                    <div className="mb-6 p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-700">
                          IPFS Connection
                        </h3>
                        <Button
                          onClick={testIPFSConnection}
                          disabled={isTestingIPFS}
                          variant="outline"
                          size="sm">
                          {isTestingIPFS ? "Testing..." : "Test Connection"}
                        </Button>
                      </div>

                      {ipfsConnectionStatus ? (
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
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Click "Test Connection" to check IPFS Desktop status
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <div
                        className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                          isDragOverCertificate
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-300"
                        }`}
                        onDragOver={handleCertificateDragOver}
                        onDragEnter={handleCertificateDragEnter}
                        onDragLeave={handleCertificateDragLeave}
                        onDrop={handleCertificateDrop}>
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
                          <button
                            onClick={() => copyToClipboard(ipfsHash)}
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
                    )}

                    <Button
                      onClick={handleUploadToIPFS}
                      disabled={
                        !certificateFile || isUploadingToIPFS || ipfsHash
                      }
                      className="w-full">
                      {isUploadingToIPFS
                        ? "Uploading to IPFS..."
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
                            placeholder="e.g., Bachelor of Computer Science"
                            value={certificateName}
                            onChange={(e) => setCertificateName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            htmlFor="institutionName"
                            className="block text-sm font-medium text-gray-700 mb-1">
                            Institution
                          </label>
                          <input
                            type="text"
                            id="institutionName"
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
                            We support various file formats, including PDF,
                            JPG,and PNG.
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

                  <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                      Digital Certificate Process
                    </h2>
                    <p className="text-gray-600 mb-4">
                      When you issue a certificate, the following happens:
                    </p>

                    <ol className="list-decimal list-inside space-y-4 text-gray-600">
                      <li>
                        Certificate file is uploaded to IPFS for decentralized
                        storage
                      </li>
                      <li>A unique IPFS hash is generated for the file</li>
                      <li>The certificate record is created in the system</li>
                      <li>
                        The certificate is linked to the holder's wallet address
                      </li>
                      <li>
                        The certificate becomes verifiable via the IPFS hash
                      </li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0"
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
                      <div>
                        <h3 className="text-red-800 font-semibold mb-2">
                          ⚠️ Important Notice
                        </h3>
                        <p className="text-red-700 font-medium">
                          Once issued, certificates cannot be modified. Ensure
                          all information is correct before issuing.
                        </p>
                      </div>
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

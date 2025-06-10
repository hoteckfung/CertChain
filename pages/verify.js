import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PublicRoute from "../components/PublicRoute";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Search, QrCode, Upload, FileCheck } from "lucide-react";
import jsQR from "jsqr";
import { getIPFSUrl, isValidIPFSHash } from "../utils/ipfs";
import useNotification from "../utils/useNotification";
import Notification from "../components/Notification";

const VerifyPage = () => {
  const router = useRouter();
  const { method } = router.query;

  const [activeTab, setActiveTab] = useState("hash");
  const [certificateHash, setCertificateHash] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationError, setVerificationError] = useState(null);

  // Add notification state
  const {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useNotification();

  // Set active tab based on URL query parameter
  useEffect(() => {
    if (method === "qr") {
      setActiveTab("qr");
    } else {
      setActiveTab("hash");
    }
  }, [method]);

  const processQrCode = (imageUrl) => {
    setIsScanning(true);
    setScanError(null);

    const image = new Image();
    image.src = imageUrl;

    image.onload = () => {
      // Create canvas to process the image
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);

      // Get image data for QR processing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Scan QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // Successfully scanned QR code
        setCertificateHash(code.data);
        setIsScanning(false);
        // Automatically verify after scanning
        verifyHash(code.data);
      } else {
        setScanError(
          "No QR code found in the image. Please try another image."
        );
        showError("No QR code found in the image. Please try another image.");
        setIsScanning(false);
      }
    };

    image.onerror = () => {
      setScanError("Failed to load the image. Please try again.");
      showError("Failed to load the image. Please try again.");
      setIsScanning(false);
    };
  };

  const verifyHash = async (hash) => {
    if (!hash || hash.trim() === "") {
      showWarning("Please enter a certificate hash");
      return;
    }

    // Reset previous verification results
    setVerificationResult(null);
    setVerificationError(null);
    setIsVerifying(true);

    try {
      // Check if the hash is a valid IPFS hash
      if (!isValidIPFSHash(hash)) {
        throw new Error("Invalid IPFS hash format");
      }

      // First, check blockchain verification
      let blockchainVerification = null;
      try {
        const blockchainResponse = await fetch(
          `/api/blockchain/verify-certificate?ipfsHash=${encodeURIComponent(
            hash
          )}`
        );
        if (blockchainResponse.ok) {
          blockchainVerification = await blockchainResponse.json();
        }
      } catch (blockchainError) {
        console.warn("Blockchain verification failed:", blockchainError);
        // Continue with IPFS verification
      }

      // Get the IPFS URL
      const ipfsUrl = getIPFSUrl(hash);

      try {
        // Fetch the certificate from IPFS
        const response = await fetch(ipfsUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch certificate: ${response.statusText}`
          );
        }

        // Try to parse as JSON first (in case it's a JSON certificate)
        let certificateData;
        let isJsonCert = false;

        try {
          certificateData = await response.json();
          isJsonCert = true;
        } catch (e) {
          // Not JSON, likely a PDF or image, so we'll just verify it exists
          certificateData = {
            fileExists: true,
            fileUrl: ipfsUrl,
            hash: hash,
          };
        }

        // Determine verification status
        let verificationStatus = "valid";
        let verificationMessage = "Certificate verified successfully!";

        if (blockchainVerification) {
          if (!blockchainVerification.exists) {
            verificationStatus = "not_on_blockchain";
            verificationMessage =
              "Certificate file exists but is not recorded on blockchain";
          } else if (!blockchainVerification.isValid) {
            verificationStatus = "revoked";
            verificationMessage = "Certificate has been revoked by the issuer";
          } else {
            verificationStatus = "valid";
            verificationMessage =
              "Certificate is valid and verified on blockchain";
          }
        }

        // Create a verification result
        setVerificationResult({
          isValid: verificationStatus === "valid",
          verificationStatus,
          blockchainVerified: blockchainVerification?.exists || false,
          isRevoked: verificationStatus === "revoked",
          isJsonCert,
          certificate: isJsonCert
            ? {
                id: certificateData.id || hash,
                issuer:
                  blockchainVerification?.certificate?.issuerName ||
                  certificateData.issuer ||
                  certificateData.issuerName ||
                  "Unknown Issuer",
                issuedTo:
                  blockchainVerification?.certificate?.recipientName ||
                  certificateData.recipient ||
                  certificateData.recipientName ||
                  "Unknown Recipient",
                issuedDate:
                  blockchainVerification?.certificate?.issueDate ||
                  certificateData.issuedOn ||
                  certificateData.issuanceDate ||
                  new Date().toISOString().split("T")[0],
                course:
                  blockchainVerification?.certificate?.certificateType ||
                  certificateData.title ||
                  certificateData.name ||
                  "Certificate",
                description: certificateData.description || "",
                additionalData: isJsonCert ? certificateData : null,
                tokenId: blockchainVerification?.certificate?.tokenId || null,
              }
            : {
                id: hash,
                issuer:
                  blockchainVerification?.certificate?.issuerName ||
                  "Certificate Issuer",
                issuedTo:
                  blockchainVerification?.certificate?.recipientName ||
                  "Certificate Holder",
                issuedDate:
                  blockchainVerification?.certificate?.issueDate ||
                  new Date().toISOString().split("T")[0],
                course:
                  blockchainVerification?.certificate?.certificateType ||
                  "Certificate",
                fileUrl: ipfsUrl,
                tokenId: blockchainVerification?.certificate?.tokenId || null,
              },
          fileUrl: ipfsUrl,
          hash: hash,
        });

        if (verificationStatus === "valid") {
          showSuccess(verificationMessage);
        } else if (verificationStatus === "revoked") {
          showError(verificationMessage);
        } else {
          showWarning(verificationMessage);
        }
      } catch (error) {
        console.error("Error fetching certificate:", error);
        throw new Error(
          "Could not retrieve certificate data from IPFS. The hash may be incorrect or the certificate is no longer available."
        );
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError(error.message);
      showError(error.message);
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleHashVerification = async (e) => {
    if (e) e.preventDefault();
    await verifyHash(certificateHash);
  };

  const handleQrUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setQrImage(imageUrl);
        processQrCode(imageUrl);
      };

      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop functionality
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setQrImage(imageUrl);
        processQrCode(imageUrl);
      };

      reader.readAsDataURL(file);
    }
  };

  const viewCertificateOnIPFS = () => {
    if (verificationResult && verificationResult.fileUrl) {
      window.open(verificationResult.fileUrl, "_blank");
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col">
        <Head>
          <title>Verify Certificate | CertChain</title>
          <meta
            name="description"
            content="Verify the authenticity of certificates on the blockchain"
          />
        </Head>

        <Navbar />

        <main className="flex-grow py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold mb-4">
                Certificate Verification
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Verify the authenticity of any certificate issued through our
                platform. No account required - our verification system is
                public and accessible to everyone.
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Verify Certificate</CardTitle>
                <CardDescription>
                  Enter a certificate hash or scan a QR code to verify a
                  certificate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger
                      value="hash"
                      className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      By Hash
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Scan QR Code
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="hash">
                    <form
                      onSubmit={handleHashVerification}
                      className="space-y-4">
                      <div>
                        <Input
                          type="text"
                          value={certificateHash}
                          onChange={(e) => setCertificateHash(e.target.value)}
                          placeholder="Enter certificate hash (IPFS CID)"
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isVerifying || !certificateHash.trim()}>
                        {isVerifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Verify Certificate
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="qr">
                    <div
                      className="border-2 border-dashed rounded-lg p-6 text-center mb-4"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}>
                      {qrImage ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={qrImage}
                            alt="QR Code"
                            className="max-h-64 max-w-full mb-4"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              setQrImage(null);
                              setCertificateHash("");
                              setVerificationResult(null);
                              setVerificationError(null);
                            }}>
                            Upload Different Image
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 mb-4">
                            Drag and drop a QR code image, or click to upload
                          </p>
                          <Button as="label" htmlFor="qr-upload">
                            <input
                              id="qr-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleQrUpload}
                              className="hidden"
                            />
                            Select Image
                          </Button>
                        </div>
                      )}
                    </div>

                    {isScanning && (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p>Scanning QR code...</p>
                      </div>
                    )}

                    {scanError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{scanError}</AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Verification Result */}
            {verificationResult && (
              <Card
                className={`mb-8 ${
                  verificationResult.isRevoked
                    ? "border-red-500"
                    : verificationResult.isValid
                    ? "border-green-500"
                    : "border-yellow-500"
                }`}>
                <CardHeader
                  className={
                    verificationResult.isRevoked
                      ? "bg-red-50"
                      : verificationResult.isValid
                      ? "bg-green-50"
                      : "bg-yellow-50"
                  }>
                  <div className="flex items-center">
                    {verificationResult.isRevoked ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-red-500 mr-2"
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
                        <CardTitle className="text-red-600">
                          Certificate Revoked
                        </CardTitle>
                      </>
                    ) : verificationResult.isValid ? (
                      <>
                        <FileCheck className="h-6 w-6 text-green-500 mr-2" />
                        <CardTitle>Certificate Verified</CardTitle>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <CardTitle className="text-yellow-600">
                          Certificate Found
                        </CardTitle>
                      </>
                    )}
                  </div>
                  <CardDescription>
                    {verificationResult.isRevoked
                      ? "This certificate has been revoked by the issuer and is no longer valid"
                      : verificationResult.isValid
                      ? "This certificate has been verified as authentic"
                      : "Certificate file exists but verification status is uncertain"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Blockchain Status Banner */}
                  {verificationResult.blockchainVerified && (
                    <div
                      className={`mb-4 p-3 rounded-lg ${
                        verificationResult.isRevoked
                          ? "bg-red-100 border border-red-200"
                          : "bg-green-100 border border-green-200"
                      }`}>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 mr-2 ${
                            verificationResult.isRevoked
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.6-1.6L21 8l-5.6-3.6a1.1 1.1 0 00-1.2 0L9 8l5.6 4a1.1 1.1 0 001.2 0z"
                          />
                        </svg>
                        <span
                          className={`text-sm font-medium ${
                            verificationResult.isRevoked
                              ? "text-red-600"
                              : "text-green-600"
                          }`}>
                          {verificationResult.isRevoked
                            ? "🚫 Revoked on Blockchain"
                            : "🔗 Verified on Blockchain"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-gray-500 mb-1">
                        Certificate ID
                      </h3>
                      <p className="mb-4">
                        {verificationResult.certificate.id}
                      </p>

                      {verificationResult.certificate.tokenId && (
                        <>
                          <h3 className="font-semibold text-gray-500 mb-1">
                            Token ID
                          </h3>
                          <p className="mb-4">
                            {verificationResult.certificate.tokenId}
                          </p>
                        </>
                      )}

                      <h3 className="font-semibold text-gray-500 mb-1">
                        Issuer
                      </h3>
                      <p className="mb-4">
                        {verificationResult.certificate.issuer}
                      </p>

                      <h3 className="font-semibold text-gray-500 mb-1">
                        Issued To
                      </h3>
                      <p className="mb-4">
                        {verificationResult.certificate.issuedTo}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-500 mb-1">
                        Issue Date
                      </h3>
                      <p className="mb-4">
                        {verificationResult.certificate.issuedDate}
                      </p>

                      <h3 className="font-semibold text-gray-500 mb-1">
                        Certificate Type
                      </h3>
                      <p className="mb-4">
                        {verificationResult.certificate.course}
                      </p>

                      <h3 className="font-semibold text-gray-500 mb-1">
                        Status
                      </h3>
                      <p
                        className={`mb-4 font-medium ${
                          verificationResult.isRevoked
                            ? "text-red-600"
                            : verificationResult.isValid
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}>
                        {verificationResult.isRevoked
                          ? "🚫 REVOKED"
                          : verificationResult.isValid
                          ? "✅ VALID"
                          : "⚠️ UNVERIFIED"}
                      </p>

                      <h3 className="font-semibold text-gray-500 mb-1">
                        IPFS Hash
                      </h3>
                      <p className="text-sm font-mono break-all mb-4">
                        {verificationResult.hash}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button onClick={viewCertificateOnIPFS}>
                      View Original Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verification Error */}
            {verificationError && (
              <Card className="border-red-500">
                <CardHeader className="bg-red-50">
                  <CardTitle className="text-red-600">
                    Verification Failed
                  </CardTitle>
                  <CardDescription>
                    We couldn't verify this certificate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{verificationError}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            isVisible={notification.isVisible}
            onClose={hideNotification}
          />
        )}
      </div>
    </PublicRoute>
  );
};

export default VerifyPage;

import React from "react";
import { useRouter } from "next/router";
import { Button } from "./ui/button";
import { Search, QrCode } from "lucide-react";

const Verification = () => {
  const router = useRouter();

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Verify Any Certificate</h2>
          <p className="text-lg text-gray-600 mb-8">
            Instantly verify the authenticity of any certificate issued through
            our platform. No account required - verification is always public
            and accessible to everyone.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/verify")}
              className="flex items-center gap-2 px-6 py-6 text-lg font-medium"
              size="lg">
              <Search className="w-5 h-5" />
              Verify by Hash
            </Button>

            <Button
              onClick={() => router.push("/verify?method=qr")}
              variant="outline"
              className="flex items-center gap-2 px-6 py-6 text-lg font-medium"
              size="lg">
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Our verification system uses blockchain technology to ensure
            certificates cannot be tampered with or forged.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Verification;

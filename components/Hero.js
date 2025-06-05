import React from "react";
import { Button } from "./ui/button";
import ConnectButton from "./ConnectButton";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto text-center max-w-5xl">
        <h1 className="mb-8">
          <span className="block text-gray-800">Secure</span>
          <span className="text-primary-blue">Blockchain</span>
          <span className="block text-gray-800">Certificate Management</span>
        </h1>

        <p className="text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
          A decentralized platform that enables secure issuance, management, and
          verification of certificates using blockchain technology.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <ConnectButton size="lg" className="py-6 text-lg font-medium">
            Connect Wallet
          </ConnectButton>

          <Link href="/verify">
            <Button
              variant="outline"
              size="lg"
              className="py-6 text-lg font-medium">
              Verify Certificate
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;

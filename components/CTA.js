import React from "react";
import ConnectButton from "./ConnectButton";

const CTA = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="mb-6">Ready to Get Started?</h2>

        <p className="mb-10 text-gray-600 max-w-2xl mx-auto">
          Join our blockchain certificate management platform and revolutionize
          how you issue and verify credentials.
        </p>

        <ConnectButton
          className="inline-flex items-center py-6 text-lg font-medium"
          size="lg">
          Connect Wallet
        </ConnectButton>
      </div>
    </section>
  );
};

export default CTA;

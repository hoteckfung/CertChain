import React from "react";
import Link from "next/link";

const FooterColumn = ({ title, links }) => {
  return (
    <div>
      <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              className="text-gray-600 hover:text-primary-blue transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-gray-200">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <FooterColumn
            title="Platform"
            links={[
              { label: "Verify Certificate", href: "/verify" },
              { label: "Dashboard", href: "/dashboard" },
            ]}
          />

          <FooterColumn
            title="User Types"
            links={[
              { label: "System Admin", href: "/dashboard" },
              { label: "Certificate Issuer", href: "/dashboard" },
              { label: "Certificate Holder", href: "/dashboard" },
              { label: "Certificate Verifier", href: "/verify" },
            ]}
          />

          <FooterColumn
            title="Resources"
            links={[
              {
                label: "About Us",
                href: "https://github.com/hoteckfung/CertChain",
              },
              {
                label: "Contact Us",
                href: "mailto:hoteckfung@gmail.com",
              },
              { label: "Help Center", href: "#" },
              { label: "FAQ", href: "#" },
            ]}
          />

          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
              { label: "Security", href: "#" },
              { label: "Compliance", href: "#" },
            ]}
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4 md:mb-0">
            © {currentYear} CertChain. All rights reserved.
          </p>

          <div className="flex space-x-6">
            <a
              href="#"
              aria-label="Twitter"
              className="text-gray-500 hover:text-primary-blue">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/teck-fung-ho-4b8231246/"
              aria-label="LinkedIn"
              className="text-gray-500 hover:text-primary-blue">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a
              href="https://github.com/hoteckfung/CertChain"
              aria-label="GitHub"
              className="text-gray-500 hover:text-primary-blue">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

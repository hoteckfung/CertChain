import React from "react";

const RoleCard = ({ icon, title, features }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md transform transition-transform duration-300 hover:scale-105 hover:rotate-1 hover:shadow-xl hover:-translate-y-2">
      <div className="flex items-center mb-6">
        <div className="text-primary-blue mr-4">{icon}</div>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>

      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary-blue mr-2 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Roles = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-center mb-4">For Every Role</h2>
        <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Our platform provides specialized tools for each type of user
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <RoleCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="3" x2="21" y1="22" y2="22" />
                <line x1="6" x2="6" y1="18" y2="11" />
                <line x1="10" x2="10" y1="18" y2="11" />
                <line x1="14" x2="14" y1="18" y2="11" />
                <line x1="18" x2="18" y1="18" y2="11" />
                <polygon points="12 2 20 7 4 7" />
              </svg>
            }
            title="For Issuers"
            features={[
              "Individual certificate generation",
              "Bulk upload via Excel",
              "Certificate issuance interface",
            ]}
          />

          <RoleCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                <path d="M22 10v6" />
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
              </svg>
            }
            title="For Holders"
            features={[
              "Personal certificate dashboard",
              "Multiple download formats",
              "Certificate status tracking",
            ]}
          />

          <RoleCard
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            }
            title="For Admins"
            features={[
              "Issuer management",
              "System activity monitoring",
              "Platform configuration",
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default Roles;

import React from "react";

/**
 * Custom Button component with different variants
 * @param {Object} props - Button props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, outline, danger)
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @returns {React.ReactElement} Button component
 */
const Button = ({
  variant = "primary",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  // Define base classes
  const baseClasses =
    "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Define variant classes
  const variantClasses = {
    primary: "bg-primary-blue text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    outline:
      "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  // Define disabled classes
  const disabledClasses = "opacity-50 cursor-not-allowed";

  // Combine classes
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${disabled ? disabledClasses : ""}
    ${className}
  `.trim();

  return (
    <button className={buttonClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;

import React, { useRef, useState, useEffect } from "react";

/**
 * Simple signature pad component
 * @param {Object} props - Component props
 * @param {Function} props.onSignatureChange - Callback when signature changes
 * @param {string} [props.label='Signature'] - Label for the signature pad
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {React.ReactElement} SignaturePad component
 */
const SignaturePad = ({
  onSignatureChange,
  label = "Signature",
  className = "",
}) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize canvas context
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Set line style
      context.lineWidth = 2;
      context.lineCap = "round";
      context.strokeStyle = "#000000";

      setCtx(context);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && ctx) {
        const canvas = canvasRef.current;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Restore context settings
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";

        // Restore image data
        ctx.putImageData(imageData, 0, 0);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ctx]);

  // Handle mouse/touch events
  const startDrawing = (e) => {
    if (!ctx) return;

    setIsDrawing(true);

    const { offsetX, offsetY } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing || !ctx) return;

    const { offsetX, offsetY } = getCoordinates(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();

    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing || !ctx) return;

    setIsDrawing(false);
    ctx.closePath();

    // Get signature as data URL
    if (hasSignature && canvasRef.current) {
      const signatureData = canvasRef.current.toDataURL("image/png");
      onSignatureChange(signatureData);
    }
  };

  // Get coordinates from mouse or touch event
  const getCoordinates = (e) => {
    if (!canvasRef.current) {
      return { offsetX: 0, offsetY: 0 };
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX =
      e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY =
      e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
  };

  // Clear the signature
  const clearSignature = () => {
    if (!ctx || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
    onSignatureChange("");
  };

  return (
    <div className={`signature-pad ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={clearSignature}
          className="text-xs text-blue-600 hover:text-blue-800">
          Clear
        </button>
      </div>
      <div className="border border-gray-300 rounded-md bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-24 touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {hasSignature ? "Signature captured" : "Sign above"}
      </p>
    </div>
  );
};

export default SignaturePad;

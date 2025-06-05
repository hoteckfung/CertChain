import React, { useState, useEffect, useRef } from "react";

/**
 * Draggable element component for positioning elements on a certificate
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the element
 * @param {Object} props.position - Initial position {x, y}
 * @param {Function} props.onPositionChange - Callback when position changes
 * @param {boolean} props.isEditMode - Whether edit mode is active
 * @param {React.RefObject} props.containerRef - Reference to container element
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.ReactNode} props.children - Element content
 * @returns {React.ReactElement} DraggableElement component
 */
const DraggableElement = ({
  id,
  position,
  onPositionChange,
  isEditMode,
  containerRef,
  className = "",
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);

  // Set initial position
  useEffect(() => {
    if (elementRef.current && position) {
      elementRef.current.style.left = `${position.x}px`;
      elementRef.current.style.top = `${position.y}px`;
    }
  }, [position]);

  // Handle mouse down event
  const handleMouseDown = (e) => {
    if (!isEditMode) return;

    e.preventDefault();
    setIsDragging(true);

    // Calculate offset from element position to mouse position
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle touch start event
  const handleTouchStart = (e) => {
    if (!isEditMode) return;

    e.preventDefault();
    setIsDragging(true);

    // Calculate offset from element position to touch position
    const touch = e.touches[0];
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  // Handle mouse move event
  const handleMouseMove = (e) => {
    if (!isDragging || !isEditMode || !containerRef.current) return;

    e.preventDefault();

    // Calculate new position
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragOffset.x;
    const y = e.clientY - containerRect.top - dragOffset.y;

    // Update position
    onPositionChange(id, { x, y });
  };

  // Handle touch move event
  const handleTouchMove = (e) => {
    if (!isDragging || !isEditMode || !containerRef.current) return;

    e.preventDefault();

    // Calculate new position
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - containerRect.left - dragOffset.x;
    const y = touch.clientY - containerRect.top - dragOffset.y;

    // Update position
    onPositionChange(id, { x, y });
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
  };

  // Add global event listeners
  useEffect(() => {
    if (isEditMode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isEditMode, isDragging]);

  return (
    <div
      ref={elementRef}
      className={`absolute ${isEditMode ? "cursor-move" : ""} ${
        isDragging ? "opacity-75" : ""
      } ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: "none",
        border: isEditMode ? "1px dashed #3b82f6" : "none",
        padding: isEditMode ? "4px" : "0",
        backgroundColor: isEditMode
          ? "rgba(219, 234, 254, 0.3)"
          : "transparent",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}>
      {children}
    </div>
  );
};

export default DraggableElement;

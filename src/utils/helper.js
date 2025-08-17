import {
  HIGHLIGHT_COLOR_NAMES,
  HIGHLIGHT_COLORS,
} from '../constants/appConstants';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');
  return `${paddedMins}:${paddedSecs}`;
};

function getHighlightColorName(hex) {
  if (!hex) return 'Unknown';

  // Normalize hex: lowercase and ensure starting with #
  const normalizedHex = hex.startsWith('#')
    ? hex.toLowerCase()
    : '#' + hex.toLowerCase();

  return HIGHLIGHT_COLOR_NAMES[normalizedHex] || 'Unknown';
}

/**
 * Extract RGB values from rgba/rgb color string
 * @param {string} color - Color in rgba/rgb format
 * @returns {object} RGB values
 */
export const extractRGBFromColor = (color) => {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      rgb: `rgb(${match[1]}, ${match[2]}, ${match[3]})`,
    };
  }
  return { r: 255, g: 255, b: 0, rgb: 'rgb(255, 255, 0)' }; // Default to yellow
};

/**
 * Check if point is inside rectangle
 * @param {number} x - Point x coordinate
 * @param {number} y - Point y coordinate
 * @param {object} rect - Rectangle with x, y, width, height
 * @returns {boolean} True if point is inside rectangle
 */
export const isPointInRect = (x, y, rect) => {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
};

/**
 * Get canvas coordinates from mouse event
 * @param {MouseEvent} event - Mouse event
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {object} Canvas coordinates {x, y}
 */
export const getCanvasCoordinates = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Generate unique ID for highlights/annotations
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export { formatTime, getHighlightColorName };

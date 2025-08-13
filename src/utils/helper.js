import { HIGHLIGHT_COLOR_NAMES } from '../constants/appConstants';

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

export { formatTime, getHighlightColorName };

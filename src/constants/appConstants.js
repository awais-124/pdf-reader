/**
 * appConstants.js
 * Keep all literals in one place.
 */

export const HIGHLIGHT_COLORS = {
  yellow: '#ffeb3b', // Bright Yellow
  green: '#4caf50', // Medium Green
  blue: '#2196f3', // Medium Blue
  pink: '#e91e63', // Pink/Magenta
  orange: '#ff9800', // Bright Orange
  purple: '#9c27b0', // Vibrant Purple
  cyan: '#00bcd4', // Light Cyan
};

export const HIGHLIGHT_COLOR_NAMES = {
  '#ffeb3b': 'Bright Yellow',
  '#4caf50': 'Medium Green',
  '#2196f3': 'Medium Blue',
  '#e91e63': 'Pink/Magenta',
  '#ff9800': 'Bright Orange',
  '#9c27b0': 'Vibrant Purple',
  '#00bcd4': 'Light Cyan',
};

export const BRUSH_SIZES = [1, 2, 4, 8];

export const TIMER_INTERVAL_MS = 250;
export const TTS_DEFAULT_RATE = 1.0;

export const DEFAULT_PDF_SCALE = 1.2;

export const DB_CONFIG = {
  name: 'pdf_highlighter_db',
  version: 1,
  storeName: 'documents',
};

export const HIGHLIGHT_MODES = {
  ON: 'ON',
  OFF: 'OFF',
  NULL: 'NONE',
};

export const ANNOTATIONS_POSITION = {
  INITIAL_X: 50,
  INITIAL_Y: 50,
  GAP: 30,
};

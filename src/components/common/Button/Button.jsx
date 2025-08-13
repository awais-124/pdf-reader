/**
 * Button.jsx
 * A reusable, self-closing button component.
 * Props:
 * - label (string) → Button text
 * - onClick (function) → Click handler
 * - className (string) → Extra CSS classes (applied at highest priority)
 * - style (object) → Inline styles
 * - disabled (boolean) → Disabled state
 * - type (string) → Button type ('button', 'submit', etc.)
 */
import React from 'react';
import styles from './Button.module.css';
import { HIGHLIGHT_MODES } from '../../../constants/appConstants';

export default function Button({
  label,
  onClick,
  className = '',
  style = {},
  disabled = false,
  type = 'button',
  highlightMode = HIGHLIGHT_MODES.NULL,
}) {
  const combinedClassName = `${styles.btn} ${className}`.trim();

  const highlightButtonColor =
    highlightMode !== HIGHLIGHT_MODES.NULL &&
    highlightMode == HIGHLIGHT_MODES.ON
      ? '#1e5eff'
      : '#e7e7e7ff';

  const btnTextColor =
    highlightMode !== HIGHLIGHT_MODES.NULL &&
    highlightMode == HIGHLIGHT_MODES.ON
      ? '#fff'
      : '#000';

  const updateStyles =
    highlightMode !== HIGHLIGHT_MODES.NULL
      ? { ...style, background: highlightButtonColor, color: btnTextColor }
      : { style };

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      style={updateStyles}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

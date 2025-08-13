/**
 * Actions.jsx
 * Toolbar for page navigation, TTS controls, highlight settings, and annotations.
 * Uses reusable Button component for consistent styling.
 */

import { useContext } from 'react';
import styles from './Actions.module.css';

import { AppContext } from '../../context/AppContext';

import Button from '../common/Button/Button';

import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_MODES,
} from '../../constants/appConstants';
import { formatTime, getHighlightColorName } from '../../utils/helper';
import { useState } from 'react';

export default function Actions() {
  const [highlightMode, setHiglightMode] = useState(HIGHLIGHT_MODES.OFF);

  const {
    currentHighlightColor,
    setCurrentHighlightColor,
    currentPage,
    totalPages,
    prevPage,
    nextPage,
    ttsActive,
    ttsPaused,
    startTTS,
    pauseTTS,
    resumeTTS,
    stopTTS,
    ttsTimer,
    currentPageText,
  } = useContext(AppContext);

  const handlePlayStop = () => {
    if (ttsActive) {
      stopTTS();
    } else {
      if (currentPageText.trim()) {
        startTTS(currentPageText);
      }
    }
  };

  const handlePauseResume = () => {
    if (!ttsActive) return;
    if (ttsPaused) {
      resumeTTS();
    } else {
      pauseTTS();
    }
  };

  // === Handlers (stubs for non-nav) ===
  const toggleHighlightMode = () =>
    setHiglightMode((prev) =>
      prev === HIGHLIGHT_MODES.ON ? HIGHLIGHT_MODES.OFF : HIGHLIGHT_MODES.ON
    );
  const clearHighlights = () => {};
  const clearAnnotations = () => {};
  const addAnnotation = () => {};

  return (
    <div className={styles.actions}>
      <div className={styles.pageNav}>
        <Button label="Previous" onClick={prevPage} />
        <span>
          Page: {currentPage} of {totalPages}
        </span>
        <Button label="Next" onClick={nextPage} />
      </div>

      <div className={styles.ttsControls}>
        <Button
          label={ttsActive ? 'Stop' : 'Play'}
          onClick={handlePlayStop}
          className={ttsActive ? styles.btnRed : styles.btnBlue}
        />
        <Button
          label={ttsPaused ? 'Resume' : 'Pause'}
          onClick={handlePauseResume}
          className={styles.btnOrange}
          disabled={!ttsActive}
        />
      </div>

      {/* Timer display */}
      {ttsActive && (
        <div className={styles.ttsTimer}>{formatTime(ttsTimer)}</div>
      )}

      <div className={styles.highlightControls}>
        <Button
          label={`Highlight Mode: ${highlightMode}`}
          onClick={toggleHighlightMode}
          className={styles.highlightMode}
          highlightMode={highlightMode}
        />
        <div className={styles.highlightColors}>
          {Object.values(HIGHLIGHT_COLORS).map((color) => (
            <span
              key={color}
              className={`${styles.colorDot} ${
                currentHighlightColor === color ? styles.activeColor : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentHighlightColor(color)}
              title={getHighlightColorName(color)}
            />
          ))}
        </div>
        <Button
          label="Clear Highlights"
          onClick={clearHighlights}
          className={styles.btnClearHighlights}
        />
      </div>

      <div className={styles.annotationControls}>
        <textarea placeholder="Add text annotation..."></textarea>
        <Button
          label="Clear Annotations"
          onClick={clearAnnotations}
          className={styles.btnRed}
        />
        <Button
          label="Add Text Annotation"
          onClick={addAnnotation}
          className={styles.btnPurple}
        />
      </div>
    </div>
  );
}

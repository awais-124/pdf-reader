/**
 * Actions.jsx
 * Updated with highlight functionality integration
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
  const [highlightMode, setHighlightMode] = useState(HIGHLIGHT_MODES.OFF);

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
    currentAnnotationText,
    setCurrentAnnotationText,
    addAnnotation,
    clearAnnotations,
    clearHighlights,
    clearAllHighlights,
    pdfDoc,
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

  // === Highlight Handlers ===
  const toggleHighlightMode = () => {
    const newMode =
      highlightMode === HIGHLIGHT_MODES.ON
        ? HIGHLIGHT_MODES.OFF
        : HIGHLIGHT_MODES.ON;

    setHighlightMode(newMode);

    // Update global highlight mode state (if using window object method)
    if (window.toggleHighlightMode) {
      window.toggleHighlightMode();
    }
  };

  const handleClearCurrentPageHighlights = () => {
    if (window.confirm('Clear all highlights on this page?')) {
      clearHighlights();
    }
  };

  const handleClearAllHighlights = () => {
    if (window.confirm('Clear ALL highlights in the document?')) {
      clearAllHighlights();
    }
  };

  const handleAddAnnotation = () => {
    if (currentAnnotationText.trim()) {
      addAnnotation(currentAnnotationText);
      setCurrentAnnotationText('');
    }
  };

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

      <div className={styles.annotationControls}>
        <textarea
          placeholder="Add text annotation..."
          value={currentAnnotationText}
          onChange={(e) => setCurrentAnnotationText(e.target.value)}
          className={styles.annotationArea}
        />
        <Button
          label="Add Text Annotation"
          onClick={handleAddAnnotation}
          className={styles.addAnnotation}
          disabled={!currentAnnotationText.trim()}
        />
        <Button
          label="Clear Annotations"
          onClick={clearAnnotations}
          className={styles.clearAnnotation}
        />
      </div>

      <div className={styles.highlightControls}>
        <Button
          label={`Highlight Mode: ${highlightMode}`}
          onClick={toggleHighlightMode}
          className={`${styles.highlightMode} ${
            highlightMode === HIGHLIGHT_MODES.ON
              ? styles.highlightModeActive
              : ''
          }`}
          highlightMode={highlightMode}
          disabled={!pdfDoc}
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

        <div className={styles.highlightActions}>
          <Button
            label="Clear Page Highlights"
            onClick={handleClearCurrentPageHighlights}
            className={styles.btnClearHighlights}
            title="Clear highlights on current page only"
          />
          <Button
            label="Clear All Highlights"
            onClick={handleClearAllHighlights}
            className={styles.btnClearHighlights}
            title="Clear all highlights in the document"
          />
        </div>
      </div>
    </div>
  );
}

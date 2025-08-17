import React, { useContext, useEffect, useRef, useState } from 'react';
import styles from './PDF.module.css';
import { AppContext } from '../../context/AppContext';
import AnnotationLayer from './AnnotationLayer/AnnotationLayer';
import HighlightLayer from './HighlightLayer/HighlightLayer';
import { HIGHLIGHT_MODES } from '../../constants/appConstants';

export default function PDF() {
  const { pdfDoc, currentPage, totalPages, scale } = useContext(AppContext);

  const [highlightMode, setHighlightMode] = useState(HIGHLIGHT_MODES.OFF);

  const canvasRef = useRef(null);
  const highlightLayerRef = useRef(null);

  const toggleHighlightMode = () => {
    setHighlightMode((prev) =>
      prev === HIGHLIGHT_MODES.ON ? HIGHLIGHT_MODES.OFF : HIGHLIGHT_MODES.ON
    );
  };

  useEffect(() => {
    window.toggleHighlightMode = toggleHighlightMode;

    return () => {
      delete window.toggleHighlightMode;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      // --- Render PDF to Canvas ---
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Apply scaling transform for high-DPI displays
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      console.log(
        'outputScale',
        outputScale,
        'viewport',
        viewport.width,
        viewport.height
      );

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      if (cancelled) return;

      // --- Adjust overlay sizes ---
      if (highlightLayerRef.current) {
        highlightLayerRef.current.style.width = canvas.style.width;
        highlightLayerRef.current.style.height = canvas.style.height;
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, scale]);

  return (
    <div className={styles.pdfContainer}>
      <div className={styles.pageInfo}>
        <span>
          {pdfDoc
            ? `Page ${currentPage} of ${totalPages}`
            : 'Upload/Select document to view'}
        </span>
      </div>

      <div className={styles.pdfWrapper} style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className={styles.pdfCanvas} />
        <div ref={highlightLayerRef} className={styles.highlightLayer}>
          <HighlightLayer
            highlightMode={highlightMode}
            pdfCanvasRef={canvasRef}
          />
        </div>
        <AnnotationLayer />
      </div>
    </div>
  );
}

/**
 * PDF.jsx
 * Displays the current PDF page using pdf.js.
 * - Renders on (pdfDoc | currentPage | scale) changes.
 * - Keeps highlight/annotation layers ready for future logic.
 */

import React, { useContext, useEffect, useRef } from 'react';
import styles from './PDF.module.css';
import { AppContext } from '../../context/AppContext';

export default function PDF() {
  const { pdfDoc, currentPage, totalPages, scale } = useContext(AppContext);
  const canvasRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const annotationLayerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(currentPage);

      const viewport = page.getViewport({ scale }); // logical scale
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const outputScale = window.devicePixelRatio || 1;

      // Increase pixel density for sharper rendering
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      await page.render({
        canvasContext: ctx,
        viewport,
        transform,
      }).promise;

      if (!cancelled) {
        if (highlightLayerRef.current) {
          highlightLayerRef.current.style.width = canvas.style.width;
          highlightLayerRef.current.style.height = canvas.style.height;
        }
        if (annotationLayerRef.current) {
          annotationLayerRef.current.style.width = canvas.style.width;
          annotationLayerRef.current.style.height = canvas.style.height;
        }
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
          {pdfDoc ? `Page ${currentPage} of ${totalPages}` : 'No document open'}
        </span>
      </div>

      <div className={styles.pdfWrapper}>
        <canvas ref={canvasRef} className={styles.pdfCanvas} />
        <div ref={highlightLayerRef} className={styles.highlightLayer} />
        <div ref={annotationLayerRef} className={styles.annotationLayer} />
      </div>
    </div>
  );
}

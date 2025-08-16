import React, { useContext, useEffect, useRef } from 'react';
import styles from './PDF.module.css';
import { AppContext } from '../../context/AppContext';
import AnnotationLayer from './AnnotationLayer/AnnotationLayer';

import { Util } from 'pdfjs-dist';

export default function PDF() {
  const {
    pdfDoc,
    currentPage,
    totalPages,
    scale,
    setTtsStartIndex,
    ttsStartIndex,
  } = useContext(AppContext);

  const canvasRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const textLayerRef = useRef(null);

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

      console.log(
        'outputScale',
        outputScale,
        'viewport',
        viewport.width,
        viewport.height
      );

      // const transform =
      //   outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      await page.render({
        canvasContext: ctx,
        viewport,
        // transform,
      }).promise;

      if (cancelled) return;

      // --- Adjust overlay sizes ---
      if (highlightLayerRef.current) {
        highlightLayerRef.current.style.width = canvas.style.width;
        highlightLayerRef.current.style.height = canvas.style.height;
      }
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        textLayerRef.current.style.width = `${viewport.width}px`;
        textLayerRef.current.style.height = `${viewport.height}px`;
      }

      // --- Extract text and create positioned spans ---
      const textContent = await page.getTextContent();
      let charIndex = 0;

      textContent.items.forEach((textItem) => {
        const str = textItem.str;
        if (!str) return;

        // Apply viewport transform to item transform
        const tx = Util.transform(viewport.transform, textItem.transform);
        const [a, b, c, d, e, f] = tx;

        const fontSize = Math.sqrt(a * a + b * b);
        const charWidth = textItem.width / str.length;

        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          const span = document.createElement('span');
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          span.onclick = () => {
            span.style.border = '2px solid yellow';
            span.style.borderRadius = '5px';
          };
          span.style.position = 'absolute';
          span.style.left = `${e + charWidth * i}px`;
          span.style.top = `${f - fontSize}px`;
          span.style.fontSize = `${fontSize}px`;
          span.style.fontFamily =
            textContent.styles[textItem.fontName]?.fontFamily || 'monospace';

          span.style.transform = `scaleX(${a / fontSize})`;
          span.style.transformOrigin = 'left bottom';

          span.style.lineHeight = '1';
          span.style.whiteSpace = 'pre';
          span.style.pointerEvents = 'auto';
          span.style.cursor = 'pointer';
          span.style.color = 'transparent';

          // console.log(
          //   'SPAN WALA HAI YE',
          //   textItem.fontName,
          //   textContent.styles[textItem.fontName]
          // );

          // 🔴 DEBUG COLORS enable these to debug
          span.style.color = 'black'; // show actual text
          span.style.backgroundColor = 'rgba(255,0,0,0.2)'; // semi-transparent red box

          if (charIndex === ttsStartIndex) {
            span.style.backgroundColor = 'yellow';
          }

          span.addEventListener('click', (e) => {
            e.stopPropagation();
            setTtsStartIndex(charIndex);
          });

          textLayerRef.current.appendChild(span);
          charIndex++;
        }
      });
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, scale, ttsStartIndex, setTtsStartIndex]);

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
        <div ref={highlightLayerRef} className={styles.highlightLayer} />
        <div
          ref={textLayerRef}
          data-debug="textlayer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            // pointerEvents: 'none',
          }}
        />
        <AnnotationLayer />
      </div>
    </div>
  );
}

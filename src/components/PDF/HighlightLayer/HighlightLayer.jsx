/**
 * HighlightLayer.jsx
 * Optimized implementation with instant highlighting and minimal re-renders
 */

import React, {
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from 'react';
import { AppContext } from '../../../context/AppContext';
import { DbContext } from '../../../context/DbContext';

import { TEXT_EXTRACTION_CONFIG } from '../../../constants/appConstants';

import styles from './HighlightLayer.module.css';

const HighlightLayer = React.memo(({ highlightMode, pdfCanvasRef }) => {
  const {
    pdfDoc,
    currentPage,
    scale,
    highlights,
    addHighlight,
    removeHighlight,
    currentHighlightColor,
    currentDocumentId,
  } = useContext(AppContext);

  const { saveHighlights } = useContext(DbContext);

  const highlightCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textRects, setTextRects] = useState([]);
  const [currentLineHeight, setCurrentLineHeight] = useState(
    TEXT_EXTRACTION_CONFIG.MIN_LINE_HEIGHT
  );
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [customCursor, setCustomCursor] = useState('auto');
  const [previewHighlight, setPreviewHighlight] = useState(null);

  // Memoize filtered highlights for current page
  const pageHighlights = useMemo(
    () => highlights.filter((h) => h.page === currentPage),
    [highlights, currentPage]
  );

  // Extract text rectangles from PDF page for text alignment
  const extractTextRects = useCallback(
    async (page) => {
      if (!page) return [];

      try {
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale });
        const rects = [];

        textContent.items.forEach((item) => {
          if (item.transform) {
            // Transform text coordinates to canvas coordinates
            const transform = viewport.transform.slice();
            const textTransform = item.transform;

            // Apply transformations
            const x =
              textTransform[4] * transform[0] +
              textTransform[5] * transform[2] +
              transform[4];
            const y =
              textTransform[4] * transform[1] +
              textTransform[5] * transform[3] +
              transform[5];

            rects.push({
              x: x,
              y: viewport.height - y, // Convert to canvas coordinate system
              width: item.width * scale,
              height: item.height * scale,
              text: item.str,
            });
          }
        });

        return rects;
      } catch (error) {
        console.error('Error extracting text rects:', error);
        return [];
      }
    },
    [scale]
  );

  // Memoize cursor creation
  const createHighlightCursor = useCallback((color, height) => {
    const size = Math.max(16, height);
    const radius = size / 2;

    // Extract RGB from color string
    const colorMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const rgbColor = colorMatch
      ? `rgb(${colorMatch[1]},${colorMatch[2]},${colorMatch[3]})`
      : '#ffff00';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${rgbColor}" opacity="0.6"/>
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="none" stroke="#000" stroke-width="1" opacity="0.8"/>
    </svg>`;

    return `url('data:image/svg+xml;utf8,${encodeURIComponent(
      svg
    )}') ${radius} ${radius - 2}, auto`;
  }, []);

  // Memoized cursor based on highlight mode and current settings
  const cursor = useMemo(() => {
    if (highlightMode === 'ON') {
      return createHighlightCursor(currentHighlightColor, currentLineHeight);
    }
    return 'auto';
  }, [
    highlightMode,
    currentHighlightColor,
    currentLineHeight,
    createHighlightCursor,
  ]);

  // Update custom cursor when cursor changes
  useEffect(() => {
    setCustomCursor(cursor);
  }, [cursor]);

  // Extract text rects when page changes
  useEffect(() => {
    const updateTextRects = async () => {
      if (!pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const rects = await extractTextRects(page);
        setTextRects(rects);

        // Set initial line height with bounds checking
        if (rects.length > 0) {
          const initialHeight = Math.min(
            Math.max(rects[0].height, TEXT_EXTRACTION_CONFIG.MIN_LINE_HEIGHT),
            TEXT_EXTRACTION_CONFIG.MAX_LINE_HEIGHT
          );
          setCurrentLineHeight(initialHeight);
        }
      } catch (error) {
        console.error('Error updating text rects:', error);
      }
    };

    updateTextRects();
  }, [pdfDoc, currentPage, extractTextRects]);

  // Optimized render highlights function
  const renderHighlights = useCallback(() => {
    const canvas = highlightCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render saved highlights
    pageHighlights.forEach((highlight) => {
      ctx.fillStyle = highlight.color;
      ctx.fillRect(highlight.x, highlight.y, highlight.width, highlight.height);
    });

    // Render preview highlight while drawing
    if (previewHighlight) {
      ctx.fillStyle = previewHighlight.color;
      ctx.fillRect(
        previewHighlight.x,
        previewHighlight.y,
        previewHighlight.width,
        previewHighlight.height
      );
    }
  }, [pageHighlights, previewHighlight]);

  // Sync canvas dimensions with main PDF canvas
  useEffect(() => {
    if (!pdfCanvasRef?.current || !highlightCanvasRef.current) return;

    const pdfCanvas = pdfCanvasRef.current;
    const highlightCanvas = highlightCanvasRef.current;

    // Only update if dimensions actually changed
    const needsUpdate =
      highlightCanvas.width !== pdfCanvas.width ||
      highlightCanvas.height !== pdfCanvas.height;

    if (needsUpdate) {
      // Match dimensions
      highlightCanvas.width = pdfCanvas.width;
      highlightCanvas.height = pdfCanvas.height;
      highlightCanvas.style.width = pdfCanvas.style.width;
      highlightCanvas.style.height = pdfCanvas.style.height;
    }

    // Always render highlights after sync or when highlights change
    renderHighlights();
  }, [pdfDoc, currentPage, scale, renderHighlights, pdfCanvasRef]);

  // Re-render highlights when they change
  useEffect(() => {
    renderHighlights();
  }, [renderHighlights]);

  // Optimized mouse event handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (highlightMode !== 'ON') return;

      const canvas = highlightCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find text line at click position and snap to it
      const clickedLine = textRects.find(
        (textRect) => y >= textRect.y && y <= textRect.y + textRect.height
      );

      const snapY = clickedLine ? clickedLine.y : y;
      const lineHeight = clickedLine ? clickedLine.height : currentLineHeight;

      setStartPos({ x, y: snapY });
      setCurrentLineHeight(lineHeight);
      setIsDrawing(true);
    },
    [highlightMode, textRects, currentLineHeight]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (highlightMode !== 'ON') return;

      const canvas = highlightCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDrawing) {
        // Create preview highlight for instant feedback
        const preview = {
          x: Math.min(startPos.x, x),
          y: startPos.y,
          width: Math.abs(x - startPos.x),
          height: currentLineHeight,
          color: currentHighlightColor,
        };
        setPreviewHighlight(preview);
      } else {
        // Update cursor size based on hovered text
        const hoveredLine = textRects.find(
          (textRect) => y >= textRect.y && y <= textRect.y + textRect.height
        );

        if (hoveredLine && hoveredLine.height !== currentLineHeight) {
          setCurrentLineHeight(hoveredLine.height);
        }
      }
    },
    [
      highlightMode,
      isDrawing,
      startPos,
      currentHighlightColor,
      currentLineHeight,
      textRects,
    ]
  );

  const handleMouseUp = useCallback(
    async (e) => {
      if (highlightMode !== 'ON' || !isDrawing) return;

      const canvas = highlightCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const endX = e.clientX - rect.left;

      // Create highlight object
      const newHighlight = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        x: Math.min(startPos.x, endX),
        y: startPos.y,
        width: Math.abs(endX - startPos.x),
        height: currentLineHeight,
        color: currentHighlightColor,
        page: currentPage,
        createdAt: new Date().toISOString(),
      };

      // Add highlight to context - this will trigger re-render
      addHighlight(newHighlight);

      // Clear preview highlight
      setPreviewHighlight(null);
      setIsDrawing(false);

      // Save to database asynchronously (don't block UI)
      if (currentDocumentId) {
        // Use the updated highlights array (current highlights + new highlight)
        const updatedHighlights = [...highlights, newHighlight];
        saveHighlights(currentDocumentId, updatedHighlights).catch((error) => {
          console.error('Error saving highlights:', error);
        });
      }
    },
    [
      highlightMode,
      isDrawing,
      startPos,
      currentLineHeight,
      currentHighlightColor,
      currentPage,
      addHighlight,
      highlights,
      currentDocumentId,
      saveHighlights,
    ]
  );

  // Handle right-click to remove highlights
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();

      if (highlightMode !== 'ON') return;

      const canvas = highlightCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find highlight at click position
      const clickedHighlight = pageHighlights.find(
        (highlight) =>
          x >= highlight.x &&
          x <= highlight.x + highlight.width &&
          y >= highlight.y &&
          y <= highlight.y + highlight.height
      );

      if (clickedHighlight && removeHighlight) {
        removeHighlight(clickedHighlight.id);

        // Save updated highlights to database
        if (currentDocumentId) {
          const updatedHighlights = highlights.filter(
            (h) => h.id !== clickedHighlight.id
          );
          saveHighlights(currentDocumentId, updatedHighlights).catch(
            (error) => {
              console.error('Error saving highlights after removal:', error);
            }
          );
        }
      }
    },
    [
      highlightMode,
      pageHighlights,
      removeHighlight,
      currentDocumentId,
      highlights,
      saveHighlights,
    ]
  );

  // Prevent text selection when highlighting
  const handleSelectStart = useCallback(
    (e) => {
      if (highlightMode === 'ON') {
        e.preventDefault();
      }
    },
    [highlightMode]
  );

  if (!pdfDoc) return null;

  return (
    <canvas
      ref={highlightCanvasRef}
      className={styles.highlightCanvas}
      style={{
        cursor: customCursor,
        mixBlendMode: 'multiply',
        pointerEvents: highlightMode === 'ON' ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onSelectStart={handleSelectStart}
    />
  );
});

HighlightLayer.displayName = 'HighlightLayer';

export default HighlightLayer;

/**
 * AppContext.jsx
 * --------------------------------
 * UI/application state + PDF viewing logic.
 * - Holds PDF.js document instance, page, total pages, scale.
 * - Provides navigation: prev/next/goTo, and loader from Blob.
 * - Keeps TTS/highlights/annotations placeholders as before.
 */

import React, {
  createContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';

import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

import {
  HIGHLIGHT_COLORS,
  BRUSH_SIZES,
  TIMER_INTERVAL_MS,
  DB_CONFIG,
  TTS_DEFAULT_RATE,
  DEFAULT_PDF_SCALE,
} from '../constants/appConstants.js';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const timerRef = useRef(null);

  // --- PDF State ---
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPageText, setCurrentPageText] = useState('');
  const [scale, setScale] = useState(DEFAULT_PDF_SCALE);

  // --- Document selection ---
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [currentDocumentName, setCurrentDocumentName] = useState(null);

  // --- Highlights / Annotations (placeholders) ---
  const [highlights, setHighlights] = useState([]);
  const [currentHighlightColor, setCurrentHighlightColor] = useState(
    HIGHLIGHT_COLORS.yellow
  );
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[0]);
  const [annotations, setAnnotations] = useState([]);

  // --- TTS (placeholders) ---
  const [ttsActive, setTtsActive] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [ttsTimer, setTtsTimer] = useState(0);
  const [ttsUtterance, setTtsUtterance] = useState(null);
  const [ttsRate, setTtsRate] = useState(TTS_DEFAULT_RATE);

  // --- PDF loaders / navigation ---
  const extractTextFromPage = useCallback(async (doc, pageNum) => {
    if (!doc) return '';
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map((item) => item.str).join(' ');
  }, []);

  const loadPdfFromBlob = useCallback(
    async (blob, name, docId) => {
      if (!blob) return;
      const data = await blob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data });
      const doc = await loadingTask.promise;

      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);

      if (name) setCurrentDocumentName(name);
      if (docId) setCurrentDocumentId(docId);

      // Extract first page's text right away
      const firstPageText = await extractTextFromPage(doc, 1);
      setCurrentPageText(firstPageText);
    },
    [extractTextFromPage]
  );

  const goToPage = useCallback(
    (pageNum) => {
      if (!pdfDoc) return;
      const clamped = Math.max(1, Math.min(pageNum, pdfDoc.numPages));
      setCurrentPage(clamped);
    },
    [pdfDoc]
  );

  const nextPage = useCallback(() => {
    if (!pdfDoc) return;
    setCurrentPage((p) => Math.min(p + 1, pdfDoc.numPages));
  }, [pdfDoc]);

  const prevPage = useCallback(() => {
    if (!pdfDoc) return;
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, [pdfDoc]);

  // --- Highlight Functions (stubs kept) ---
  const addHighlight = useCallback(
    (h) => setHighlights((prev) => [...prev, h]),
    []
  );
  const removeHighlight = useCallback(
    (id) => setHighlights((prev) => prev.filter((x) => x.id !== id)),
    []
  );
  const clearHighlights = useCallback(() => setHighlights([]), []);

  // --- Annotation Functions (stubs kept) ---
  const addAnnotation = useCallback(
    (a) => setAnnotations((prev) => [...prev, a]),
    []
  );
  const removeAnnotation = useCallback(
    (id) => setAnnotations((prev) => prev.filter((x) => x.id !== id)),
    []
  );
  const clearAnnotations = useCallback(() => setAnnotations([]), []);

  const startTTS = useCallback(
    (text) => {
      if (!text) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = ttsRate;
      setTtsUtterance(utter);
      setTtsActive(true);
      setTtsPaused(false);
      setTtsTimer(0);

      // start timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTtsTimer((prev) => prev + 1);
      }, 1000);

      window.speechSynthesis.speak(utter);
    },
    [ttsRate]
  );

  // Pause
  const pauseTTS = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setTtsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current); // pause timer
    }
  }, []);

  // Resume
  const resumeTTS = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setTtsPaused(false);
      timerRef.current = setInterval(() => {
        setTtsTimer((prev) => prev + 1);
      }, 1000); // resume timer
    }
  }, []);

  // Stop completely
  const stopTTS = useCallback(() => {
    window.speechSynthesis.cancel();
    setTtsActive(false);
    setTtsPaused(false);
    setTtsUtterance(null);
    setTtsTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* SIDE EFFECTS = WATCH FOR PAGE CHANGES */

  useEffect(() => {
    (async () => {
      if (pdfDoc) {
        const text = await extractTextFromPage(pdfDoc, currentPage);
        setCurrentPageText(text);
      }
    })();
  }, [pdfDoc, currentPage, extractTextFromPage]);

  return (
    <AppContext.Provider
      value={{
        // PDF
        pdfDoc,
        currentPage,
        totalPages,
        scale,
        setScale,
        loadPdfFromBlob,
        goToPage,
        nextPage,
        prevPage,
        currentPageText,

        // Selected doc
        currentDocumentId,
        setCurrentDocumentId,
        currentDocumentName,
        setCurrentDocumentName,

        // Highlights
        highlights,
        addHighlight,
        removeHighlight,
        clearHighlights,
        currentHighlightColor,
        setCurrentHighlightColor,
        brushSize,
        setBrushSize,

        // Annotations
        annotations,
        addAnnotation,
        removeAnnotation,
        clearAnnotations,

        // TTS
        ttsActive,
        ttsPaused,
        ttsTimer,
        setTtsTimer,
        ttsRate,
        setTtsRate,
        startTTS,
        pauseTTS,
        resumeTTS,
        stopTTS,

        // Constants
        HIGHLIGHT_COLORS,
        BRUSH_SIZES,
        TIMER_INTERVAL_MS,
        DB_CONFIG,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

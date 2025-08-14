/**
 * AppContext.jsx
 * --------------------------------
 * UI/application state + PDF viewing logic.
 * - Holds PDF.js document instance, page, total pages, scale.
 * - Provides navigation: prev/next/goTo, and loader from Blob.
 * - Keeps TTS/highlights/annotations placeholders as before.
 */

import {
  createContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
} from 'react';

import { DbContext } from './DbContext.jsx';

import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker?worker';

import { v4 as uuidv4 } from 'uuid';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

import {
  HIGHLIGHT_COLORS,
  BRUSH_SIZES,
  TIMER_INTERVAL_MS,
  DB_CONFIG,
  TTS_DEFAULT_RATE,
  DEFAULT_PDF_SCALE,
  ANNOTATIONS_POSITION,
} from '../constants/appConstants.js';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { saveAnnotations, dbReady, getDocumentById } = useContext(DbContext);

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
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotationText, setCurrentAnnotationText] = useState('');

  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[0]);

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
      if (!blob) {
        // Clear everything when no document is loaded
        setPdfDoc(null);
        setCurrentDocumentId(null);
        setCurrentDocumentName(null);
        setAnnotations([]); // Clear annotations
        return;
      }

      const data = await blob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data });
      const doc = await loadingTask.promise;

      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setAnnotations([]); // Clear existing annotations first

      if (name) setCurrentDocumentName(name);
      if (docId) {
        setCurrentDocumentId(docId);
        // Load saved annotations for this document
        try {
          const documentData = await getDocumentById(docId);
          if (documentData?.annotations) {
            setAnnotations(documentData.annotations);
          }
        } catch (error) {
          console.error('Error loading annotations:', error);
        }
      }

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
    (
      text,
      position = {
        x: ANNOTATIONS_POSITION.INITIAL_X,
        y: ANNOTATIONS_POSITION.INITIAL_Y,
      }
    ) => {
      if (!text.trim()) return;

      let newAnnotation = {};

      setAnnotations((prev) => {
        const gap = ANNOTATIONS_POSITION.GAP;
        let new_Y =
          position.y === ANNOTATIONS_POSITION.INITIAL_Y
            ? (prev.length + 1) * gap
            : (prev.length + 1) * position.y;

        newAnnotation = {
          id: uuidv4(),
          text,
          x: position.x,
          y: new_Y,
          page: currentPage,
          createdAt: new Date().toISOString(),
        };
        console.log(prev.length);
        return [newAnnotation, ...prev];
      });

      return newAnnotation;
    },
    [currentPage]
  );

  const removeAnnotation = useCallback((id) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations((prev) => prev.filter((ann) => ann.page !== currentPage));
  }, [currentPage]);

  // OPTIMIZED: Use functional update to minimize re-renders
  const updateAnnotationPosition = useCallback((id, newPosition) => {
    setAnnotations((prev) => {
      const index = prev.findIndex((ann) => ann.id === id);
      if (index === -1) return prev;

      const current = prev[index];
      // Only update if position actually changed
      if (current.x === newPosition.x && current.y === newPosition.y) {
        return prev;
      }

      const updated = [...prev];
      updated[index] = { ...current, ...newPosition };
      return updated;
    });
  }, []);

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

  useEffect(() => {
    const saveAnnotationsToDb = async () => {
      if (currentDocumentId && dbReady && annotations.length > 0) {
        try {
          console.log('Saving annotations:', annotations);
          await saveAnnotations(currentDocumentId, annotations);
          console.log('Annotations saved successfully');
        } catch (error) {
          console.error('Failed to save annotations:', error);
        }
      }
    };

    // Add a small debounce to prevent rapid saves
    const timer = setTimeout(saveAnnotationsToDb, 500);

    return () => clearTimeout(timer);
  }, [annotations, currentDocumentId, dbReady, saveAnnotations]);

  const contextValue = useMemo(
    () => ({
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
      currentAnnotationText,
      setCurrentAnnotationText,
      addAnnotation,
      removeAnnotation,
      clearAnnotations,
      updateAnnotationPosition,

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
    }),
    [
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
      currentDocumentId,
      setCurrentDocumentId,
      currentDocumentName,
      setCurrentDocumentName,
      highlights,
      addHighlight,
      removeHighlight,
      clearHighlights,
      currentHighlightColor,
      setCurrentHighlightColor,
      brushSize,
      setBrushSize,
      annotations,
      currentAnnotationText,
      setCurrentAnnotationText,
      addAnnotation,
      removeAnnotation,
      clearAnnotations,
      updateAnnotationPosition,
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
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

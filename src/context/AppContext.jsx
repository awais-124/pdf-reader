/**
 * AppContext.jsx - Updated with highlight management and cursor size options
 * Added highlight loading, saving, and removal functionality
 * Added fixed cursor sizing with 1x, 2x, 3x options
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
  HIGHLIGHT_CURSOR_SIZES, // New constant for cursor sizes
} from '../constants/appConstants.js';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { saveAnnotations, saveHighlights, dbReady, getDocumentById } =
    useContext(DbContext);

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

  // --- Highlights / Annotations ---
  const [highlights, setHighlights] = useState([]);
  const [currentHighlightColor, setCurrentHighlightColor] = useState(
    HIGHLIGHT_COLORS.yellow
  );
  const [highlightCursorSize, setHighlightCursorSize] = useState(1); // New: cursor size multiplier (1x, 2x, 3x)
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotationText, setCurrentAnnotationText] = useState('');

  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[0]);

  // --- TTS (placeholders) ---
  const [ttsStartIndex, setTtsStartIndex] = useState(null);
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
        setHighlights([]); // Clear highlights
        return;
      }

      const data = await blob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data });
      const doc = await loadingTask.promise;

      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setAnnotations([]); // Clear existing annotations first
      setHighlights([]); // Clear existing highlights first

      if (name) setCurrentDocumentName(name);
      if (docId) {
        setCurrentDocumentId(docId);
        // Load saved annotations and highlights for this document
        try {
          const documentData = await getDocumentById(docId);
          if (documentData?.annotations) {
            setAnnotations(documentData.annotations);
          }
          if (documentData?.highlights) {
            setHighlights(documentData.highlights);
          }
        } catch (error) {
          console.error('Error loading document data:', error);
        }
      }

      // Extract first page's text right away
      const firstPageText = await extractTextFromPage(doc, 1);
      setCurrentPageText(firstPageText);
    },
    [extractTextFromPage, getDocumentById]
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

  // --- Highlight Functions ---
  const addHighlight = useCallback((h) => {
    setHighlights((prev) => [...prev, h]);
  }, []);

  const removeHighlight = useCallback((id) => {
    setHighlights((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clearHighlights = useCallback(() => {
    // Only clear highlights for current page
    setHighlights((prev) => prev.filter((h) => h.page !== currentPage));
  }, [currentPage]);

  const clearAllHighlights = useCallback(() => {
    setHighlights([]);
  }, []);

  // --- Annotation Functions (unchanged) ---
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

  // --- TTS Functions (unchanged) ---
  const startTTS = useCallback(() => {
    let startText = currentPageText;
    if (ttsStartIndex !== null) {
      startText = currentPageText.slice(ttsStartIndex);
    }
    if (!startText) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(startText);
    utter.rate = ttsRate;
    setTtsUtterance(utter);
    setTtsActive(true);
    setTtsPaused(false);
    setTtsTimer(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTtsTimer((prev) => prev + 1), 1000);

    window.speechSynthesis.speak(utter);
  }, [ttsRate, currentPageText, ttsStartIndex]);

  const pauseTTS = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setTtsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setTtsPaused(false);
      timerRef.current = setInterval(() => {
        setTtsTimer((prev) => prev + 1);
      }, 1000);
    }
  }, []);

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

  // Save annotations to database
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

    const timer = setTimeout(saveAnnotationsToDb, 500);
    return () => clearTimeout(timer);
  }, [annotations, currentDocumentId, dbReady, saveAnnotations]);

  // Save highlights to database
  useEffect(() => {
    const saveHighlightsToDb = async () => {
      if (currentDocumentId && dbReady && highlights.length >= 0) {
        try {
          console.log('Saving highlights:', highlights);
          await saveHighlights(currentDocumentId, highlights);
          console.log('Highlights saved successfully');
        } catch (error) {
          console.error('Failed to save highlights:', error);
        }
      }
    };

    const timer = setTimeout(saveHighlightsToDb, 500);
    return () => clearTimeout(timer);
  }, [highlights, currentDocumentId, dbReady, saveHighlights]);

  useEffect(() => {
    setTtsStartIndex(null);
  }, [currentPage]);

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
      ttsStartIndex,
      setTtsStartIndex,

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
      clearAllHighlights,
      currentHighlightColor,
      setCurrentHighlightColor,
      highlightCursorSize, // New: cursor size
      setHighlightCursorSize, // New: cursor size setter
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
      HIGHLIGHT_CURSOR_SIZES, // New: cursor size options
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
      clearAllHighlights,
      currentHighlightColor,
      setCurrentHighlightColor,
      highlightCursorSize,
      setHighlightCursorSize,
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

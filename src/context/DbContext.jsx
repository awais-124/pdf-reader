/**
 * DbContext.jsx
 * Centralized IndexedDB layer using `idb`.
 * Now with full annotation support
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { DB_CONFIG } from '../constants/appConstants';

export const DbContext = createContext();

export const DbProvider = ({ children }) => {
  const dbRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [dbReady, setDbReady] = useState(false);

  // --- init DB once ---
  useEffect(() => {
    (async () => {
      const db = await openDB(DB_CONFIG.name, DB_CONFIG.version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
            db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id' });
          }
        },
      });
      dbRef.current = db;
      setDbReady(true);
      await refreshDocs(db); // pass the fresh db
    })();
  }, []);

  const getDb = () => dbRef.current;

  const refreshDocs = useCallback(async (dbInstance) => {
    const db = dbInstance || getDb();
    if (!db) return;
    const all = await db.getAll(DB_CONFIG.storeName);
    setDocs(all.slice().reverse());
  }, []);

  const addDocument = useCallback(
    async (file) => {
      const db = getDb();
      if (!db || !file) return null;
      const record = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        blob: file,
        annotations: [], // Initialize empty annotations array
        highlights: [], // Initialize empty highlights array
        lastOpened: new Date().toISOString(),
      };
      await db.put(DB_CONFIG.storeName, record);
      await refreshDocs(db);
      return record;
    },
    [refreshDocs]
  );

  const getDocumentById = useCallback((id) => {
    const db = getDb();
    if (!db) return null;
    return db.get(DB_CONFIG.storeName, id);
  }, []);

  const saveDocumentData = useCallback(
    async (id, data) => {
      const db = getDb();
      if (!db) return null;

      try {
        const document = await db.get(DB_CONFIG.storeName, id);
        if (!document) return null;

        const updatedDoc = {
          ...document,
          ...data,
          lastOpened: new Date().toISOString(),
        };

        await db.put(DB_CONFIG.storeName, updatedDoc);
        await refreshDocs(db);
        return updatedDoc;
      } catch (error) {
        console.error('Error saving document data:', error);
        return null;
      }
    },
    [refreshDocs]
  );

  const saveAnnotations = useCallback(
    async (documentId, annotations) => {
      return saveDocumentData(documentId, { annotations });
    },
    [saveDocumentData]
  );

  const saveHighlights = useCallback(
    async (documentId, highlights) => {
      return saveDocumentData(documentId, { highlights });
    },
    [saveDocumentData]
  );

  const deleteDocument = useCallback(
    async (
      id,
      currentDocumentId,
      setCurrentDocumentId,
      setCurrentDocumentName,
      loadPdfFromBlob
    ) => {
      const db = getDb();
      if (!db) return;

      await db.delete(DB_CONFIG.storeName, id);
      const updatedDocs = await db.getAll(DB_CONFIG.storeName);
      setDocs(updatedDocs.slice().reverse());

      // If the deleted doc was the one currently open
      if (id === currentDocumentId) {
        if (updatedDocs.length > 0) {
          // Pick the next doc (first in updated list)
          const nextDoc = updatedDocs[updatedDocs.length - 1]; // because we reversed earlier
          setCurrentDocumentId(nextDoc.id);
          setCurrentDocumentName(nextDoc.name);
          await loadPdfFromBlob(nextDoc.blob, nextDoc.name, nextDoc.id);
        } else {
          // No docs left — clear viewer
          setCurrentDocumentId(null);
          setCurrentDocumentName(null);
          loadPdfFromBlob(null);
        }
      }
    },
    []
  );

  const getAllDocuments = useCallback(async () => {
    const db = getDb();
    if (!db) return [];
    return await db.getAll(DB_CONFIG.storeName);
  }, []);

  return (
    <DbContext.Provider
      value={{
        docs,
        dbReady,
        addDocument,
        deleteDocument,
        getDocumentById,
        refreshDocs,
        getAllDocuments,
        saveDocumentData,
        saveAnnotations,
        saveHighlights,
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

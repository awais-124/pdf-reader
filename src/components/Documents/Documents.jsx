import React, { useContext } from 'react';
import styles from './Documents.module.css';
import Button from '../common/Button/Button';
import { DbContext } from '../../context/DbContext';
import { AppContext } from '../../context/AppContext';

export default function Documents() {
  const { docs, dbReady, addDocument, deleteDocument, getDocumentById } =
    useContext(DbContext);
  const {
    loadPdfFromBlob,
    setCurrentDocumentId,
    setCurrentDocumentName,
    currentDocumentId,
  } = useContext(AppContext);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf' || !dbReady) return;

    // Check for an exact match in docs by metadata
    const existing = docs.find(
      (doc) =>
        doc.name === file.name &&
        doc.size === file.size &&
        doc.type === file.type &&
        doc.lastModified === file.lastModified
    );

    if (existing) {
      // Select the existing doc instead of adding
      setCurrentDocumentId(existing.id);
      setCurrentDocumentName(existing.name);
      await loadPdfFromBlob(existing.blob, existing.name, existing.id);
    } else {
      // Add new doc
      const record = await addDocument(file);
      if (record?.blob) {
        setCurrentDocumentId(record.id);
        setCurrentDocumentName(record.name);
        await loadPdfFromBlob(record.blob, record.name, record.id);
      }
    }

    e.target.value = ''; // reset file input
  };

  const handleSelectDoc = async (docId) => {
    const doc = await getDocumentById(docId);
    if (doc?.blob) {
      setCurrentDocumentId(doc.id);
      setCurrentDocumentName(doc.name);
      await loadPdfFromBlob(doc.blob, doc.name, doc.id);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteDocument(
      id,
      currentDocumentId,
      setCurrentDocumentId,
      setCurrentDocumentName,
      loadPdfFromBlob
    );
  };

  return (
    <div className={styles.documents}>
      <div className={styles.uploadRow}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className={styles.fileInput}
          disabled={!dbReady}
        />
      </div>

      <div className={styles.docList}>
        {docs.length > 0 ? (
          docs.map((doc) => (
            <div
              key={doc.id}
              className={`${styles.docItem} ${
                doc.id === currentDocumentId ? styles.activeDoc : ''
              }`}
              onClick={() => handleSelectDoc(doc.id)}
            >
              {doc.name}
              <Button
                label="Delete"
                onClick={(e) => handleDelete(e, doc.id)}
                className={styles.btnDanger}
              />
            </div>
          ))
        ) : (
          <p>{dbReady ? 'No documents saved.' : 'Loading database...'}</p>
        )}
      </div>
    </div>
  );
}

import React, { useContext, useCallback, useMemo } from 'react';
import { AppContext } from '../../../context/AppContext';
import styles from '../PDF.module.css';

// Individual annotation component to prevent unnecessary re-renders
const AnnotationElement = React.memo(
  ({ annotation, onRemove, onPositionUpdate }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const elementRef = React.useRef(null);

    // Use refs for immediate, synchronous updates
    const positionRef = React.useRef({ x: annotation.x, y: annotation.y });
    const isDraggingRef = React.useRef(false);
    const dragDataRef = React.useRef({ offsetX: 0, offsetY: 0 });

    const updateElementPosition = useCallback((x, y) => {
      if (elementRef.current) {
        elementRef.current.style.left = `${x}px`;
        elementRef.current.style.top = `${y}px`;
      }
      positionRef.current = { x, y };
    }, []);

    const handleMouseDown = useCallback(
      (e) => {
        if (e.target.classList.contains(styles['annotation-close'])) return;

        isDraggingRef.current = true;

        const currentPosition = positionRef.current;
        dragDataRef.current = {
          offsetX: e.clientX - currentPosition.x,
          offsetY: e.clientY - currentPosition.y,
        };

        const handleMouseMove = (e) => {
          if (!isDraggingRef.current) return;

          const newX = e.clientX - dragDataRef.current.offsetX;
          const newY = e.clientY - dragDataRef.current.offsetY;

          // Direct DOM update for maximum performance
          updateElementPosition(newX, newY);
        };

        const handleMouseUp = () => {
          if (!isDraggingRef.current) return;

          isDraggingRef.current = false;
          onPositionUpdate(annotation.id, positionRef.current);

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
      },
      [annotation.id, onPositionUpdate, updateElementPosition]
    );

    // Sync position when annotation changes (but not during drag)
    React.useEffect(() => {
      if (!isDraggingRef.current) {
        updateElementPosition(annotation.x, annotation.y);
      }
    }, [annotation.x, annotation.y, updateElementPosition]);

    return (
      <div
        ref={elementRef}
        className={`${styles['text-annotation']} ${
          !isExpanded ? styles.collapsed : ''
        }`}
        style={{
          left: `${positionRef.current.x}px`,
          top: `${positionRef.current.y}px`,
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
        }}
        onClick={() => setIsExpanded(true)}
        onMouseDown={handleMouseDown}
      >
        <p style={{ display: isExpanded ? 'block' : 'none' }}>
          {annotation.text}
        </p>
        <span
          className={styles['annotation-close']}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(annotation.id);
          }}
          title="REMOVE"
        >
          ❎
        </span>
        <span
          className={styles['annotation-collapse']}
          onClick={(e) => {
            console.log('COLLAPSE BUTTON PRESSED');
            e.stopPropagation();
            setIsExpanded(false);
          }}
          title="COLLAPSE"
        >
          ⬅
        </span>
      </div>
    );
  }
);

AnnotationElement.displayName = 'AnnotationElement';

const AnnotationLayer = React.memo(() => {
  const {
    annotations,
    currentPage,
    removeAnnotation,
    updateAnnotationPosition,
  } = useContext(AppContext);

  // Filter annotations for current page
  const currentPageAnnotations = useMemo(
    () => annotations.filter((ann) => ann.page === currentPage),
    [annotations, currentPage]
  );

  const handleRemove = useCallback(
    (id) => {
      removeAnnotation(id);
    },
    [removeAnnotation]
  );

  const handlePositionUpdate = useCallback(
    (id, newPosition) => {
      updateAnnotationPosition(id, newPosition);
    },
    [updateAnnotationPosition]
  );

  return (
    <div className={styles.annotationLayer}>
      {currentPageAnnotations.map((annotation) => (
        <AnnotationElement
          key={annotation.id}
          annotation={annotation}
          onRemove={handleRemove}
          onPositionUpdate={handlePositionUpdate}
        />
      ))}
    </div>
  );
});

AnnotationLayer.displayName = 'AnnotationLayer';

export default AnnotationLayer;

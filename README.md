# PDF Viewer and Annotation App Features

## Core Functionality
- **PDF Document Management**
  - Upload and store PDF files in IndexedDB
  - View PDF documents with page navigation (prev/next/goto)
  - Track current page and total pages
  - Auto-select existing documents to prevent duplicates
  - Delete documents from storage

## PDF Viewing
- PDF.js integration for rendering PDFs
- Adjustable zoom/scale level
- High-DPI canvas rendering for sharp display
- Separate layers for highlights and annotations

## Text-to-Speech (TTS)
- Play/Pause/Resume/Stop controls
- Timer tracking reading duration
- Adjustable speech rate
- Automatic text extraction from PDF pages

## Document Management
- Persistent storage using IndexedDB
- Document list with active document highlighting
- File metadata comparison for duplicates
- Automatic loading of last viewed document

## UI Components
- Reusable Button component with styling options
- Document list with delete functionality
- Page navigation controls
- TTS control panel with timer
- Color picker for highlight colors

## State Management
- Context API for shared state
- AppContext for PDF and UI state
- DbContext for database operations
- React hooks for state management

## Utility Features
- Time formatter (MM:SS)
- Color name mapping
- Constants management
- Responsive design

## Placeholder/Stub Features
- Highlight functionality (UI ready, logic stubbed)
- Annotation functionality (UI ready, logic stubbed)
- Brush size selection (UI ready)
# Folder Structure for the project

```txt
src/
├── assets/                  # Static assets
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── ColorPicker/
│   │   │   ├── ColorPicker.tsx
│   │   │   └── ColorPicker.module.css
│   │   └── Tooltip/
│   │       ├── Tooltip.tsx
│   │       └── Tooltip.module.css
│   ├── pdf-viewer/
│   │   ├── PDFControls/
│   │   │   ├── PDFControls.tsx
│   │   │   └── PDFControls.module.css
│   │   ├── PDFPage/
│   │   │   ├── PDFPage.tsx
│   │   │   └── PDFPage.module.css
│   │   ├── PDFViewer/
│   │   │   ├── PDFViewer.tsx
│   │   │   └── PDFViewer.module.css
│   │   ├── TextAnnotation/
│   │   │   ├── TextAnnotation.tsx
│   │   │   └── TextAnnotation.module.css
│   │   └── VoiceControls/
│   │       ├── VoiceControls.tsx
│   │       └── VoiceControls.module.css
│   └── ui/
│       ├── DocumentList/
│       │   ├── DocumentList.tsx
│       │   └── DocumentList.module.css
│       ├── StatusBar/
│       │   ├── StatusBar.tsx
│       │   └── StatusBar.module.css
│       └── UploadArea/
│           ├── UploadArea.tsx
│           └── UploadArea.module.css
├── constants/
│   ├── enums.ts             # All enums
│   ├── messages.ts          # UI messages and error messages
│   └── settings.ts          # App constants (colors, sizes, etc.)
├── hooks/
│   ├── usePDF.ts            # Custom hook for PDF operations
│   └── useVoice.ts          # Custom hook for text-to-speech
├── lib/
│   ├── pdfUtils.ts          # PDF utility functions
│   └── storage.ts           # IndexedDB operations
├── store/
│   ├── features/
│   │   ├── pdf/
│   │   │   ├── pdfSlice.ts
│   │   │   └── pdfThunks.ts
│   │   └── voice/
│   │       ├── voiceSlice.ts
│   │       └── voiceThunks.ts
│   ├── hooks.ts             # Typed hooks
│   └── store.ts             # Redux store configuration
├── types/
│   └── index.ts             # Type definitions
├── utils/
│   ├── cursor.ts            # Cursor utilities
│   ├── highlight.ts         # Highlight utilities
│   └── zoom.ts              # Zoom utilities
├── App.tsx
├── main.tsx
└── index.css
```
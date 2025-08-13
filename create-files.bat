@echo off
REM === Create folders ===
mkdir src
mkdir src\assets
mkdir src\components
mkdir src\components\common
mkdir src\components\common\Button
mkdir src\components\common\ColorPicker
mkdir src\components\common\Tooltip
mkdir src\components\pdf-viewer
mkdir src\components\pdf-viewer\PDFControls
mkdir src\components\pdf-viewer\PDFPage
mkdir src\components\pdf-viewer\PDFViewer
mkdir src\components\pdf-viewer\TextAnnotation
mkdir src\components\pdf-viewer\VoiceControls
mkdir src\components\ui
mkdir src\components\ui\DocumentList
mkdir src\components\ui\StatusBar
mkdir src\components\ui\UploadArea
mkdir src\constants
mkdir src\hooks
mkdir src\lib
mkdir src\store
mkdir src\store\features
mkdir src\store\features\pdf
mkdir src\store\features\voice
mkdir src\types
mkdir src\utils

REM === Create files ===
type nul > src\components\common\Button\Button.jsx
type nul > src\components\common\Button\Button.module.css
type nul > src\components\common\ColorPicker\ColorPicker.jsx
type nul > src\components\common\ColorPicker\ColorPicker.module.css
type nul > src\components\common\Tooltip\Tooltip.jsx
type nul > src\components\common\Tooltip\Tooltip.module.css

type nul > src\components\pdf-viewer\PDFControls\PDFControls.jsx
type nul > src\components\pdf-viewer\PDFControls\PDFControls.module.css
type nul > src\components\pdf-viewer\PDFPage\PDFPage.jsx
type nul > src\components\pdf-viewer\PDFPage\PDFPage.module.css
type nul > src\components\pdf-viewer\PDFViewer\PDFViewer.jsx
type nul > src\components\pdf-viewer\PDFViewer\PDFViewer.module.css
type nul > src\components\pdf-viewer\TextAnnotation\TextAnnotation.jsx
type nul > src\components\pdf-viewer\TextAnnotation\TextAnnotation.module.css
type nul > src\components\pdf-viewer\VoiceControls\VoiceControls.jsx
type nul > src\components\pdf-viewer\VoiceControls\VoiceControls.module.css

type nul > src\components\ui\DocumentList\DocumentList.jsx
type nul > src\components\ui\DocumentList\DocumentList.module.css
type nul > src\components\ui\StatusBar\StatusBar.jsx
type nul > src\components\ui\StatusBar\StatusBar.module.css
type nul > src\components\ui\UploadArea\UploadArea.jsx
type nul > src\components\ui\UploadArea\UploadArea.module.css

type nul > src\constants\enums.js
type nul > src\constants\messages.js
type nul > src\constants\settings.js

type nul > src\hooks\usePDF.js
type nul > src\hooks\useVoice.js

type nul > src\lib\pdfUtils.js
type nul > src\lib\storage.js

type nul > src\store\features\pdf\pdfSlice.js
type nul > src\store\features\pdf\pdfThunks.js
type nul > src\store\features\voice\voiceSlice.js
type nul > src\store\features\voice\voiceThunks.js
type nul > src\store\hooks.js
type nul > src\store\store.js

type nul > src\types\index.js

type nul > src\utils\cursor.js
type nul > src\utils\highlight.js
type nul > src\utils\zoom.js

type nul > src\App.jsx
type nul > src\main.jsx
type nul > src\index.css

echo Project structure created successfully!
pause

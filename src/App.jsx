import './App.css';

import Documents from './components/Documents/Documents.jsx';
import Actions from './components/Actions/Actions.jsx';
import PDF from './components/PDF/PDF.jsx';

export default function App() {
  return (
    <div className="app-wrapper">
      <div className="app-container">
        <Documents />
        <Actions />
        <PDF />
      </div>
    </div>
  );
}

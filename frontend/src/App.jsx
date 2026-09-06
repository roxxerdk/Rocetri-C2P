import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Project from './pages/Project.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project" element={<Project />} />
      </Routes>
    </BrowserRouter>
  );
}

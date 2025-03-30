import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import InstitutionsPage from "./pages/InstitutionsPage";
import ImagesPage from "./pages/ImagesPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./components/NotFound";
import "./styles/App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<InstitutionsPage />} />
          <Route path="/images" element={<ImagesPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
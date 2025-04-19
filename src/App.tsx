import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home"; // Import the Home component
import Dashboard from "./Dashboard"; // Import the Dashboard component (will create next)
import NotFoundPage from "./NotFoundPage"; // Import the 404 page component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home"; // Import the Home component
import Dashboard from "./Dashboard"; // Import the Dashboard component (will create next)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

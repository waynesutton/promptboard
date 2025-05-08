import Home from "./Home"; // Import the Home component
// import Dashboard from "./Dashboard"; // Dashboard is handled by main.tsx routing
// import NotFoundPage from "./NotFoundPage"; // NotFound can be handled by main.tsx routing or a root error element

function App() {
  // App component now just renders the content for the root path ("/")
  // Routing is handled by src/main.tsx
  return <Home />;
}

export default App;

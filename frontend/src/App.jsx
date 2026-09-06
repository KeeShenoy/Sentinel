import { useState } from "react";
import Login from "./Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return <Dashboard onSessionExpired={() => setLoggedIn(false)} />;
}

export default App;

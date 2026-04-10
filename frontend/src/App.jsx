import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import AreaInsights from "./pages/AreaInsights";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/insights" element={<AreaInsights />} />
        <Route path="/upload" element={<UploadPage />} />
      </Route>
    </Routes>
  );
}

export default App;
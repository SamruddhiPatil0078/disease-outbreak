import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const API = "http://127.0.0.1:3000";

export default function Layout() {
  const [riskData, setRiskData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const fetchRisk = async (city) => {
    setLoading(true);
    setCurrentCity(city);
    try {
      const res = await fetch(`${API}/api/risk/calculate?city=${city}`);
      const json = await res.json();
      if (json.success) {
        setRiskData(json.data);
        if (json.data?.[0]?.weather) {
          setWeatherData(json.data[0].weather);
        }
      } else {
        setRiskData(null);
        setWeatherData(null);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setRiskData(null);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0b1120]">

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
        ${sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"}`}
      >
        {/* TopBar */}
        <TopBar onSearch={fetchRisk} weatherData={weatherData} />

        {/* Content Area */}
        <div className="flex-1 px-6 pt-22.5 pb-10">

          {/* FULL WIDTH FIX (IMPORTANT) */}
          <div className="w-full px-2 sm:px-4 lg:px-6">
            <Outlet
              context={{
                riskData,
                weatherData,
                loading,
                currentCity,
                fetchRisk,
              }}
            />
          </div>

        </div>
      </main>

    </div>
  );
}
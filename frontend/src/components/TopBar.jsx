import { useState } from "react";
import { Search, Droplets, Thermometer, CloudRain } from "lucide-react";

export default function TopBar({ onSearch, weatherData }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const weather = weatherData || null;

  return (
    <header className="fixed top-0 right-0 z-40 h-[72px] 
      flex items-center justify-between gap-6 
      px-8 bg-[#0b1120]/80 backdrop-blur-xl border-b border-white/[0.05]
      transition-all duration-300"
    >
      
      {/* Search */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-lg relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
        <input
          type="text"
          placeholder="Search city (e.g. Pune)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-sm text-white placeholder-navy-500 outline-none focus:border-blue-500/30 focus:bg-white/[0.05]"
        />
      </form>

      {/* Weather */}
      {weather && (
        <div className="glass-light px-5 py-2.5 flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-sm text-white">{weather.temp}°C</span>
          </div>

          <div className="w-px h-4 bg-white/[0.06]" />

          <div className="flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-sm text-white">{weather.humidity}%</span>
          </div>

          <div className="w-px h-4 bg-white/[0.06]" />

          <div className="flex items-center gap-2">
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm text-white">{weather.rainfall}mm</span>
          </div>
        </div>
      )}
    </header>
  );
}
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  MapPin, Thermometer, Droplets, CloudRain, Shield,
  Clock, AlertTriangle, TrendingUp, X
} from "lucide-react";
import LoadingSkeleton from "../components/LoadingSkeleton";

const badgeClass = (level) => {
  switch (level) { case "HIGH": return "badge-high"; case "MEDIUM": return "badge-medium"; case "LOW": return "badge-low"; default: return "badge-low"; }
};

const borderColor = (level) => {
  switch (level) { case "HIGH": return "border-l-red-500"; case "MEDIUM": return "border-l-amber-500"; case "LOW": return "border-l-green-500"; default: return "border-l-blue-500"; }
};

export default function AreaInsights() {
  const { riskData, loading, currentCity } = useOutletContext();
  const [selectedArea, setSelectedArea] = useState(null);

  const data = riskData ? (Array.isArray(riskData) ? riskData : [riskData]) : [];

  if (!currentCity) {
    return (
      <div className="glass p-16 text-center animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
          <Shield className="w-6 h-6 text-navy-600" />
        </div>
        <h3 className="text-base font-semibold text-navy-300 mb-2">Area Insights</h3>
        <p className="text-sm text-navy-500 max-w-sm mx-auto">Search for a city to explore detailed risk profiles per area</p>
      </div>
    );
  }

  if (loading) return <LoadingSkeleton count={6} />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Area Insights</h2>
        <span className="text-[13px] text-navy-500">— {currentCity} · {data.length} areas</span>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
        {data.map((item, i) => (
          <button
            key={i}
            onClick={() => setSelectedArea(item)}
            className={`glass-subtle p-5 text-left border-l-[3px] ${borderColor(item.prediction?.level)} hover:bg-white/[0.03] transition-all duration-200 group cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <h3 className="font-semibold text-white text-sm">{item.area}</h3>
              </div>
              <span className={`${badgeClass(item.prediction?.level)} px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide`}>
                {item.prediction?.level}
              </span>
            </div>
            <p className="text-[13px] text-navy-300 mb-1">
              <span className="text-white font-medium capitalize">{item.prediction?.disease}</span>
            </p>
            <p className="text-xs text-navy-500">{item.prediction?.confidence} confidence</p>
            <p className="text-[11px] text-navy-600 mt-3 group-hover:text-navy-400 transition-colors">Click for details →</p>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedArea && (
        <div
          className="fixed inset-0 modal-overlay z-[60] flex items-center justify-center p-6"
          onClick={() => setSelectedArea(null)}
        >
          <div
            className="glass w-full max-w-lg p-8 animate-fade-in-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedArea(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-navy-400 hover:text-white transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedArea.area}</h3>
                <p className="text-xs text-navy-500">{selectedArea.city}</p>
              </div>
              <span className={`${badgeClass(selectedArea.prediction?.level)} ml-auto px-3 py-1 text-xs font-bold rounded-full uppercase`}>
                {selectedArea.prediction?.level}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <InfoBox label="Primary Disease" value={selectedArea.prediction?.disease} capitalize />
              <InfoBox label="Confidence" value={selectedArea.prediction?.confidence} />
              <InfoBox label="Risk Score" value={selectedArea.prediction?.riskScore} />
              <InfoBox label="Expected Outbreak" value={selectedArea.prediction?.expectedOutbreak} />
            </div>

            {/* Weather */}
            {selectedArea.weather && (
              <div className="mb-6">
                <p className="text-[10px] text-navy-500 uppercase tracking-wider font-medium mb-3">Weather Conditions</p>
                <div className="flex items-center gap-6 px-4 py-3 rounded-xl glass-subtle">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-sm text-white font-medium">{selectedArea.weather.temp}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-sm text-white font-medium">{selectedArea.weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm text-white font-medium">{selectedArea.weather.rainfall}mm</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Diseases */}
            {selectedArea.topDiseases?.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] text-navy-500 uppercase tracking-wider font-medium mb-3">Disease Breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {selectedArea.topDiseases.map((d, j) => (
                    <span key={j} className="px-3 py-1.5 rounded-full text-xs font-medium glass-subtle text-navy-300">
                      {d.name}: <span className="text-white">{d.probability}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Early Warning */}
            {selectedArea.prediction?.earlyWarning?.includes("⚠️") && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 mb-4">
                <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-200">{selectedArea.prediction.earlyWarning}</p>
              </div>
            )}

            {/* Summary */}
            {selectedArea.summary && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/10">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-200/80 leading-relaxed">{selectedArea.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value, capitalize }) {
  return (
    <div className="glass-subtle p-4">
      <p className="text-[10px] text-navy-500 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-sm font-semibold text-white ${capitalize ? "capitalize" : ""}`}>{value || "—"}</p>
    </div>
  );
}

import { AlertTriangle, MapPin, Clock, ShieldAlert } from "lucide-react";

export default function HighRiskAlerts({ riskData }) {
  if (!riskData) return null;

  const highRisk = (Array.isArray(riskData) ? riskData : [riskData]).filter(
    (d) => d.prediction?.level === "HIGH"
  );

  if (highRisk.length === 0) return null;

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-5">
        <ShieldAlert className="w-5 h-5 text-red-400" />
        <h3 className="text-base font-semibold text-white">Critical Alerts</h3>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/12 text-red-300 border border-red-500/15">
          {highRisk.length}
        </span>
      </div>

      <div className="scroll-x flex gap-5 pb-3">
        {highRisk.map((item, i) => (
          <div
            key={i}
            className="glass min-w-[300px] p-6 border-l-[3px] border-l-red-500 pulse-glow flex-shrink-0 hover:bg-white/[0.02] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-400" />
                <h4 className="font-semibold text-white text-sm">{item.area}, {item.city}</h4>
              </div>
              <span className="badge-high px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide">
                {item.prediction.level}
              </span>
            </div>

            <p className="text-[13px] text-navy-300 mb-2">
              <span className="text-white font-medium capitalize">{item.prediction.disease}</span>
              <span className="text-navy-500"> · </span>
              {item.prediction.confidence} confidence
            </p>

            <div className="flex items-center gap-2 text-xs text-navy-500">
              <Clock className="w-3 h-3" />
              <span>Expected: {item.prediction.expectedOutbreak}</span>
            </div>

            {item.summary && (
              <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/10">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-red-200/80 leading-relaxed">{item.summary}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

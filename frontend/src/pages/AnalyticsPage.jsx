import { useOutletContext } from "react-router-dom";
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Target } from "lucide-react";
import LoadingSkeleton from "../components/LoadingSkeleton";

const DISEASE_COLORS = {
  dengue: "#ef4444",
  malaria: "#f59e0b",
  typhoid: "#8b5cf6",
  cholera: "#06b6d4",
  flu: "#3b82f6",
  "viral fever": "#ec4899",
  chikungunya: "#f97316",
  leptospirosis: "#14b8a6",
};

const getColor = (disease) =>
  DISEASE_COLORS[disease?.toLowerCase()] || "#64748b";

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-4 py-3 text-xs shadow-2xl">
      <p className="text-navy-400 font-medium mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2.5 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-navy-400">{entry.name}</span>
          <span className="text-white ml-auto">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { riskData, currentCity, loading } = useOutletContext();

  const data = riskData
    ? Array.isArray(riskData)
      ? riskData
      : [riskData]
    : [];

  // ✅ Disease Distribution
  const diseaseDistribution = data.reduce((acc, item) => {
    (item.topDiseases || []).forEach((td) => {
      const name = td.name.toLowerCase();
      const existing = acc.find((a) => a.name === name);
      if (existing) existing.count += parseInt(td.probability) || 1;
      else
        acc.push({
          name,
          count: parseInt(td.probability) || 1,
          color: getColor(name),
        });
    });
    return acc;
  }, []);

  // ✅ Risk Score
  const topRisk = data[0]?.prediction;
  const riskScore = topRisk
    ? Math.round(topRisk.riskScore * 100)
    : 0;

  const donutData = [
    { name: "Risk", value: riskScore },
    { name: "Safe", value: 100 - riskScore },
  ];

  const donutColor =
    riskScore >= 70
      ? "#ef4444"
      : riskScore >= 40
      ? "#f59e0b"
      : "#22c55e";

  if (!currentCity) {
    return (
      <div className="glass p-16 text-center">
        <BarChart3 className="mx-auto mb-4 text-navy-600" />
        <h3 className="text-white">Disease Analytics</h3>
        <p className="text-navy-500">
          Search a city to view insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-white text-lg font-semibold">
        Analytics — {currentCity}
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Disease Distribution */}
          <div className="glass p-6">
            <h3 className="text-white mb-4">Disease Distribution</h3>

            {diseaseDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={diseaseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count">
                    {diseaseDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-navy-500">No data available</p>
            )}
          </div>

          {/* Risk Score */}
          <div className="glass p-6 flex flex-col items-center justify-center">
            <h3 className="text-white mb-4">Overall Risk Score</h3>

            {topRisk ? (
              <>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill={donutColor} />
                      <Cell fill="#1f2937" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="text-center mt-2">
                  <p className="text-3xl text-white font-bold">
                    {riskScore}
                  </p>
                  <p className="text-navy-500 text-sm">/ 100</p>
                  <p className="text-navy-400 mt-2">
                    Primary threat:{" "}
                    <span className="text-white">
                      {topRisk.disease}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-navy-500">No risk data</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  MapPin,
  BarChart3,
  Layers,
  Upload,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/", icon: MapPin, label: "Dashboard" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/insights", icon: Layers, label: "Insights" },
  { to: "/upload", icon: Upload, label: "Upload" },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-[220px]"}
        bg-navy-900/80 backdrop-blur-xl border-r border-white/[0.04]`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-white/[0.04] ${collapsed ? "px-4 py-5 justify-center" : "px-5 py-5"}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/15 flex-shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight">Outbreak AI</h1>
            <p className="text-[9px] text-navy-500 font-medium tracking-[0.12em] uppercase">Prediction</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-5 flex flex-col gap-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 group
              ${collapsed ? "px-0 py-3 justify-center" : "px-3.5 py-2.5"}
              ${isActive
                ? "bg-blue-500/10 text-white shadow-sm shadow-blue-500/5"
                : "text-navy-500 hover:text-navy-200 hover:bg-white/[0.03]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-[17px] h-[17px] flex-shrink-0 transition-all duration-200 ${
                    isActive ? "text-blue-400" : "text-navy-500 group-hover:text-navy-300"
                  }`}
                />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="mx-auto mb-5 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-navy-500 hover:text-navy-300 transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}

import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Upload, FileText, CheckCircle, XCircle, CloudUpload,
  Thermometer, Droplets, CloudRain
} from "lucide-react";

const API = "http://127.0.0.1:3000";

export default function UploadPage() {
  const { fetchRisk, weatherData } = useOutletContext();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) setFile(dropped);
    else showToast("error", "Please upload a .csv file");
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        showToast("success", `${json.inserted} records uploaded successfully!`);
        setFile(null);
        if (json.cities?.length > 0) fetchRisk(json.cities[0]);
      } else {
        showToast("error", json.error || "Upload failed");
      }
    } catch {
      showToast("error", "Upload failed — check server connection");
    }
    setUploading(false);
  };

  const weather = weatherData || null;

  return (
    <div className="relative animate-fade-in">
      {/* Floating Weather Widget */}
      {weather && (
        <div className="absolute top-0 right-0 glass-light px-4 py-3 flex items-center gap-4 animate-fade-in text-xs">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3 h-3 text-orange-400" />
            <span className="font-medium text-white">{weather.temp}°C</span>
          </div>
          <div className="w-px h-3.5 bg-white/[0.06]" />
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="font-medium text-white">{weather.humidity}%</span>
          </div>
          <div className="w-px h-3.5 bg-white/[0.06]" />
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-3 h-3 text-cyan-400" />
            <span className="font-medium text-white">{weather.rainfall}mm</span>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto pt-12 space-y-6">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Upload Data</h2>
        </div>

        <div className="glass p-8">
          <p className="text-[13px] text-navy-400 mb-8 leading-relaxed">
            Upload a CSV file containing disease case records with columns for{" "}
            <span className="text-navy-200 font-medium">area, city, date, disease, cases</span>.
          </p>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? "border-blue-400/40 bg-blue-500/[0.05]"
                : "border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.01]"
            }`}
          >
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <CloudUpload className={`w-10 h-10 mx-auto mb-4 transition-all duration-300 ${dragOver ? "text-blue-400 scale-110" : "text-navy-600"}`} />
            <p className="text-sm text-navy-300 mb-1">
              Drop your CSV here or <span className="text-blue-400 font-medium">browse</span>
            </p>
            <p className="text-xs text-navy-600">Supports .csv up to 10MB</p>
          </div>

          {/* File Info */}
          {file && (
            <div className="mt-5 flex items-center gap-3 px-4 py-3.5 rounded-xl glass-subtle animate-fade-in">
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{file.name}</p>
                <p className="text-[11px] text-navy-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setFile(null)} className="text-navy-500 hover:text-red-400 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`mt-6 w-full py-3.5 rounded-2xl font-medium text-sm transition-all duration-300 ${
              file && !uploading
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/20"
                : "bg-white/[0.03] text-navy-600 cursor-not-allowed"
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Uploading...
              </span>
            ) : "Upload & Analyze"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-fade-in-up z-50 ${
          toast.type === "success"
            ? "glass border border-green-500/15 text-green-200"
            : "glass border border-red-500/15 text-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

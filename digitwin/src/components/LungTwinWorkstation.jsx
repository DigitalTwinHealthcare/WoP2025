import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wind,
  Settings,
  Play,
  Square,
  Layout,
  Save,
  FolderOpen,
  MousePointer2,
  PenTool,
  Scissors,
  Trash2,
  Move,
  Maximize2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LungScene from './Lung3D';

const LungTwinWorkstation = () => {
  // --- State ---
  const [volume, setVolume] = useState(500); // Tidal Volume (mL)
  const [compliance, setCompliance] = useState(50); // mL/cmH2O
  const [resistance, setResistance] = useState(5); // cmH2O/L/s
  const [flowData, setFlowData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);

  // --- Simulation Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      // Simple harmonic motion for breathing simulation
      const newFlow = Math.sin(time * 2) * (30 - resistance);
      const newVolume = (Math.sin(time * 2 - Math.PI / 2) + 1) * 250 + (compliance * 2);

      setFlowData(prev => [...prev.slice(-20), { time, value: newFlow }]);
      setVolumeData(prev => [...prev.slice(-20), { time, value: newVolume }]);
    }, 100);
    return () => clearInterval(interval);
  }, [compliance, resistance]);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-slate-100 overflow-hidden font-sans">

      {/* --- HEADER --- */}
      <header className="h-14 bg-black border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-bold tracking-wide text-slate-100">
            LUNG<span className="text-blue-500">TWIN</span> WORKSTATION
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-slate-300 rounded text-sm transition-colors border border-gray-800">
            <FolderOpen className="w-4 h-4" />
            Load Patient
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
            <Save className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </header>

      {/* --- MAIN BODY --- */}
      <div className="flex flex-1 overflow-hidden">

        {/* --- CENTER WORKSPACE (3D) --- */}
        <main className="flex-1 relative bg-black overflow-hidden">
          {/* 3D Scene Container - takes full space */}
          <div className="absolute inset-0">
            <LungScene volume={volume} resistance={resistance} />
          </div>

          {/* Floating Tools Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-4 z-20">
            <div className="bg-black/50 backdrop-blur-sm p-2 rounded-xl border border-white/10 flex flex-col gap-2">
              <ToolButton icon={MousePointer2} active />
              <ToolButton icon={Move} />
              <ToolButton icon={Maximize2} />
              <div className="w-full h-px bg-white/10 my-1" />
              <ToolButton icon={PenTool} />
              <ToolButton icon={Scissors} />
              <ToolButton icon={Trash2} color="text-red-500 hover:text-red-400" />
            </div>

            <div className="bg-black/50 backdrop-blur-sm p-2 rounded-xl border border-white/10 flex flex-col gap-2">
              <ToolButton icon={Settings} />
            </div>
          </div>

          {/* Overlay Text */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-500 text-sm pointer-events-none">
            Interactive 3D View • Drag to Rotate • Scroll to Zoom
          </div>
        </main>

        {/* --- RIGHT SIDEBAR (CONTROLS) --- */}
        <aside className="w-80 bg-black border-l border-gray-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-10">

          {/* Section: Parameters */}
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-3 h-3" />
              Physiological Parameters
            </h2>

            <div className="space-y-6">
              {/* Compliance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Compliance</span>
                  <span className="text-blue-400 font-mono">{compliance}</span>
                </div>
                <input
                  type="range"
                  min="10" max="100"
                  value={compliance}
                  onChange={(e) => setCompliance(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                />
                <div className="text-xs text-gray-500 text-right">mL/cmH2O</div>
              </div>

              {/* Resistance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Resistance</span>
                  <span className={`font-mono ${resistance > 10 ? 'text-red-400' : 'text-blue-400'}`}>{resistance}</span>
                </div>
                <input
                  type="range"
                  min="1" max="20"
                  value={resistance}
                  onChange={(e) => setResistance(Number(e.target.value))}
                  className={`w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer transition-all ${resistance > 10 ? 'accent-red-500 hover:accent-red-400' : 'accent-blue-500 hover:accent-blue-400'}`}
                />
                <div className="text-xs text-gray-500 text-right">cmH2O/L/s</div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Tidal Volume</span>
                  <span className="text-blue-400 font-mono">{volume}</span>
                </div>
                <input
                  type="range"
                  min="300" max="800"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                />
                <div className="text-xs text-gray-500 text-right">mL</div>
              </div>
            </div>
          </div>

          {/* Section: Therapies */}
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wind className="w-3 h-3" />
              Interventions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <TherapyButton label="Bronchodilator" onClick={() => setResistance(Math.max(1, resistance - 5))} />
              <TherapyButton label="Mucolytic" onClick={() => setResistance(Math.max(1, resistance - 2))} />
              <TherapyButton label="Peep +" onClick={() => setCompliance(Math.min(100, compliance + 10))} />
              <TherapyButton label="Peep -" onClick={() => setCompliance(Math.max(10, compliance - 10))} />
            </div>
          </div>

          {/* Section: Analytics */}
          <div className="p-5 flex-1 min-h-[300px]">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Real-time Analytics
            </h2>

            <div className="space-y-4">
              <ChartCard title="Flow (L/min)" data={flowData} color="#60a5fa" />
              <ChartCard title="Volume (mL)" data={volumeData} color="#34d399" />
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

// --- Helper Components ---

const ToolButton = ({ icon: Icon, active, color = "text-gray-400 hover:text-slate-100" }) => (
  <button className={`p-2 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : `hover:bg-gray-800 ${color}`}`}>
    <Icon className="w-5 h-5" />
  </button>
);

const TherapyButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded text-xs font-medium text-slate-300 transition-all active:scale-95"
  >
    {label}
  </button>
);

const ChartCard = ({ title, data, color }) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
    <div className="text-xs text-gray-500 mb-2">{title}</div>
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // Disable animation for performance
          />
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
          <YAxis hide domain={['auto', 'auto']} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default LungTwinWorkstation;

import React, { useEffect } from 'react';
import { Activity, Brain, AlertTriangle, ShieldCheck, Microscope, Thermometer, Stethoscope } from 'lucide-react';

const MetricCard = ({ label, value, subtext, icon: Icon, status }) => {
  // Explicit Medical Colors
  const theme = {
    safe: { bg: "bg-neuro-safe/10", border: "border-neuro-safe/40", text: "text-neuro-safe" },
    risk: { bg: "bg-neuro-warning/10", border: "border-neuro-warning/40", text: "text-neuro-warning" },
    critical: { bg: "bg-neuro-critical/10", border: "border-neuro-critical/40", text: "text-neuro-critical" },
    neutral: { bg: "bg-slate-800", border: "border-slate-700", text: "text-slate-300" }
  };

  const current = theme[status] || theme.neutral;

  return (
    <div className={`${current.bg} border-l-4 ${current.border} p-4 rounded-r-xl shadow-sm hover:brightness-110 transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neuro-muted">{label}</span>
        <Icon className={`w-4 h-4 ${current.text}`} />
      </div>
      <div className="text-xl font-black tracking-tight text-white">{value}</div>
      {subtext && <div className="text-[10px] opacity-60 font-mono mt-1 text-slate-300">{subtext}</div>}
    </div>
  );
};

const Dashboard = ({ metrics, year, setYear, setAlert }) => {
  if (!metrics) return null;

  const score = metrics.atrophy_severity_score;
  const isCritical = score > 2.0;
  const isRisk = score > 1.0 && !isCritical;

  // Determine status strings for styling
  const volStatus = metrics.brain_volume_cc > 1000 ? "safe" : "critical"; // Adjusted for common whole-brain NIfTI
  const riskStatus = isCritical ? "critical" : isRisk ? "risk" : "safe";

  useEffect(() => {
    if (isCritical && year > 4.8 && year < 5.0) {
      setAlert({
        isOpen: true,
        title: "DEGENERATION ALERT",
        content: "Simulated dendritic loss has exceeded the threshold for independent function. Hippocampal connectivity critical.",
        type: "danger"
      });
    }
  }, [year, isCritical, setAlert]);

  return (
    <div className="flex flex-col h-full gap-4 bg-neuro-panel p-4 rounded-xl shadow-2xl overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-700/50">
         <Stethoscope className="w-5 h-5 text-neuro-primary" />
         <span className="text-sm font-bold text-white uppercase tracking-wider">Patient Vitals</span>
      </div>

      {/* Metrics Stack */}
      <div className="space-y-3">
        <MetricCard 
          label="Total Volume" 
          value={`${metrics.brain_volume_cc} cc`} 
          subtext="Baseline Scan Data"
          icon={Brain}
          status={volStatus}
        />
        
        <MetricCard 
          label="Atrophy Velocity" 
          value={isCritical ? "AGGRESSIVE" : isRisk ? "ELEVATED" : "STABLE"} 
          subtext={`Decay Coeff: ${score}x`}
          icon={Thermometer}
          status={riskStatus}
        />

        <MetricCard 
          label="Risk Assessment" 
          value={isCritical ? "HIGH RISK" : "LOW RISK"} 
          subtext="Based on Braak Staging"
          icon={isCritical ? AlertTriangle : ShieldCheck}
          status={riskStatus}
        />
      </div>

      {/* SLIDER CONTROL */}
      <div className="mt-auto pt-6 border-t border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
           <span className="text-xs font-bold text-neuro-primary uppercase">Projection Timeline</span>
           <span className="font-mono text-lg font-bold text-white">{year.toFixed(1)} Yrs</span>
        </div>

        {/* Custom Gradient Slider */}
        <div className="relative h-10 flex items-center">
          {/* Gradient Track */}
          <div className="absolute w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"></div>
          
          <input 
            type="range" 
            min="0" 
            max="10" 
            step="0.1"
            value={year} 
            onChange={(e) => setYear(parseFloat(e.target.value))}
            className="absolute w-full h-10 opacity-0 cursor-pointer z-20"
          />
          
          {/* Thumb Visual */}
          <div 
            className="absolute h-5 w-5 bg-white rounded-full border-4 border-slate-900 shadow-xl pointer-events-none transition-all duration-75"
            style={{ left: `calc(${year * 10}% - 10px)` }}
          ></div>
        </div>

        <div className="flex justify-between mt-1 text-[9px] text-slate-500 font-bold uppercase">
          <span>Diagnosis</span>
          <span>5 Yrs</span>
          <span>10 Yrs</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
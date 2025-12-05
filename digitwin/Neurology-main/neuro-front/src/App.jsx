import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import NeuronViewer from './components/NeuronViewer';
import Dashboard from './components/Dashboard';
import InfoModal from './components/InfoModal';
import { Activity, MonitorPlay, AlertTriangle } from 'lucide-react';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [year, setYear] = useState(0);
  const [alert, setAlert] = useState({ isOpen: false, title: "", content: "", type: "info" });

  // --- PROGNOSIS LOGIC (Heads-Up Display) ---
  const getPrognosis = () => {
    if (!analysisData) return "System Idle";
    if (year === 0) return "Baseline Scan Analysis";
    
    const score = analysisData.metrics.atrophy_severity_score;
    
    if (score < 1.0) return `T+${year} Yrs: Structural Integrity Maintained`;
    if (year < 4) return `T+${year} Yrs: Early MCI. Dendritic Pruning Detected`;
    return `T+${year} Yrs: Advanced Atrophy. Connectivity Failure`;
  };

  // Risk check for color coding the HUD
  const isCritical = analysisData?.metrics.atrophy_severity_score > 1.5 && year > 5;

  return (
    <div className="w-screen h-screen flex flex-col bg-neuro-bg text-neuro-primary overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-14 shrink-0 border-b border-slate-800 bg-neuro-bg/95 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-neuro-primary/10 p-1.5 rounded">
            <Activity className="w-5 h-5 text-neuro-primary" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            NEURO<span className="text-neuro-accent">TWIN</span>
            <span className="ml-2 text-[10px] text-neuro-muted uppercase tracking-widest font-normal">Clinical Simulator v2.1</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${analysisData ? 'bg-neuro-primary/10 border-neuro-primary/20' : 'bg-slate-800 border-slate-700'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${analysisData ? 'bg-neuro-primary animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-[10px] font-bold tracking-wider text-neuro-text">{analysisData ? 'ACTIVE SESSION' : 'STANDBY'}</span>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex p-4 gap-4 overflow-hidden relative">
        
        {/* LEFT SIDEBAR (Controls) */}
        <section className="w-[340px] shrink-0 flex flex-col gap-4 h-full z-10">
          {!analysisData ? (
            <div className="flex-1 bg-neuro-panel rounded-xl shadow-2xl flex flex-col justify-center p-6 border border-neuro-card">
               <div className="text-center mb-6">
                 <MonitorPlay className="w-12 h-12 text-neuro-muted mx-auto mb-3 opacity-50" />
                 <h2 className="text-xl font-bold text-white">Initialize System</h2>
                 <p className="text-xs text-neuro-muted mt-1">Upload volumetric NIfTI data to begin</p>
               </div>
               <FileUploader onAnalysisComplete={setAnalysisData} />
            </div>
          ) : (
            <Dashboard 
              metrics={analysisData.metrics} 
              year={year} 
              setYear={setYear} 
              setAlert={setAlert} 
            />
          )}
        </section>

        {/* RIGHT STAGE (Visualization) */}
        <section className="flex-1 h-full relative rounded-xl overflow-hidden bg-black shadow-2xl group border border-neuro-card">
          
          {/* THE 3D VIEWER */}
          {analysisData ? (
            <>
              <NeuronViewer 
                data={analysisData.digital_twin} 
                year={year} 
                decayRate={analysisData.digital_twin.simulation_parameters.decay_coefficient}
              />
              
              {/* TOP RIGHT PROGNOSIS HUD (Overlay) */}
              <div className={`absolute top-6 right-6 z-30 max-w-sm backdrop-blur-md border-l-4 rounded-r-lg p-4 shadow-2xl transition-all duration-500 
                ${isCritical ? 'bg-neuro-critical/10 border-neuro-critical' : 'bg-slate-900/80 border-neuro-primary'}`}>
                
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'text-neuro-critical' : 'text-neuro-primary'}`}>
                    Live Prognosis
                  </span>
                  {isCritical && <AlertTriangle className="w-4 h-4 text-neuro-critical animate-pulse" />}
                </div>
                
                <div className="text-sm font-mono font-medium text-white leading-tight">
                  {getPrognosis()}
                </div>
                
                {/* Mini Stat Bar in HUD */}
                <div className="mt-3 flex gap-4 border-t border-white/10 pt-2">
                   <div>
                      <div className="text-[9px] text-neuro-muted uppercase">Synaptic Density</div>
                      <div className={`text-lg font-bold ${year > 5 ? 'text-neuro-critical' : 'text-neuro-safe'}`}>
                        {Math.max(0, 100 - (year * (isCritical ? 8 : 2))).toFixed(0)}%
                      </div>
                   </div>
                   <div>
                      <div className="text-[9px] text-neuro-muted uppercase">Network Latency</div>
                      <div className="text-lg font-bold text-white">
                        {Math.min(100, 20 + (year * 5)).toFixed(0)} ms
                      </div>
                   </div>
                </div>
              </div>
            </>
          ) : (
            // Placeholder Background
            <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#38bdf8_1px,_transparent_1px)] bg-[length:40px_40px] opacity-20"></div>
               <Activity className="w-24 h-24 text-neuro-primary opacity-20" />
            </div>
          )}
        </section>

      </main>

      <InfoModal 
        isOpen={alert.isOpen} 
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        content={alert.content}
        type={alert.type}
      />
    </div>
  );
}

export default App;
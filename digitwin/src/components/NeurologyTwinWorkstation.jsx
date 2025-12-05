import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../../Neurology-main/neuro-front/src/components/FileUploader';
import NeuronViewer from '../../Neurology-main/neuro-front/src/components/NeuronViewer';
import Dashboard from '../../Neurology-main/neuro-front/src/components/Dashboard';
import InfoModal from '../../Neurology-main/neuro-front/src/components/InfoModal';
import { Activity, MonitorPlay, AlertTriangle, ArrowLeft } from 'lucide-react';

const NeurologyTwinWorkstation = () => {
    const navigate = useNavigate();
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
        <div className="w-full h-screen flex flex-col bg-black text-white overflow-hidden font-sans">

            {/* HEADER */}
            <header className="h-14 shrink-0 border-b border-slate-800 bg-gray-900 flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="mr-2 p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bg-blue-500/10 p-1.5 rounded">
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-white">
                        NEURO<span className="text-blue-500">TWIN</span>
                        <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-widest font-normal">Clinical Simulator v2.1</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${analysisData ? 'bg-blue-500/10 border-blue-500/20' : 'bg-slate-800 border-slate-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${analysisData ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'}`}></div>
                        <span className="text-[10px] font-bold tracking-wider text-gray-300">{analysisData ? 'ACTIVE SESSION' : 'STANDBY'}</span>
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <main className="flex-1 flex p-4 gap-4 overflow-hidden relative">

                {/* LEFT SIDEBAR (Controls) */}
                <section className="w-[340px] shrink-0 flex flex-col gap-4 h-full z-10">
                    {!analysisData ? (
                        <div className="flex-1 bg-gray-900 rounded-xl shadow-2xl flex flex-col justify-center p-6 border border-gray-800">
                            <div className="text-center mb-6">
                                <MonitorPlay className="w-12 h-12 text-gray-500 mx-auto mb-3 opacity-50" />
                                <h2 className="text-xl font-bold text-white">Initialize System</h2>
                                <p className="text-xs text-gray-400 mt-1">Upload volumetric NIfTI data to begin</p>
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
                <section className="flex-1 h-full relative rounded-xl overflow-hidden bg-black shadow-2xl group border border-gray-800">

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
                ${isCritical ? 'bg-red-900/10 border-red-500' : 'bg-slate-900/80 border-blue-500'}`} style={{ right: '24px', top: '24px' }}>

                                <div className="flex items-start justify-between mb-1">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'text-red-500' : 'text-blue-500'}`}>
                                        Live Prognosis
                                    </span>
                                    {isCritical && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                </div>

                                <div className="text-sm font-mono font-medium text-white leading-tight">
                                    {getPrognosis()}
                                </div>

                                {/* Mini Stat Bar in HUD */}
                                <div className="mt-3 flex gap-4 border-t border-white/10 pt-2">
                                    <div>
                                        <div className="text-[9px] text-gray-400 uppercase">Synaptic Density</div>
                                        <div className={`text-lg font-bold ${year > 5 ? 'text-red-500' : 'text-green-500'}`}>
                                            {Math.max(0, 100 - (year * (isCritical ? 8 : 2))).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-gray-400 uppercase">Network Latency</div>
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
                            <Activity className="w-24 h-24 text-blue-500 opacity-20" />
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
};

export default NeurologyTwinWorkstation;

import React, { useEffect, useState } from 'react';
import SpecialtyCard3D from './SpecialtyCard3D';

const InitializationOverlay = ({ type, onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2; // 50 steps * 50ms = 2500ms total
            });
        }, 40);

        const timeout = setTimeout(() => {
            onComplete();
        }, 2500);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [onComplete]);

    const config = {
        cardiology: { title: 'Cardiology Core', color: '#ef4444', bg: 'bg-red-500' },
        neurology: { title: 'Neurology Core', color: '#a855f7', bg: 'bg-purple-500' },
        orthopedics: { title: 'Orthopaedics Core', color: '#3b82f6', bg: 'bg-blue-500' }, // Corrected key to match Dashboard
        pulmonology: { title: 'Pulmonology Core', color: '#14b8a6', bg: 'bg-teal-500' },
        drug_simulation: { title: 'Pharmacokinetics Engine', color: '#eab308', bg: 'bg-yellow-500' },
        cardiology_mri: { title: 'MRI Core', color: '#ef4444', bg: 'bg-red-500' }
    }[type] || { title: 'System Core', color: '#ffffff', bg: 'bg-white' };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
            {/* 3D Scene Container */}
            <div className="w-[800px] h-[600px] relative">
                <SpecialtyCard3D type={type} color={config.color} className="w-full h-full" />
            </div>

            <div className="text-center -mt-20 relative z-10">
                <h2 className="text-4xl font-light tracking-tight mb-8">
                    Initializing <span className={`font-bold ${config.color.replace('#', 'text-[#')}]`}>{config.title}</span>
                </h2>

                {/* Progress Bar */}
                <div className="h-1 w-96 bg-zinc-800 rounded-full overflow-hidden mx-auto">
                    <div
                        className={`h-full ${config.bg} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="mt-6 text-zinc-500 font-mono text-xs tracking-[0.2em] animate-pulse">
                    LOADING EHR DATA PATTERNS... {progress}%
                </p>
            </div>
        </div>
    );
};

export default InitializationOverlay;

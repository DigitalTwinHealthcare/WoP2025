import React, { useState } from 'react';
import { Activity, HeartPulse, Pill } from 'lucide-react';
import SpecialtyCard3D from './SpecialtyCard3D';

const CardiologySelection = ({ onSelect }) => {
    const [selectedType, setSelectedType] = useState(null);

    const handleSelection = (type) => {
        setSelectedType(type);
        onSelect(type);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50 z-0"></div>

            <div className="relative z-10 max-w-6xl w-full">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Cardiology Suite</h1>
                    <p className="text-gray-400 text-lg">Select a simulation environment to proceed</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">

                    {/* MRI Option */}
                    <div
                        onClick={() => handleSelection('mri')}
                        className="group relative h-96 rounded-3xl border border-white/10 bg-zinc-900/50 overflow-hidden cursor-pointer transition-all duration-500 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-900/20 hover:-translate-y-2"
                    >
                        <div className="absolute inset-0">
                            <SpecialtyCard3D type="cardiology_mri" color="#ef4444" />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8 flex flex-col justify-end">
                            <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                                        <HeartPulse className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold">MRI Twin</h2>
                                </div>
                                <p className="text-gray-400 leading-relaxed">
                                    Real-time cardiac analysis with 3D anatomical mapping and pathology detection.
                                </p>
                            </div>

                            <div className="mt-6 flex items-center text-red-500 font-bold tracking-wider text-sm uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                Initialize Engine <Activity className="ml-2 w-4 h-4 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Drug Simulation Option */}
                    <div
                        onClick={() => handleSelection('drug_sim')}
                        className="group relative h-96 rounded-3xl border border-white/10 bg-zinc-900/50 overflow-hidden cursor-pointer transition-all duration-500 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-900/20 hover:-translate-y-2"
                    >
                        <div className="absolute inset-0">
                            <SpecialtyCard3D type="drug_simulation" color="#eab308" />
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8 flex flex-col justify-end">
                            <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
                                        <Pill className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold">Drug Simulation</h2>
                                </div>
                                <p className="text-gray-400 leading-relaxed">
                                    Advanced pharmacokinetics modeling and molecular interaction analysis.
                                </p>
                            </div>

                            <div className="mt-6 flex items-center text-yellow-500 font-bold tracking-wider text-sm uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                Initialize Engine <Activity className="ml-2 w-4 h-4 animate-pulse" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CardiologySelection;

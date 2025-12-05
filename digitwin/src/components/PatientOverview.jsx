import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bone, Wind, Brain, Activity, ArrowRight } from 'lucide-react';
import SpecialtyCard3D from './SpecialtyCard3D';
import InitializationOverlay from './InitializationOverlay';

const PatientOverview = ({ patient }) => {
  const navigate = useNavigate();
  const [initializingSpecialty, setInitializingSpecialty] = useState(null);

  const handleNavigation = (path, type) => {
    setInitializingSpecialty(type);
  };

  const onInitializationComplete = () => {
    if (initializingSpecialty === 'pulmonology') {
      window.location.href = '/cancer5.html';
      return;
    }

    let path = '';
    if (initializingSpecialty === 'orthopedics') {
      path = '/orthotwin';
    } else if (initializingSpecialty === 'cardiology') {
      path = patient?.id ? `/patient/${patient.id}/cardiology` : '/cardiology';
    } else if (initializingSpecialty === 'neurology') {
      path = patient?.id ? `/patient/${patient.id}/neurology` : '/neurology';
    } else {
      // Fallback
      path = `/${initializingSpecialty}`;
    }

    navigate(path);
    setInitializingSpecialty(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Initialization Overlay */}
      {initializingSpecialty && (
        <InitializationOverlay
          type={initializingSpecialty}
          onComplete={onInitializationComplete}
        />
      )}

      <button
        onClick={() => navigate('/patients')}
        className="!bg-transparent !p-0 text-xs font-medium text-slate-400 hover:text-white mb-8 flex items-center transition-colors"
      >
        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
        Back to Patient List
      </button>

      <div className="mb-10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Patient Overview</h1>
            <p className="text-slate-400">Select a clinical specialty to access digital twin simulation</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 text-slate-300 text-xs font-mono px-4 py-2 rounded-full">
            PID: {patient?.id || 'N/A'}
          </div>
        </div>

        {/* Patient Quick Info Bar */}
        <div className="grid grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Patient Name</p>
            <p className="font-medium text-white">{patient?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Age / Gender</p>
            <p className="font-medium text-white">{patient?.age ? `${patient.age} Yrs` : 'N/A'} / {patient?.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="font-medium text-emerald-400">{patient?.status || 'Active'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Grid - Matching Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cardiology */}
        <div onClick={() => navigate(patient?.id ? `/patient/${patient.id}/cardiology` : '/cardiology')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-red-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
          <div className="h-48 w-full relative">
            <SpecialtyCard3D type="cardiology" color="#ef4444" className="w-full h-full bg-black" />
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h2 className="text-3xl font-bold text-white mb-3">Cardiology</h2>
            <p className="text-gray-400 leading-relaxed text-lg">Heart and cardiovascular system analysis with real-time digital twin simulation.</p>
            <div className="mt-auto pt-8 flex items-center text-red-500 font-bold tracking-wider text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              Launch Simulation <Activity className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Orthopaedics */}
        <div onClick={() => handleNavigation(null, 'orthopedics')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
          <div className="h-48 w-full relative">
            <SpecialtyCard3D type="orthopedics" color="#3b82f6" className="w-full h-full bg-black" />
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h2 className="text-3xl font-bold text-white mb-3">Orthopaedics</h2>
            <p className="text-gray-400 leading-relaxed text-lg">Advanced bone, joint, and muscle analysis with high-fidelity 3D skeletal modeling.</p>
            <div className="mt-auto pt-8 flex items-center text-blue-500 font-bold tracking-wider text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              Launch Simulation <Activity className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Pulmonology */}
        <div onClick={() => handleNavigation(null, 'pulmonology')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-teal-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
          <div className="h-48 w-full relative">
            <SpecialtyCard3D type="pulmonology" color="#14b8a6" className="w-full h-full bg-black" />
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h2 className="text-3xl font-bold text-white mb-3">Pulmonology</h2>
            <p className="text-gray-400 leading-relaxed text-lg">Comprehensive respiratory system analysis and dynamic lung function monitoring.</p>
            <div className="mt-auto pt-8 flex items-center text-teal-500 font-bold tracking-wider text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              Launch Simulation <Activity className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Neurology */}
        <div onClick={() => handleNavigation(null, 'neurology')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
          <div className="h-48 w-full relative">
            <SpecialtyCard3D type="neurology" color="#a855f7" className="w-full h-full bg-black" />
          </div>
          <div className="p-6 flex flex-col flex-grow">
            <h2 className="text-3xl font-bold text-white mb-3">Neurology</h2>
            <p className="text-gray-400 leading-relaxed text-lg">Brain activity mapping and nervous system analysis with neural simulations.</p>
            <div className="mt-auto pt-8 flex items-center text-purple-500 font-bold tracking-wider text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              Launch Simulation <Activity className="ml-2 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;

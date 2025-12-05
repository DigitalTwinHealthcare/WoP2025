import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bone, Wind, Brain, Activity } from 'lucide-react';
import Background3D from '../components/Background3D';
import SpecialtyCard3D from '../components/SpecialtyCard3D';
import InitializationOverlay from '../components/InitializationOverlay';

const Dashboard = () => {
  console.log("Dashboard v2.0 Loaded - 3D Grid Layout");
  const [recentPatients, setRecentPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeTwins: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, set empty state
    setLoading(false);
  }, []);

  const [initializingSpecialty, setInitializingSpecialty] = useState(null);
  const navigate = useNavigate();

  const handleNavigation = (path, type) => {
    setInitializingSpecialty(type);
  };

  const onInitializationComplete = () => {
    if (initializingSpecialty === 'pulmonology') {
      window.location.href = '/cancer5.html';
      return;
    }

    const path = {
      cardiology: '/cardiology',
      orthopedics: '/orthotwin',
      pulmonology: '/pulmonology',
      neurology: '/neurology'
    }[initializingSpecialty];

    navigate(path);
    setInitializingSpecialty(null);
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundColor: '#000000' }}>
      {/* Initialization Overlay */}
      {initializingSpecialty && (
        <InitializationOverlay
          type={initializingSpecialty}
          onComplete={onInitializationComplete}
        />
      )}

      {/* Hero Section */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* 3D Background */}
        <Background3D />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none" />

        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pointer-events-none">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tighter drop-shadow-lg">
            Digital Twin
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto drop-shadow-md font-light">
            Advanced 3D simulation and real-time patient monitoring for the future of healthcare.
          </p>
        </div>
      </div>

      {/* Specialty Grid Section */}
      <div className="relative z-20 bg-black py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Select a Specialty</h2>
            <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cardiology */}
            <div onClick={() => navigate('/cardiology')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-red-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
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
            <div onClick={() => handleNavigation('/orthotwin', 'orthopedics')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
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
            <div onClick={() => handleNavigation('/pulmonology', 'pulmonology')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-teal-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
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
            <div onClick={() => handleNavigation('/neurology', 'neurology')} className="cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-900/30 hover:-translate-y-2 flex flex-col bg-zinc-900">
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
      </div>
    </div>
  );
};

export default Dashboard;

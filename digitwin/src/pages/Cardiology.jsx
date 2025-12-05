import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CardiologyTwin from '../components/CardiologyTwin';
import DrugSimulation from '../components/DrugSimulation';
import CardiologySelection from '../components/CardiologySelection';
import InitializationOverlay from '../components/InitializationOverlay';

const Cardiology = () => {
  const { id } = useParams();
  const [view, setView] = useState('selection'); // 'selection', 'mri', 'drug_sim'
  const [initializingType, setInitializingType] = useState(null);

  const handleSelection = (type) => {
    // Map selection type to initialization type
    const initType = type === 'mri' ? 'cardiology_mri' : 'drug_simulation';
    setInitializingType(initType);
  };

  const handleInitializationComplete = () => {
    if (initializingType === 'cardiology_mri') {
      setView('mri');
    } else if (initializingType === 'drug_simulation') {
      setView('drug_sim');
    }
    setInitializingType(null);
  };

  if (initializingType) {
    return (
      <InitializationOverlay
        type={initializingType}
        onComplete={handleInitializationComplete}
      />
    );
  }

  if (view === 'mri') {
    return (
      <div className="relative w-full h-screen">
        <button
          onClick={() => setView('selection')}
          className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <CardiologyTwin />
      </div>
    );
  }

  if (view === 'drug_sim') {
    return (
      <div className="relative w-full h-screen">
        <button
          onClick={() => setView('selection')}
          className="absolute top-4 left-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <DrugSimulation patientId={id} />
      </div>
    );
  }

  return <CardiologySelection onSelect={handleSelection} />;
};

export default Cardiology;

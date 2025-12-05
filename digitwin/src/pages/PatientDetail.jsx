import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

import PatientOverview from '../components/PatientOverview';

const PatientDetail = ({ showOverview = false }) => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const data = await api.getPatient(id);
        setPatient(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching patient:", error);
        setError("Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dark-background">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-dark-primary mx-auto mb-4"></div>
            <p className="text-sm text-dark-secondary text-center">Loading patient data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-dark-background">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg inline-block">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark-background">
      <div className="flex-1 p-8">
        <PatientOverview patient={patient} />
      </div>
    </div>
  );
};

export default PatientDetail;

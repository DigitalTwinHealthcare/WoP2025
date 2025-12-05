import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Patients = () => {
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await api.getPatients();
        // Backend returns { patients: [...] }
        setAllPatients(response.patients || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("Failed to load patients. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handlePatientClick = (patientId) => {
    navigate(`/patient/${patientId}`);
  };

  return (
    <div className="flex min-h-screen #121212">
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-dark-primary mb-1">All Patients</h1>
              <p className="text-sm text-dark-secondary">Manage your patient digital twins</p>
            </div>
            <Link
              to="/new-patient"
              className="bg-dark-card border border-transparent dark:border-dark-border text-dark-primary px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-dark-border transition-colors"
            >
              New Patient
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Patients Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-dark-primary mx-auto mb-4"></div>
              <p className="text-sm text-dark-secondary">Loading patients...</p>
            </div>
          ) : allPatients.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
              <p className="text-sm text-dark-secondary mb-4">No patients found</p>
              <Link
                to="/new-patient"
                className="inline-block bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Create First Patient
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientClick(patient.id)}
                  className="bg-dark-card border border-dark-border rounded-lg p-5 hover:border-dark-muted transition-colors cursor-pointer hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-dark-primary mb-1">{patient.name}</h3>
                      <p className="text-sm text-dark-secondary">{patient.age} years old</p>
                    </div>
                    {/* We can check if a twin exists or just show details button */}

                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-dark-secondary">
                      <span className="font-medium mr-2">Gender:</span>
                      <span>{patient.gender}</span>
                    </div>
                    <div className="flex items-center text-sm text-dark-secondary">
                      <span className="font-medium mr-2">Created:</span>
                      <span>{new Date(patient.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center pt-4 border-t border-gray-200 dark:border-dark-border">
                    {patient.ehr_uploaded && (
                      <span className="inline-flex px-2.5 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                        EHR Synced
                      </span>
                    )}
                    <div className="ml-auto text-sm text-blue-400 font-bold uppercase tracking-wider hover:text-blue-300 transition-colors">
                      View Twin →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Patients;

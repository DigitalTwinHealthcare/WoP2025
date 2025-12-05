import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import PatientOverview from '../components/PatientOverview';

const NewPatient = () => {
  const [ehrFile, setEhrFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [patient, setPatient] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEhrFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!ehrFile) {
      alert('Please select an EHR file');
      return;
    }

    setIsUploading(true);

    try {
      // Send ONLY the file. The backend will extract name, age, etc.
      const createdPatient = await api.createPatient({
        file: ehrFile
      });

      setIsUploading(false);
      setIsUploaded(true);
      setPatient(createdPatient);

      // Navigate to patient overview
      navigate(`/patient/${createdPatient.id}`);

    } catch (error) {
      console.error("Error processing EHR:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      alert(`Failed to process EHR: ${errorMsg}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-background">
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-dark-primary mb-1">
              Upload Patient EHR
            </h1>
            <p className="text-sm text-dark-secondary">
              Upload patient electronic health records (CSV, JSON, XML) to automatically create a digital twin.
            </p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
            <div className="border-2 border-dashed border-dark-border rounded-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg
                  className="w-12 h-12 text-dark-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-dark-primary mb-1">
                Drag and drop your EHR file
              </h3>
              <p className="text-sm text-dark-secondary mb-4">
                Or click to browse files
              </p>
              <input
                type="file"
                id="ehr-upload"
                className="hidden"
                accept=".xml,.json,.fhir,.csv"
                onChange={handleFileChange}
              />
              <label
                htmlFor="ehr-upload"
                className="inline-block bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 cursor-pointer"
              >
                {isUploading ? 'Processing...' : 'Select File'}
              </label>
              {ehrFile && (
                <p className="mt-3 text-sm text-dark-secondary">
                  Selected: {ehrFile.name}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleFileUpload}
                disabled={!ehrFile || isUploading}
                className={`px-4 py-2 rounded-md text-sm font-medium ${!ehrFile || isUploading
                  ? 'bg-gray-300 text-dark-secondary cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
              >
                {isUploading ? 'Processing...' : 'Upload and Process'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPatient;

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { api } from '../../../../src/services/api';

const FileUploader = ({ onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Use the authenticated API service
      const data = await api.analyzeScan(file);

      // Pass data up to the main App
      onAnalysisComplete(data);
    } catch (err) {
      console.error(err);
      setError("Analysis Failed. Ensure Backend is running and you are logged in.");
    } finally {
      setLoading(false);
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/gzip': ['.gz'], 'application/octet-stream': ['.nii'] }
  });

  return (
    <div className="h-full flex flex-col justify-center p-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDragActive ? 'border-medical-accent bg-medical-panel/50' : 'border-slate-600 hover:border-medical-accent'}
        `}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-medical-accent animate-spin mb-4" />
            <p className="text-medical-accent font-medium">Analyzing Volumetric Data...</p>
            <p className="text-xs text-slate-400 mt-2">Parsing NIfTI Header & Calculating Atrophy</p>
          </div>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-lg font-medium">Drag & Drop MRI Scan</p>
            <p className="text-sm text-slate-400 mt-1">Supports .nii.gz (NIfTI)</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
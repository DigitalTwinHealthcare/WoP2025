import React from 'react';
import { useParams } from 'react-router-dom';
import { patient, patientStats } from '../data/patientData';

const PatientOverview = () => {
  const { id } = useParams();

  const StatCard = ({ title, value, icon }) => (
    <div className="bg-dark-card p-6 rounded-lg shadow-sm border border-dark-border">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-dark-border text-dark-primary mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-dark-secondary">{title}</p>
          <p className="text-2xl font-semibold text-dark-primary">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-primary">Patient Overview</h1>
        <p className="text-dark-secondary">Detailed information about the patient</p>
      </div>

      {/* Patient Info Card */}
      <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-dark-border flex items-center justify-center text-2xl font-bold text-dark-secondary">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-dark-primary">{patient.name}</h2>
              <div className="flex items-center text-sm text-dark-secondary mt-1">
                <span>{patient.age} years • {patient.gender}</span>
                <span className="mx-2">•</span>
                <span>ID: {patient.id}</span>
              </div>
              <div className="flex items-center text-sm text-dark-secondary mt-1">
                <span>Blood Type: {patient.bloodType}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-secondary">Last Visit</p>
            <p className="font-medium">{patient.lastVisit}</p>
            <p className="text-sm text-dark-secondary mt-1">Next Appointment</p>
            <p className="font-medium text-blue-600">{patient.nextAppointment}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Appointments"
          value={patientStats.appointments}
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8 7a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm1 3a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" fillRule="evenodd" /></svg>}
        />
        <StatCard
          title="Prescriptions"
          value={patientStats.prescriptions}
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M7.707 3.293a1 1 0 010 1.414L6.414 6l1.293 1.293a1 1 0 11-1.414 1.414L5 7.414l-1.293 1.293a1 1 0 11-1.414-1.414L3.586 6 2.293 4.707a1 1 0 011.414-1.414L5 4.586l1.293-1.293a1 1 0 011.414 0z" /><path d="M18 10a1 1 0 01-1 1h-7a1 1 0 110-2h7a1 1 0 011 1z" /></svg>}
        />
        <StatCard
          title="Tests"
          value={patientStats.tests}
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" /></svg>}
        />
        <StatCard
          title="Conditions"
          value={patientStats.conditions}
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" /></svg>}
        />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medical Info */}
        <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border p-6">
          <h3 className="text-lg font-medium text-dark-primary mb-4">Medical Information</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-dark-secondary">Conditions</h4>
              <div className="mt-1">
                {patient.conditions.map((condition, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 mb-2">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-dark-secondary">Medications</h4>
              <ul className="mt-1 space-y-1">
                {patient.medications.map((med, index) => (
                  <li key={index} className="text-sm text-gray-700">• {med}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-dark-secondary">Allergies</h4>
              <div className="mt-1">
                {patient.allergies.map((allergy, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border p-6">
          <h3 className="text-lg font-medium text-dark-primary mb-4">Vital Signs</h3>
          <div className="space-y-4">
            {Object.entries(patient.vitals).map(([key, value]) => (
              <div key={key} className="border-b border-dark-border pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-dark-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-medium text-dark-primary">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Visits */}
        <div className="bg-dark-card rounded-lg shadow-sm border border-dark-border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-dark-primary">Recent Visits</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
          </div>
          <div className="space-y-4">
            {patient.recentVisits.map((visit, index) => (
              <div key={index} className="border-b border-dark-border pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-dark-primary">{visit.reason}</p>
                    <p className="text-xs text-dark-secondary">{visit.date}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {visit.diagnosis}
                  </span>
                </div>
                {visit.notes && (
                  <p className="mt-1 text-sm text-dark-secondary">{visit.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;

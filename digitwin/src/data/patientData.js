export const patient = {
  id: 'P12345',
  name: 'John Doe',
  age: 42,
  gender: 'Male',
  bloodType: 'A+',
  height: '175 cm',
  weight: '78 kg',
  lastVisit: '2023-11-15',
  nextAppointment: '2023-12-20',
  conditions: ['Hypertension', 'Type 2 Diabetes'],
  medications: ['Lisinopril 10mg', 'Metformin 500mg'],
  allergies: ['Penicillin', 'Sulfa'],
  contact: {
    phone: '(555) 123-4567',
    email: 'john.doe@example.com',
    address: '123 Main St, Anytown, USA'
  },
  vitals: {
    bloodPressure: '120/80',
    heartRate: '72 bpm',
    temperature: '98.6°F',
    oxygenSaturation: '98%'
  },
  recentVisits: [
    {
      date: '2023-11-15',
      reason: 'Routine Checkup',
      diagnosis: 'Stable condition',
      notes: 'Patient reports feeling well. No new concerns.'
    },
    {
      date: '2023-09-10',
      reason: 'Follow-up',
      diagnosis: 'Hypertension',
      notes: 'Blood pressure well-controlled with current medication.'
    }
  ]
};

export const patientStats = {
  appointments: 12,
  prescriptions: 5,
  tests: 8,
  conditions: 2
};

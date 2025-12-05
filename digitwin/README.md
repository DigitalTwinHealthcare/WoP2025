# Digital Twin Healthcare - Frontend

A modern React-based frontend application for managing patient digital twins in healthcare. This system allows clinicians to create virtual replicas of patients, upload EHR data, and simulate treatment plans to predict outcomes.

## Features

- **Login/Dashboard**: Secure login page with dashboard showing recent patients and statistics
- **Patient Management**: View all patients and their digital twin status
- **New Patient Creation**: Multi-step form to create new digital twins with EHR upload
- **Treatment Simulation**: Configure drug treatments (dosage, route, frequency) and simulate effects
- **3D Visualization Space**: Reserved area for heart 3D visualization (to be integrated)
- **Reports**: View and manage patient reports and analyses

## Tech Stack

- **React 19** - UI framework
- **React Router** - Client-side routing
- **Firebase Authentication** - User authentication
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project (for authentication)

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
3. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and copy the config values
4. Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase (see Firebase Setup above)

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   └── Sidebar.jsx          # Navigation sidebar component
├── pages/
│   ├── Login.jsx            # Login page
│   ├── Dashboard.jsx       # Main dashboard with recent patients
│   ├── Patients.jsx        # All patients list
│   ├── NewPatient.jsx      # Create new patient/twin with EHR upload
│   ├── PatientDetail.jsx   # Patient detail page with treatment simulation
│   └── Reports.jsx         # Reports page
├── App.jsx                  # Main app component with routing
├── main.jsx                 # Entry point
└── index.css               # Global styles with Tailwind

```

## Pages & Routes

- `/login` - Login page with Firebase authentication (default route for unauthenticated users)
- `/dashboard` - Main dashboard (protected route)
- `/patients` - All patients list (protected route)
- `/new-patient` - Create new digital twin (protected route)
- `/patient/:id` - Patient detail and treatment simulation (protected route)
- `/reports` - Recent reports (protected route)

All routes except `/login` are protected and require authentication.

## Mock Data

Currently, the application uses mock data for demonstration purposes. To integrate with a real backend:

1. Replace mock data arrays in each component with API calls
2. Update form submission handlers to send data to your backend
3. Connect the 3D visualization space to your visualization service
4. Implement real authentication and authorization

## Customization

### Doctor Name

The doctor name in the sidebar can be changed by modifying the `doctorName` prop in the `Sidebar` component or by passing it from a parent component.

### Adding New Drugs

To add more drugs to the treatment simulation:

1. Edit `PatientDetail.jsx`
2. Add new options to the drug select dropdown
3. Update the drug information display accordingly

### Styling

The application uses Tailwind CSS. Customize colors and styles in:
- `tailwind.config.js` - Theme configuration
- Individual component files - Component-specific styles

## Future Enhancements

- [ ] Integrate 3D heart visualization
- [ ] Connect to backend API for real data
- [ ] Add authentication and authorization
- [ ] Implement real-time updates
- [ ] Add more treatment options and drugs
- [ ] Enhanced analytics and reporting
- [ ] Patient data export functionality

## License

This project is part of the Digital Twins for Healthcare system.

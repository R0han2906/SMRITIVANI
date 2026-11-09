import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/caregiver/Dashboard";
import DailyLog from "./pages/caregiver/DailyLog";
import EmergencyAlert from "./pages/caregiver/EmergencyAlert";
import MemoryBank from "./pages/caregiver/MemoryBank";
import Settings from "./pages/caregiver/Settings";
import VoiceNotes from "./pages/caregiver/VoiceNotes";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import ElderlyHome from "./pages/elderly/ElderlyHome";
import Listening from "./pages/elderly/Listening";
import AISpeaking from "./pages/elderly/AISpeaking";
import Medicine from "./pages/elderly/Medicine";
import Events from "./pages/elderly/Events";
import Family from "./pages/elderly/Family";
import Activities from "./pages/elderly/Activities";
import Emergency from "./pages/elderly/Emergency";
import Recap from "./pages/elderly/Recap";
import Bhajan from "./pages/elderly/Bhajan";
import ProtectedRoute from "./components/ProtectedRoute";
import CaregiverEvents from "./pages/caregiver/Events";
import PatientDeviceRoute from "./components/PatientDeviceRoute";
import PatientSessionExpired from "./pages/PatientSessionExpired";
import ClaimCodeEntry from "./pages/elderly/ClaimCodeEntry";
import { useDevice } from "./context/DeviceContext";

function EntryRoute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const device = useDevice();
  
  // Smart routing: Determine initial route based on device pairing and auth state
  // Priority: device.loading → auth.loading → caregiver.JWT (priority over device) → device.paired → device.needsPairing → welcome
  // This ensures: (1) Fresh loads see welcome, (2) Paired devices route directly to conversation,
  // (3) Caregivers always reach dashboard if authenticated, (4) Device token-based auth works
  
  // Step 1: Device context loading?
  if (device.isLoading) return <main className="flex min-h-screen items-center justify-center bg-cream text-lg font-bold text-ink">Connecting SmritiVani…</main>;
  
  // Step 2: Auth loading?
  if (authLoading) return <main className="flex min-h-screen items-center justify-center bg-cream text-lg font-bold text-ink">Loading SmritiVani…</main>;
  
  // Step 3: Caregiver auth FIRST (prioritize JWT over device token to prevent device data interference)
  if (isAuthenticated && user?.account_type === "caregiver") return <Navigate to="/caregiver/dashboard" replace />;
  
  // Step 4: Device paired? Route elderly directly to conversation
  if (device.isPaired) return <ElderlyHome />;
  
  // Step 5: Device needs pairing? Route to code entry
  if (device.requiresPairing) return <Navigate to="/elderly/pair" replace />;
  
  // Step 6: Fresh user
  return <Welcome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EntryRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/patient-session-expired" element={<PatientSessionExpired />} />
        <Route path="/elderly/pair" element={<ClaimCodeEntry />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/caregiver/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/caregiver" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/caregiver/events" element={<ProtectedRoute><CaregiverEvents /></ProtectedRoute>} />
        <Route path="/caregiver/memory" element={<ProtectedRoute><MemoryBank /></ProtectedRoute>} />
        <Route path="/caregiver/notes" element={<ProtectedRoute><VoiceNotes /></ProtectedRoute>} />
        <Route path="/caregiver/emergency" element={<ProtectedRoute><EmergencyAlert /></ProtectedRoute>} />
        <Route path="/caregiver/log" element={<ProtectedRoute><DailyLog /></ProtectedRoute>} />
        <Route path="/caregiver/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/elderly" element={<PatientDeviceRoute><ElderlyHome /></PatientDeviceRoute>} />
        <Route path="/elderly/listening" element={<PatientDeviceRoute><Listening /></PatientDeviceRoute>} />
        <Route path="/elderly/speaking" element={<PatientDeviceRoute><AISpeaking /></PatientDeviceRoute>} />
        <Route path="/elderly/medicine" element={<PatientDeviceRoute><Medicine /></PatientDeviceRoute>} />
        <Route path="/elderly/events" element={<PatientDeviceRoute><Events /></PatientDeviceRoute>} />
        <Route path="/elderly/family" element={<PatientDeviceRoute><Family /></PatientDeviceRoute>} />
        <Route path="/elderly/activities" element={<PatientDeviceRoute><Activities /></PatientDeviceRoute>} />
        <Route path="/elderly/bhajan" element={<PatientDeviceRoute><Bhajan /></PatientDeviceRoute>} />
        <Route path="/elderly/emergency" element={<PatientDeviceRoute><Emergency /></PatientDeviceRoute>} />
        <Route path="/elderly/recap" element={<PatientDeviceRoute><Recap /></PatientDeviceRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

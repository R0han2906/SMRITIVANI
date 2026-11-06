import { BrowserRouter, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/caregiver" element={<Dashboard />} />
        <Route path="/caregiver/memory" element={<MemoryBank />} />
        <Route path="/caregiver/notes" element={<VoiceNotes />} />
        <Route path="/caregiver/emergency" element={<EmergencyAlert />} />
        <Route path="/caregiver/log" element={<DailyLog />} />
        <Route path="/caregiver/settings" element={<Settings />} />
        <Route path="/elderly" element={<ElderlyHome />} />
        <Route path="/elderly/listening" element={<Listening />} />
        <Route path="/elderly/speaking" element={<AISpeaking />} />
        <Route path="/elderly/medicine" element={<Medicine />} />
        <Route path="/elderly/events" element={<Events />} />
        <Route path="/elderly/family" element={<Family />} />
        <Route path="/elderly/activities" element={<Activities />} />
        <Route path="/elderly/emergency" element={<Emergency />} />
        <Route path="/elderly/recap" element={<Recap />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Unauthorized from './pages/Unauthorized';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PatientManagement from './pages/admin/PatientManagement';
import MedicationManagement from './pages/admin/MedicationManagement';
import ReportsAnalytics from './pages/admin/ReportsAnalytics';
import SystemSettings from './pages/admin/SystemSettings';

// Info Desk
import InfoDeskLayout from './components/info-desk/InfoDeskLayout';
import InfoDeskDashboard from './pages/info-desk/InfoDeskDashboard';
import PatientRegistration from './pages/info-desk/PatientRegistration';
import AdmissionManagement from './pages/info-desk/AdmissionManagement';
import PatientMonitoring from './pages/info-desk/PatientMonitoring';
import PrescriptionManagement from './pages/info-desk/PrescriptionManagement';
import QrCodeManagement from './pages/info-desk/QrCodeManagement';
import BillingExpenses from './pages/info-desk/BillingExpenses';

// Doctor
import DoctorLayout from './components/doctor/DoctorLayout';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientRecords from './pages/doctor/PatientRecords';
import Consultations from './pages/doctor/Consultations';
import Prescriptions from './pages/doctor/Prescriptions';
import MedicationPlans from './pages/doctor/MedicationPlans';
import Adherence from './pages/doctor/Adherence';

// Nurse
import NurseLayout from './components/nurse/NurseLayout';
import NurseDashboard from './pages/nurse/NurseDashboard';
import AssignedPatients from './pages/nurse/AssignedPatients';
import MedAdministration from './pages/nurse/MedAdministration';
import QrScanner from './pages/nurse/QrScanner';
import MedMonitoring from './pages/nurse/MedMonitoring';
import AlertCenter from './pages/nurse/AlertCenter';

// Patient
import PatientLayout from './components/patient/PatientLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import MyPrescriptions from './pages/patient/MyPrescriptions';
import MedicationSchedule from './pages/patient/MedicationSchedule';
import QrBinding from './pages/patient/QrBinding';
import AdherenceHistory from './pages/patient/AdherenceHistory';

// ─── Placeholder dashboards (replaced with real pages later) ───────
function PlaceholderDash({ role }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const roleColors = {
    admin:     '#a78bfa',
    info_desk: '#38bdf8',
    doctor:    '#34d399',
    nurse:     '#fb923c',
    patient:   '#f472b6',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060b18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: 'rgba(15,23,42,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '3rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          {role === 'admin' ? '⚙️' : role === 'info_desk' ? '🗂️' : role === 'doctor' ? '🩺' : role === 'nurse' ? '💉' : '💊'}
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: roleColors[role] || '#38bdf8',
          marginBottom: '0.5rem',
          textTransform: 'capitalize',
        }}>
          {role.replace('_', ' ')} Dashboard
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
          This module is under construction. Check back soon!
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.7rem 2rem',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/login"        element={<AuthPage />} />
          <Route path="/register"     element={<AuthPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Admin (nested) ── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index               element={<AdminDashboard />} />
            <Route path="users"        element={<UserManagement />} />
            <Route path="patients"     element={<PatientManagement />} />
            <Route path="medications"  element={<MedicationManagement />} />
            <Route path="reports"      element={<ReportsAnalytics />} />
            <Route path="settings"     element={<SystemSettings />} />
          </Route>

          {/* ── Information Desk (nested) ── */}
          <Route path="/info-desk" element={
            <ProtectedRoute allowedRoles={['info_desk', 'admin']}>
              <InfoDeskLayout />
            </ProtectedRoute>
          }>
            <Route index               element={<InfoDeskDashboard />} />
            <Route path="registration" element={<PatientRegistration />} />
            <Route path="admissions"   element={<AdmissionManagement />} />
            <Route path="monitoring"   element={<PatientMonitoring />} />
            <Route path="prescriptions" element={<PrescriptionManagement />} />
            <Route path="qr-codes"     element={<QrCodeManagement />} />
            <Route path="billing"      element={<BillingExpenses />} />
          </Route>

          {/* ── Doctor (nested) ── */}
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor', 'admin']}>
              <DoctorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DoctorDashboard />} />
            <Route path="patients" element={<PatientRecords />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="prescriptions" element={<Prescriptions />} />
            <Route path="medication-plans" element={<MedicationPlans />} />
            <Route path="adherence" element={<Adherence />} />
          </Route>

          {/* ── Nurse (nested) ── */}
          <Route path="/nurse" element={
            <ProtectedRoute allowedRoles={['nurse', 'admin']}>
              <NurseLayout />
            </ProtectedRoute>
          }>
            <Route index element={<NurseDashboard />} />
            <Route path="patients" element={<AssignedPatients />} />
            <Route path="administration" element={<MedAdministration />} />
            <Route path="scanner" element={<QrScanner />} />
            <Route path="monitoring" element={<MedMonitoring />} />
            <Route path="alerts" element={<AlertCenter />} />
          </Route>

          {/* ── Patient (nested) ── */}
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient', 'admin']}>
              <PatientLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PatientDashboard />} />
            <Route path="prescriptions" element={<MyPrescriptions />} />
            <Route path="schedule" element={<MedicationSchedule />} />
            <Route path="qr" element={<QrBinding />} />
            <Route path="history" element={<AdherenceHistory />} />
          </Route>

          {/* ── Default ── */}
          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

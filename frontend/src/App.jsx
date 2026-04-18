import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PublicSurvey from './pages/PublicSurvey';
import Questions from './pages/Questions';
import Reports from './pages/Reports';
import Responses from './pages/Responses';
import ResponseDetails from './pages/ResponseDetails';
import Sectors from './pages/Sectors';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSurvey />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="responses" element={<Responses />} />
          <Route path="responses/:id" element={<ResponseDetails />} />
          <Route path="sectors" element={<Sectors />} />
          <Route path="questions" element={<Questions />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

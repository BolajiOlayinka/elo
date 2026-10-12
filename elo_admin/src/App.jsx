import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PointSettings from './pages/PointSettings.jsx';
import Roles from './pages/Roles.jsx';
import Settings from './pages/Settings.jsx';
import Staffs from './pages/Staffs.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Users from './pages/Users.jsx';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="points" element={<PointSettings />} />
        <Route path="staffs" element={<Staffs />} />
        <Route path="roles" element={<Roles />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

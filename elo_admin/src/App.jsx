import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { Layout } from './components/Layout.jsx';
import Blog from './pages/Blog.jsx';
import BlogTaxonomy from './pages/BlogTaxonomy.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import PointSettings from './pages/PointSettings.jsx';
import Roles from './pages/Roles.jsx';
import Settings from './pages/Settings.jsx';
import Staffs from './pages/Staffs.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Users from './pages/Users.jsx';
import './App.css';

const BlogEditor = lazy(() => import('./pages/BlogEditor.jsx'));
const BlogPreview = lazy(() => import('./pages/BlogPreview.jsx'));

function EditorFallback() {
  return <p className="muted">Loading Milkdown…</p>;
}

function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserProfile />} />
          <Route path="points" element={<PointSettings />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/categories" element={<BlogTaxonomy key="categories" type="categories" />} />
          <Route path="blog/tags" element={<BlogTaxonomy key="tags" type="tags" />} />
          <Route
            path="blog/new"
            element={(
              <Suspense fallback={<EditorFallback />}>
                <BlogEditor />
              </Suspense>
            )}
          />
          <Route
            path="blog/:id/edit"
            element={(
              <Suspense fallback={<EditorFallback />}>
                <BlogEditor />
              </Suspense>
            )}
          />
          <Route
            path="blog/:id"
            element={(
              <Suspense fallback={<p className="muted">Loading preview…</p>}>
                <BlogPreview />
              </Suspense>
            )}
          />
          <Route path="staffs" element={<Staffs />} />
          <Route path="roles" element={<Roles />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

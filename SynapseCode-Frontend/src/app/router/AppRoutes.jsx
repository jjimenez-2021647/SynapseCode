import { Routes, Route } from 'react-router-dom'
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { DashboardPage } from '../layouts/DasboardPage.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            {/* RUTAS PUBLICAS */}
            <Route path="/" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />

            {/* PROTECTED ROUTES */}
            <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
    )
}

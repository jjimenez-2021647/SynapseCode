import { Routes, Route } from 'react-router-dom'
import { MainPage } from '../../features/main-page';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { DashboardPage } from '../layouts/DasboardPage.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage.jsx';

export const AppRoutes = () => {
    return (
        <Routes>
            {/* RUTAS PUBLICAS */}
            <Route path="/" element={<MainPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* PROTECTED ROUTES */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["ADMIN_ROLE"]}>
                            <DashboardPage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            >
                {/* Aquí puedes agregar rutas hijas para el dashboard */}
            </Route>
        </Routes>
    )
}

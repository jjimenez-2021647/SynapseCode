import { Routes, Route } from 'react-router-dom'
import { MainPage } from '../../features/main-page';
import { AuthPage } from '../../features/auth/pages/AuthPage.jsx';
import { AdminDashboardPage } from '../layouts/AdminDashboardPage.jsx';
import { DashboardPage } from '../layouts/DasboardPage.jsx';
import { VerifyEmailPage } from '../../features/auth/pages/VerifyEmailPage.jsx';
import { ResetPasswordPage } from '../../features/auth/pages/ResetPasswordPage.jsx';
import { RoleGuard } from './RoleGuard.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { UnauthorizedPage } from '../../features/auth/pages/UnauthorizedPage.jsx';
import { PricingPage } from '../../features/pricing-page/PricingPage.jsx';
import { ProfilePage } from '../../features/profile-page/index.js';
import { CodeSessionsPage } from '../../features/codeSessions-page/index.js';

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
                path="/pricing-page"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["USER_ROLE"]}>
                            <PricingPage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/profile-page"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["USER_ROLE", "ORG_ROLE", "ADMIN_ROLE"]}>
                            <ProfilePage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["USER_ROLE", "ORG_ROLE"]}>
                            <DashboardPage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/codeSessions-page/:roomId"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["USER_ROLE", "ORG_ROLE", "ADMIN_ROLE"]}>
                            <CodeSessionsPage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin-dashboard"
                element={
                    <ProtectedRoute>
                        <RoleGuard allowedRoles={["ADMIN_ROLE"]}>
                            <AdminDashboardPage />
                        </RoleGuard>
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}

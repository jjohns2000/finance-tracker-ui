import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavProvider } from './context/NavContext';
import { SnackbarProvider } from './context/SnackbarContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import IncomePage from './pages/IncomePage';
import ExpensePage from './pages/ExpensePage';
import BudgetPage from './pages/BudgetPage';
import SettingsPage from './pages/SettingsPage';
import BankInfoPage from './pages/BankInfoPage';


function App() {
    return (
        <BrowserRouter>
            <SnackbarProvider>
                <SidebarProvider>
                    <AuthProvider>
                        <NavProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <DashboardPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/income" element={
                                    <ProtectedRoute>
                                        <IncomePage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/expense" element={
                                    <ProtectedRoute>
                                        <ExpensePage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/budget" element={
                                    <ProtectedRoute>
                                        <BudgetPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/settings" element={
                                    <ProtectedRoute>
                                        <SettingsPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/bank-info" element={
                                    <ProtectedRoute>
                                        <BankInfoPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="*" element={<Navigate to="/login" replace />} />
                            </Routes>
                        </NavProvider>
                    </AuthProvider>
                </SidebarProvider>
            </SnackbarProvider>
        </BrowserRouter>
    );
}

export default App;
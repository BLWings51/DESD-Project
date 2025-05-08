import { useAuth } from './authContext';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingOverlay } from '@mantine/core';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    console.log(isAuthenticated);

    if (isLoading) {
        return <LoadingOverlay visible />;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
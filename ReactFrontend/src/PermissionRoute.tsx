import { useAuth } from './authContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingOverlay, Text, Center } from '@mantine/core';
import { useEffect, useState } from 'react';
import apiRequest from './api/apiRequest';

interface PermissionRouteProps {
    requiredPermission: 'admin' | 'society_admin' | 'member';
    societyName?: string;
}

const PermissionRoute = ({ requiredPermission, societyName }: PermissionRouteProps) => {
    const { isAuthenticated, isLoading, loggedAccountID } = useAuth();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkPermission = async () => {
            if (!isAuthenticated || !loggedAccountID) {
                setHasPermission(false);
                setIsChecking(false);
                return;
            }

            try {
                if (requiredPermission === 'admin') {
                    const response = await apiRequest<{ admin: boolean }>({
                        endpoint: '/admin_check/',
                        method: 'POST',
                    });
                    setHasPermission(response.data?.admin || false);
                } else if (requiredPermission === 'society_admin' && societyName) {
                    const response = await apiRequest<{ "Society Admin": boolean }>({
                        endpoint: `/Societies/${societyName}/IsSocietyAdmin/`,
                        method: 'POST',
                    });
                    setHasPermission(response.data?.["Society Admin"] || false);
                } else if (requiredPermission === 'member' && societyName) {
                    // For member permission, we'll check if they're a member of the society
                    const response = await apiRequest<{ is_member: boolean }>({
                        endpoint: `/Societies/${societyName}/`,
                        method: 'GET',
                    });
                    setHasPermission(response.data?.is_member || false);
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                setHasPermission(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkPermission();
    }, [isAuthenticated, loggedAccountID, requiredPermission, societyName]);

    if (isLoading || isChecking) {
        return <LoadingOverlay visible />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!hasPermission) {
        return (
            <Center style={{ height: '100vh' }}>
                <Text size="xl" c="red">You don't have permission to access this page.</Text>
            </Center>
        );
    }

    return <Outlet />;
};

export default PermissionRoute; 
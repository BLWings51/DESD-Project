import { useAuth } from './authContext';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { LoadingOverlay, Text, Center } from '@mantine/core';
import { useEffect, useState } from 'react';
import apiRequest from './api/apiRequest';

interface PermissionRouteProps {
    requiredPermission: 'admin' | 'society_admin' | 'member';
}

const PermissionRoute = ({ requiredPermission }: PermissionRouteProps) => {
    const { isAuthenticated, isLoading, loggedAccountID } = useAuth();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const location = useLocation();
    const { society_name } = useParams<{ society_name: string }>();

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
                } else if (requiredPermission === 'society_admin' && society_name) {
                    const response = await apiRequest<{ "Society Admin": boolean }>({
                        endpoint: `/Societies/${society_name}/IsSocietyAdmin/`,
                        method: 'POST',
                    });
                    setHasPermission(response.data?.["Society Admin"] || false);
                } else if (requiredPermission === 'member' && society_name) {
                    // For member permission, we'll check if they're a member of the society
                    const response = await apiRequest<{ success: boolean }>({
                        endpoint: `/${society_name}/${loggedAccountID}/`,
                        method: 'GET',
                    });
                    setHasPermission(response.data?.success || false);
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                setHasPermission(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkPermission();
    }, [isAuthenticated, loggedAccountID, requiredPermission, society_name]);

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
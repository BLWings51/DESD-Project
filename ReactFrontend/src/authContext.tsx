import { createContext, useContext, useState, useEffect } from 'react';
import apiRequest from './api/apiRequest';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const response = await apiRequest<{ authenticated: boolean }>({
                endpoint: '/authenticated/',
                method: 'POST',
            });
            setIsAuthenticated(response.data?.authenticated || false);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await apiRequest({
                endpoint: '/login/',
                method: 'POST',
                data: { email, password },
            });
            await checkAuth(); // Verify auth status after login
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await apiRequest({
                endpoint: '/logout/',
                method: 'POST',
            });
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial auth check - only run once
    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
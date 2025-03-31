import { createContext, useContext, useState, useEffect } from 'react';
import apiRequest from './api/apiRequest';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    loggedAccountID: string | null;
    checkAuth: () => Promise<void>;
    login: (accountID: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loggedAccountID, setLoggedAccountID] = useState<string | null>(null);

    const checkAuth = async () => {
        setIsLoading(true);
        try {
            const response = await apiRequest<{ authenticated: boolean; accountID?: string }>({
                endpoint: '/authenticated/',
                method: 'POST',
            });

            if (response.data?.authenticated && response.data.accountID) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                setLoggedAccountID(null);
            }
        } catch (error) {
            setIsAuthenticated(false);
            setLoggedAccountID(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (accountID: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await apiRequest({
                endpoint: '/login/',
                method: 'POST',
                data: { accountID, password },
            });

            if (response.error) {
                throw new Error(response.message || "Login failed");
            }

            setLoggedAccountID(accountID);
            setIsAuthenticated(true);
            // Don't need to call checkAuth() here since we're setting the state directly
        } catch (error) {
            setIsAuthenticated(false);
            setLoggedAccountID(null);
            throw error; // Re-throw the error to be caught by the Login component
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
            setLoggedAccountID(null); // Reset account ID on logout
        } finally {
            setIsLoading(false);
        }
    };

    // Initial auth check - only run once
    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, loggedAccountID, checkAuth, login, logout }}>
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

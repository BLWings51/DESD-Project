import React, { createContext, useContext, useState, useEffect } from 'react';
import apiRequest from './api/apiRequest';
import { refreshAccessToken } from './api/auth';

interface UserProfile {
    accountID: number;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    pfp: string | null;
    is_owner: boolean;
    societies: string[];
    events: string[];
    [key: string]: any;
}

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
        try {
            const response = await apiRequest<{ authenticated: boolean; accountID?: string }>({
                endpoint: '/authenticated/',
                method: 'POST',
            });
            console.log(response.data);

            if (response.data?.authenticated && response.data.accountID) {
                console.log("authenticated");
                setIsAuthenticated(true);
                setLoggedAccountID(response.data.accountID);
            } else {
                console.log("not authenticated");
                setIsAuthenticated(false);
                setLoggedAccountID(null);
            }
        } catch {
            console.log("error");
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
                throw new Error(response.message || 'Login failed');
            }

            setIsAuthenticated(true);
            setLoggedAccountID(accountID);
        } catch (err) {
            setIsAuthenticated(false);
            setLoggedAccountID(null);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await apiRequest({ endpoint: '/logout/', method: 'POST' });
            setIsAuthenticated(false);
            setLoggedAccountID(null);
        } finally {
            setIsLoading(false);
        }
    };

    // On mount, refresh token first, then check auth
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                console.log("refreshed");
                await checkAuth();
            } else {
                console.log("not refreshed");
                setIsAuthenticated(false);
                setLoggedAccountID(null);
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                loggedAccountID,
                checkAuth,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

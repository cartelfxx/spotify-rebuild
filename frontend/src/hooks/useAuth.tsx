import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const storedToken = localStorage.getItem('spotify_token');
    if (storedToken) {
      setToken(storedToken);

      authAPI.getCurrentUser(storedToken)
        .then((response) => {
          if (response.user) {
            setUser(response.user);
          } else {

            localStorage.removeItem('spotify_token');
            setToken(null);
          }
        })
        .catch(() => {

          localStorage.removeItem('spotify_token');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.login(email, password);
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('spotify_token', response.token);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.register(username, email, password);
      console.log('Register response:', response); // Debug için
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('spotify_token', response.token);
        return { success: true };
      }
      

      if (response.message) {
        console.error('Registration failed:', response.message);
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spotify_token');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
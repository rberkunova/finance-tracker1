// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as apiLoginUser, registerUser as apiRegisterUser } from '../services/userService';
import { User, LoginApiResponse, RegisterApiResponse } from '../types/types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterApiResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  initialLoading: boolean; // Для початкового завантаження стану з localStorage
  operationLoading: boolean; // Для асинхронних операцій (логін, реєстрація)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserJson = localStorage.getItem('user');
    let parsedUser: User | null = null;

    if (storedUserJson) {
      try {
        parsedUser = JSON.parse(storedUserJson);
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem('user');
      }
    }

    if (storedToken && parsedUser && parsedUser.id) {
      setToken(storedToken);
      setUser(parsedUser);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
    setInitialLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setOperationLoading(true);
    try {
      const response: LoginApiResponse = await apiLoginUser(email, password);
      if (!response.token || !response.user || !response.user.id) {
        console.error("AuthContext: Incomplete data from login API response:", response);
        throw new Error("Login failed: Server returned incomplete data.");
      }
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      console.log("AuthContext: Login successful, state updated.", { token: response.token, user: response.user });
    } catch (error) {
      console.error("AuthContext: Login failed in context:", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<RegisterApiResponse> => {
    setOperationLoading(true);
    try {
      const response = await apiRegisterUser(name, email, password);
      return response;
    } catch (error) {
      console.error("AuthContext: Registration failed in context:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log("AuthContext: User logged out.");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user && !!user.id,
        initialLoading,     // <--- Експортуємо initialLoading
        operationLoading, // <--- Експортуємо operationLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
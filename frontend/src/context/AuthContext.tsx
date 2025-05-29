// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback, // <-- Додано
  useMemo, // <-- Додано
} from 'react';
import { loginUser as apiLoginUser, registerUser as apiRegisterUser } from '../services/userService';
import { User, LoginApiResponse, RegisterApiResponse } from '../types/types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<RegisterApiResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  initialLoading: boolean;
  operationLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    // console.log("AuthContext: Initial effect running to check localStorage");
    const storedToken = localStorage.getItem('token');
    const storedUserJson = localStorage.getItem('user');
    let parsedUser: User | null = null;

    if (storedUserJson) {
      try {
        parsedUser = JSON.parse(storedUserJson);
      } catch (e) {
        console.error("AuthContext: Failed to parse user from localStorage", e);
        localStorage.removeItem('user'); // Очистити пошкоджені дані
      }
    }

    if (storedToken && parsedUser && parsedUser.id) {
      // console.log("AuthContext: Restoring session from localStorage", { storedToken, parsedUser });
      setToken(storedToken);
      setUser(parsedUser);
    } else {
      // console.log("AuthContext: No valid session in localStorage, clearing.");
      // Переконуємося, що вони дійсно очищені, якщо одне з них відсутнє
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null); // Явно встановлюємо null, якщо щось не так
      setUser(null);
    }
    setInitialLoading(false);
  }, []); // Порожній масив залежностей - спрацьовує один раз при монтуванні

  const login = useCallback(async (email: string, password: string) => {
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
      setUser(response.user); // setUser створить новий об'єкт user - це нормально
      console.log("AuthContext: Login successful, state updated.");
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
  }, []); // login не залежить від стану провайдера, тому порожній масив

  const register = useCallback(async (name: string, email: string, password: string): Promise<RegisterApiResponse> => {
    setOperationLoading(true);
    try {
      // Після успішної реєстрації, можливо, потрібно автоматично логінити користувача
      // або перенаправляти на сторінку логіну. Поки що просто повертаємо відповідь.
      const response = await apiRegisterUser(name, email, password);
      return response;
    } catch (error) {
      console.error("AuthContext: Registration failed in context:", error);
      throw error;
    } finally {
      setOperationLoading(false);
    }
  }, []); // register також не залежить від стану провайдера

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log("AuthContext: User logged out.");
  }, []); // logout також не залежить

  // isAuthenticated розраховується на основі станів token та user
  const isAuthenticated = !!token && !!user && !!user.id;

  // Мемоїзація об'єкта значення контексту
  const contextValue = useMemo(() => ({
    token,
    user, // Коли user змінюється (новий об'єкт), contextValue отримає нове посилання - це очікувано
    login,
    register,
    logout,
    isAuthenticated, // isAuthenticated зміниться, якщо token або user зміняться
    initialLoading,
    operationLoading,
  }), [token, user, login, register, logout, isAuthenticated, initialLoading, operationLoading]);
  // Важливо включити ВСІ значення, які повертає контекст, у масив залежностей useMemo

  return (
    <AuthContext.Provider value={contextValue}>
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
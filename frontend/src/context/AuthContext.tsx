import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { 
  AuthContextType, 
  AuthState, 
  LoginCredentials, 
  RegisterCredentials,
  User 
} from '@/types';

// Set this to true to use mock auth (no backend needed)
const USE_MOCK_AUTH = false;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyverse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock users storage
const getMockUsers = (): any[] => {
  const users = localStorage.getItem('studyverse_mock_users');
  return users ? JSON.parse(users) : [];
};

const saveMockUsers = (users: any[]) => {
  localStorage.setItem('studyverse_mock_users', JSON.stringify(users));
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('studyverse_token'),
    isAuthenticated: false,
    isLoading: true
  });

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('studyverse_token');
      const savedUser = localStorage.getItem('studyverse_user');
      
      if (token && savedUser) {
        setState({
          user: JSON.parse(savedUser),
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const mockLogin = async (credentials: LoginCredentials) => {
    const users = getMockUsers();
    const user = users.find((u: any) => u.email === credentials.email.toLowerCase());
    
    if (!user) {
      throw new Error('User not found. Please register first.');
    }
    
    if (user.password !== credentials.password) {
      throw new Error('Invalid password.');
    }

    const { password, ...userWithoutPassword } = user;
    const token = 'mock-jwt-token-' + Date.now();
    
    localStorage.setItem('studyverse_token', token);
    localStorage.setItem('studyverse_user', JSON.stringify(userWithoutPassword));
    
    setState({
      user: userWithoutPassword,
      token,
      isAuthenticated: true,
      isLoading: false
    });
  };

  const mockRegister = async (credentials: RegisterCredentials) => {
    const users = getMockUsers();
    
    // Check if user already exists
    if (users.some((u: any) => u.email === credentials.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: 'user-' + Date.now(),
      name: credentials.name.trim(),
      email: credentials.email.toLowerCase().trim(),
      course_of_study: credentials.course_of_study || '',
      role: 'user',
      created_at: new Date().toISOString()
    };
    const userWithPassword = { ...newUser, password: credentials.password };

    users.push(userWithPassword);
    saveMockUsers(users);

    // Initialize mock data for the user
    initializeMockUserData(newUser.id);

    const token = 'mock-jwt-token-' + Date.now();
    
    localStorage.setItem('studyverse_token', token);
    localStorage.setItem('studyverse_user', JSON.stringify(newUser));
    
    setState({
      user: newUser,
      token,
      isAuthenticated: true,
      isLoading: false
    });
  };

  const initializeMockUserData = (userId: string) => {
    // Initialize study streak
    const streaks = JSON.parse(localStorage.getItem('studyverse_mock_streaks') || '{}');
    streaks[userId] = {
      current_streak: 0,
      longest_streak: 0,
      last_study_date: null
    };
    localStorage.setItem('studyverse_mock_streaks', JSON.stringify(streaks));

    // Initialize empty arrays for other data
    const summaries = JSON.parse(localStorage.getItem('studyverse_mock_summaries') || '{}');
    summaries[userId] = [];
    localStorage.setItem('studyverse_mock_summaries', JSON.stringify(summaries));

    const quizzes = JSON.parse(localStorage.getItem('studyverse_mock_quizzes') || '{}');
    quizzes[userId] = [];
    localStorage.setItem('studyverse_mock_quizzes', JSON.stringify(quizzes));

    const schedules = JSON.parse(localStorage.getItem('studyverse_mock_schedules') || '{}');
    schedules[userId] = [];
    localStorage.setItem('studyverse_mock_schedules', JSON.stringify(schedules));

    const activityLogs = JSON.parse(localStorage.getItem('studyverse_mock_activity_logs') || '{}');
    activityLogs[userId] = [];
    localStorage.setItem('studyverse_mock_activity_logs', JSON.stringify(activityLogs));
  };

  const login = async (credentials: LoginCredentials) => {
    if (USE_MOCK_AUTH) {
      await mockLogin(credentials);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('studyverse_token', token);
        localStorage.setItem('studyverse_user', JSON.stringify(user));
        
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    if (USE_MOCK_AUTH) {
      await mockRegister(credentials);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/register', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('studyverse_token', token);
        localStorage.setItem('studyverse_user', JSON.stringify(user));
        
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('studyverse_token');
    localStorage.removeItem('studyverse_user');
    
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateProfile = async (data: Partial<User>) => {
    if (USE_MOCK_AUTH) {
      const users = getMockUsers();
      const userIndex = users.findIndex((u: any) => u.id === state.user?.id);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex] = { ...users[userIndex], ...data };
      saveMockUsers(users);

      const { password, ...userWithoutPassword } = users[userIndex];
      localStorage.setItem('studyverse_user', JSON.stringify(userWithoutPassword));
      
      setState(prev => ({
        ...prev,
        user: userWithoutPassword
      }));
      return;
    }

    try {
      const response = await axiosInstance.put('/auth/profile', data);
      
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        localStorage.setItem('studyverse_user', JSON.stringify(updatedUser));
        
        setState(prev => ({
          ...prev,
          user: updatedUser
        }));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile
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

export { axiosInstance, USE_MOCK_AUTH };

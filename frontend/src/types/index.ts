// StudyVerse Type Definitions

export interface User {
  id: string;
  name: string;
  email: string;
  course_of_study: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  course_of_study: string;
}

export interface Summary {
  id: string;
  user_id: string;
  title: string;
  original_text?: string;
  summary_text: string;
  source_type: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  summary_id?: string;
  title: string;
  questions: QuizQuestion[];
  score: number;
  total_questions: number;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface Schedule {
  id: string;
  user_id: string;
  topic: string;
  description: string;
  scheduled_date: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  time_spent: number;
  created_at: string;
}

export interface StudyStreak {
  current: number;
  longest: number;
  last_study_date: string | null;
}

export interface DashboardData {
  user: User;
  streak: StudyStreak;
  activity_logs: ActivityLog[];
  quiz_progress: {
    total: number;
    completed: number;
    average_score: number;
    completion_rate: number;
  };
  upcoming_schedule: Schedule[];
  stats: {
    total_summaries: number;
    total_quizzes: number;
    total_study_time: number;
    completed_sessions: number;
  };
}

export interface ScrapedContent {
  success: boolean;
  topic: string;
  content?: string;
  source_url?: string;
  source?: string;
  scraped_at?: string;
  cached?: boolean;
  error?: string;
  suggestions?: string[];
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

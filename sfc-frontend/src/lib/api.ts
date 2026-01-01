import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

interface RequestConfig extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
  const { token, ...fetchConfig } = config;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge any additional headers from config
  if (config.headers) {
    const configHeaders = config.headers as Record<string, string>;
    Object.assign(headers, configHeaders);
  }

  // Add authorization header if token is provided or exists in cookies
  const authToken = token || Cookies.get("access_token");
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchConfig,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.detail?.message || data?.detail || data?.message || "An error occurred";
      const errorCode = data?.detail?.code || data?.code;
      return {
        error: {
          message: errorMessage,
          code: errorCode,
        },
      };
    }

    return { data };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      error: {
        message: "Network error. Please check your connection.",
      },
    };
  }
}

export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "POST", body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: "DELETE" }),
};

// Auth API
export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    privacy_consent: boolean;
    data_processing_consent: boolean;
    marketing_consent?: boolean;
  }) => api.post<{ message: string; user_id: string; email: string }>("/auth/signup", data),

  verifyOtp: (data: { email: string; code: string }) =>
    api.post<{ access_token: string; refresh_token: string; expires_in: number }>("/auth/verify-otp", data),

  resendOtp: (data: { email: string }) => api.post<{ message: string }>("/auth/resend-otp", data),

  signin: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; refresh_token: string; expires_in: number }>("/auth/signin", data),

  refresh: (data: { refresh_token: string }) =>
    api.post<{ access_token: string; refresh_token: string; expires_in: number }>("/auth/refresh", data),

  logout: (data: { refresh_token: string }) => api.post<{ message: string }>("/auth/logout", data),

  forgotPassword: (data: { email: string }) => api.post<{ message: string }>("/auth/forgot-password", data),

  resetPassword: (data: { email: string; code: string; new_password: string }) =>
    api.post<{ message: string }>("/auth/reset-password", data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<{ message: string }>("/auth/change-password", data),

  getMe: () =>
    api.get<{
      id: string;
      email: string;
      role: string;
      is_active: boolean;
      is_verified: boolean;
      created_at: string;
    }>("/auth/me"),

  getStatus: () =>
    api.get<{
      user: {
        id: string;
        email: string;
        role: string;
        is_active: boolean;
        is_verified: boolean;
        created_at: string;
      };
      has_profile: boolean;
      onboarding_completed: boolean;
    }>("/auth/status"),
};

// User API
export const userApi = {
  completeOnboarding: (data: {
    display_name?: string;
    age_range?: string;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    fitness_level?: string;
    primary_goal?: string;
    secondary_goals?: string[];
    days_per_week?: number;
    minutes_per_session?: number;
    preferred_days?: string[];
    injuries?: string;
    equipment_available?: string[];
    workout_location?: string;
    prefers_cardio?: boolean;
    prefers_strength?: boolean;
    interested_in_yoga?: boolean;
    health_disclaimer_accepted: boolean;
  }) => api.post<UserProfile>("/users/onboarding", data),

  getProfile: () => api.get<UserProfile>("/users/profile"),

  updateProfile: (data: Partial<UserProfile>) => api.put<UserProfile>("/users/profile", data),
};

// Programs API
export const programsApi = {
  list: (params?: { goal?: string; difficulty?: string; featured?: boolean; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.goal) searchParams.append("goal", params.goal);
    if (params?.difficulty) searchParams.append("difficulty", params.difficulty);
    if (params?.featured) searchParams.append("featured", "true");
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    const queryString = searchParams.toString();
    return api.get<Program[]>(`/programs${queryString ? `?${queryString}` : ""}`);
  },

  getFeatured: (limit = 6) => api.get<Program[]>(`/programs/featured?limit=${limit}`),

  getRecommended: (limit = 6) =>
    api.get<{ programs: Program[]; reason: string }>(`/programs/recommended?limit=${limit}`),

  getContinue: () => api.get<{ enrollments: EnrollmentProgress[] }>("/programs/continue"),

  getById: (id: string) =>
    api.get<Program & { workouts: Workout[]; total_workouts: number }>(`/programs/${id}`),

  enroll: (programId: string) =>
    api.post<{ enrollment_id: string; program_id: string; message: string }>(`/programs/${programId}/enroll`),

  unenroll: (programId: string) => api.delete<{ message: string }>(`/programs/${programId}/enroll`),

  getProgress: (programId: string) => api.get<EnrollmentProgress>(`/programs/${programId}/progress`),

  getWorkoutsWithProgress: (programId: string) =>
    api.get<WorkoutWithProgress[]>(`/programs/${programId}/workouts`),

  markWorkoutComplete: (
    workoutId: string,
    data?: {
      duration_minutes?: number;
      rating?: number;
      difficulty_felt?: string;
      notes?: string;
    }
  ) =>
    api.post<{
      completion_id: string;
      workout_id: string;
      next_workout_id?: string;
      program_completed: boolean;
      message: string;
    }>(`/programs/workouts/${workoutId}/complete`, data || {}),
};

// Admin API
export const adminApi = {
  listPrograms: (params?: { include_unpublished?: boolean; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.include_unpublished !== undefined)
      searchParams.append("include_unpublished", params.include_unpublished.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    const queryString = searchParams.toString();
    return api.get<Program[]>(`/admin/programs${queryString ? `?${queryString}` : ""}`);
  },

  createProgram: (data: CreateProgramData) =>
    api.post<Program & { workouts: Workout[]; total_workouts: number }>("/admin/programs", data),

  getProgram: (id: string) =>
    api.get<Program & { workouts: Workout[]; total_workouts: number }>(`/admin/programs/${id}`),

  updateProgram: (id: string, data: Partial<UpdateProgramData>) =>
    api.put<Program>(`/admin/programs/${id}`, data),

  deleteProgram: (id: string) => api.delete<{ message: string }>(`/admin/programs/${id}`),

  publishProgram: (id: string) => api.post<Program>(`/admin/programs/${id}/publish`),

  unpublishProgram: (id: string) => api.post<Program>(`/admin/programs/${id}/unpublish`),

  addWorkout: (programId: string, data: CreateWorkoutData) =>
    api.post<Workout>(`/admin/programs/${programId}/workouts`, data),

  updateWorkout: (workoutId: string, data: Partial<UpdateWorkoutData>) =>
    api.put<Workout>(`/admin/workouts/${workoutId}`, data),

  deleteWorkout: (workoutId: string) => api.delete<{ message: string }>(`/admin/workouts/${workoutId}`),

  getWorkout: (workoutId: string) => api.get<Workout>(`/admin/workouts/${workoutId}`),
};

// Types
export interface Program {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  goal: string;
  difficulty: string;
  equipment_needed?: string[];
  duration_weeks: number;
  days_per_week: number;
  minutes_per_session: number;
  is_featured: boolean;
  is_published: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  title: string;
  description?: string;
  intensity: string;
  duration_minutes: number;
  video_url: string;
  video_title?: string;
  video_thumbnail?: string;
  calories_estimate?: number;
  equipment_needed?: string[];
  tags?: string[];
  is_rest_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutWithProgress extends Workout {
  is_completed: boolean;
  completed_at?: string;
  is_locked: boolean;
}

export interface EnrollmentProgress {
  enrollment_id: string;
  program: Program;
  current_day: number;
  total_days: number;
  progress_percent: number;
  workouts_completed: number;
  total_minutes_completed: number;
  streak_days: number;
  started_at: string;
  last_workout_at?: string;
  is_active: boolean;
  completed_at?: string;
  next_workout?: Workout;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  age_range?: string;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  fitness_level?: string;
  primary_goal?: string;
  secondary_goals?: string[];
  days_per_week?: number;
  minutes_per_session?: number;
  preferred_days?: string[];
  injuries?: string;
  equipment_available?: string[];
  workout_location?: string;
  prefers_cardio?: boolean;
  prefers_strength?: boolean;
  interested_in_yoga?: boolean;
  health_disclaimer_accepted_at?: string;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramData {
  title: string;
  description?: string;
  thumbnail_url?: string;
  goal: string;
  difficulty: string;
  equipment_needed?: string[];
  duration_weeks: number;
  days_per_week: number;
  minutes_per_session: number;
  is_featured?: boolean;
  workouts?: CreateWorkoutData[];
}

export interface UpdateProgramData {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  goal?: string;
  difficulty?: string;
  equipment_needed?: string[];
  duration_weeks?: number;
  days_per_week?: number;
  minutes_per_session?: number;
  is_featured?: boolean;
  is_published?: boolean;
  order_index?: number;
}

export interface CreateWorkoutData {
  week_number: number;
  day_number: number;
  title: string;
  description?: string;
  intensity: string;
  duration_minutes: number;
  video_url: string;
  video_title?: string;
  video_thumbnail?: string;
  calories_estimate?: number;
  equipment_needed?: string[];
  tags?: string[];
  is_rest_day?: boolean;
}

export interface UpdateWorkoutData {
  title?: string;
  description?: string;
  intensity?: string;
  duration_minutes?: number;
  video_url?: string;
  video_title?: string;
  video_thumbnail?: string;
  calories_estimate?: number;
  equipment_needed?: string[];
  tags?: string[];
  is_rest_day?: boolean;
}


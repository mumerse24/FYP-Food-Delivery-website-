import axios from 'axios';

// API Configuration
const API_URL = 'http://localhost:5000/api/admin/auth';

// Configure axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface AdminData {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  admin: AdminData;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Admin Authentication Service
const AuthAdmin = {
  // Login admin
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/login', {
        email,
        password,
      });

      if (response.data.success && response.data.token) {
        // Store token and admin data
        localStorage.setItem('token', response.data.token);  // ✅
        localStorage.setItem('user', JSON.stringify(response.data.admin));  // ✅
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.'
      );
    }
  },

  // Register new admin (for initial setup)
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/register', {
        email,
        password,
        name,
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.admin));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    }
  },

  // Get current admin data
  getCurrentAdmin(): AdminData | null {
    try {
      const adminData = localStorage.getItem('adminData');
      return adminData ? JSON.parse(adminData) : null;
    } catch {
      return null;
    }
  },

  // Get admin token
  getToken(): string | null {
    return localStorage.getItem('adminToken');
  },

  // Check if admin is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;

    // Check token expiration (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Get admin profile from server
  async getProfile(): Promise<AdminData> {
    try {
      const response = await api.get<ApiResponse>('/profile');
      if (response.data.success) {
        // Update local storage with fresh data
        localStorage.setItem('adminData', JSON.stringify(response.data.data));
        return response.data.data;
      }
      throw new Error('Failed to fetch profile');
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch admin profile'
      );
    }
  },

  // Update admin password
  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>('/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to update password'
      );
    }
  },

  // Update admin profile
  async updateProfile(data: Partial<AdminData>): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>('/profile', data);
      if (response.data.success && response.data.data) {
        // Update local storage
        const currentData = this.getCurrentAdmin();
        const updatedData = { ...currentData, ...response.data.data };
        localStorage.setItem('adminData', JSON.stringify(updatedData));
      }
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to update profile'
      );
    }
  },

  // Logout admin
  logout(): void {
    try {
      // Call logout API if needed
      api.post('/logout').catch(() => {
        // Silently fail if server is unreachable
      });
    } finally {
      // Always clear local storage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      window.location.href = '/admin/login';
    }
  },

  // Verify token with server
  async verifyToken(): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse>('/verify');
      return response.data.success;
    } catch {
      return false;
    }
  },

  // Forgot password request
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>('/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to process forgot password request'
      );
    }
  },

  // Reset password with token
  async resetPassword(
    token: string,
    password: string
  ): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>('/reset-password', {
        token,
        password,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to reset password'
      );
    }
  },

  // Get all admins (for super admin)
  async getAllAdmins(): Promise<AdminData[]> {
    try {
      const response = await api.get<ApiResponse>('/all');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to fetch admins');
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch admin list'
      );
    }
  },

  // Create new admin (for super admin)
  async createAdmin(
    email: string,
    password: string,
    name: string,
    role: string = 'admin'
  ): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>('/create', {
        email,
        password,
        name,
        role,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to create admin'
      );
    }
  },

  // Update admin status
  async updateAdminStatus(
    adminId: string,
    isActive: boolean
  ): Promise<ApiResponse> {
    try {
      const response = await api.put<ApiResponse>(`/${adminId}/status`, {
        isActive,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to update admin status'
      );
    }
  },

  // Delete admin
  async deleteAdmin(adminId: string): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`/${adminId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to delete admin'
      );
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<any> {
    try {
      const response = await api.get<ApiResponse>('/dashboard/stats');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch dashboard statistics');
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch dashboard data'
      );
    }
  },

  // Get recent activities
  async getRecentActivities(): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse>('/activities');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to fetch activities');
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        'Failed to fetch activities'
      );
    }
  },
};

export default AuthAdmin;
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API base URL - make sure to update this with your actual backend URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Interface for API response
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// Function to handle API errors
const handleApiError = async (response: Response): Promise<ApiResponse> => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      return {
        error: errorData.message || 'An error occurred',
        status: response.status
      };
    } catch (e) {
      return {
        error: `${response.status}: ${response.statusText}`,
        status: response.status
      };
    }
  }
  return { status: response.status };
};

// Generic fetch function with authentication
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
  withAuth: boolean = true
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (withAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const apiResponse = await handleApiError(response);
    
    if (apiResponse.error) {
      return apiResponse as ApiResponse<T>;
    }

    if (response.status === 204) {
      return { status: 204 };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 500
    };
  }
}

// Helper methods for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string, withAuth: boolean = true) => 
    fetchApi<T>(endpoint, { method: 'GET' }, withAuth),
    
  post: <T = any>(endpoint: string, data: any, withAuth: boolean = true) => 
    fetchApi<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }, withAuth),
    
  put: <T = any>(endpoint: string, data: any, withAuth: boolean = true) => 
    fetchApi<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }, withAuth),
    
  delete: <T = any>(endpoint: string, withAuth: boolean = true) => 
    fetchApi<T>(endpoint, { method: 'DELETE' }, withAuth),

  // Special method for form data (file uploads)
  uploadForm: <T = any>(endpoint: string, formData: FormData, withAuth: boolean = true) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const headers: Record<string, string> = {};
    if (withAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetchApi<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData
    }, withAuth);
  }
};

import axios, { AxiosInstance } from 'axios';
import { Booking, TravelPackage } from '../types';

const rawBase = import.meta.env.VITE_BACKEND_URL || '';
const API_BASE = rawBase.replace(/\/$/, '') + '/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handler
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
      } catch (e) {}
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // --- BOOKING ROUTES ---
  async createCustomBooking(bookingData: Omit<Booking, '_id' | 'status' | 'createdAt'>): Promise<Booking> {
    const { data } = await axiosInstance.post('/bookings/custom', bookingData);
    return data as Booking;
  },

  async getAllBookings(): Promise<Booking[]> {
    const { data } = await axiosInstance.get('/bookings');
    return data as Booking[];
  },

  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    const { data } = await axiosInstance.patch(`/bookings/${id}`, { status });
    return data as Booking;
  },

  // --- PACKAGE ROUTES ---
  async getPackages(): Promise<TravelPackage[]> {
    const { data } = await axiosInstance.get('/packages');
    return data as TravelPackage[];
  },

  async createPackage(packageData: any): Promise<TravelPackage> {
    const { data } = await axiosInstance.post('/packages', packageData);
    return data as TravelPackage;
  },

  async updatePackage(id: string, packageData: any): Promise<TravelPackage> {
    const { data } = await axiosInstance.put(`/packages/${id}`, packageData);
    return data as TravelPackage;
  },

  async deletePackage(id: string): Promise<void> {
    await axiosInstance.delete(`/packages/${id}`);
  },

  // --- RESOURCE ROUTES (Hotels, Drivers, Guides) ---
  async getResources(): Promise<any[]> {
    const { data } = await axiosInstance.get('/resources');
    return data as any[];
  },

  async createResource(resourceData: any): Promise<any> {
    const { data } = await axiosInstance.post('/resources', resourceData);
    return data as any;
  },

  async updateResource(id: string, resourceData: any): Promise<any> {
    const { data } = await axiosInstance.put(`/resources/${id}`, resourceData);
    return data as any;
  },

  async deleteResource(id: string): Promise<void> {
    await axiosInstance.delete(`/resources/${id}`);
  }
};

export default axiosInstance;
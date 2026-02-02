import { Booking, TravelPackage } from '../types';

// Updated to point to the backend server running on port 5000
const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const api = {
  // --- BOOKING ROUTES ---
  async createCustomBooking(bookingData: Omit<Booking, '_id' | 'status' | 'createdAt'>): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to save booking');
    return response.json();
  },

  async getAllBookings(): Promise<Booking[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/bookings`, {
      headers: {
        'Authorization': `Bearer ${token}` // Send token to backend
      }
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Send token to backend
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  // --- PACKAGE ROUTES ---
  async getPackages(): Promise<TravelPackage[]> {
    const response = await fetch(`${API_BASE}/packages`);
    if (!response.ok) throw new Error('Failed to fetch packages');
    return response.json();
  },

  async createPackage(packageData: any): Promise<TravelPackage> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/packages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(packageData),
    });
    if (!response.ok) throw new Error('Failed to create package');
    return response.json();
  },

  async updatePackage(id: string, packageData: any): Promise<TravelPackage> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/packages/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(packageData),
    });
    if (!response.ok) throw new Error('Failed to update package');
    return response.json();
  },

  async deletePackage(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/packages/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete package');
  },

  // --- RESOURCE ROUTES (Hotels, Drivers, Guides) ---
  async getResources(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/resources`);
    if (!response.ok) throw new Error('Failed to fetch resources');
    return response.json();
  },

  async createResource(resourceData: any): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resourceData),
    });
    if (!response.ok) throw new Error('Failed to create resource');
    return response.json();
  },

  async updateResource(id: string, resourceData: any): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/resources/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(resourceData),
    });
    if (!response.ok) throw new Error('Failed to update resource');
    return response.json();
  },

  async deleteResource(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/resources/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete resource');
  }
};
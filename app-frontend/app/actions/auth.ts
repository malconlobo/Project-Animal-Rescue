'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function setToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('authToken')?.value;
}

export async function checkIsLoggedIn() {
  const cookieStore = await cookies();
  return !!cookieStore.get('authToken')?.value;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('authToken');
  redirect('/auth/login');
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    const cookieStore = await cookies();
    cookieStore.delete('authToken');
    redirect('/auth/login');
  }

  return response;
}

export async function deleteAccountAction() {
  const token = await getToken();
  if (!token) return { error: "Not logged in" };

  try {
    const res = await fetch(`${API_URL}/organizations/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 404) {
      return { error: "Failed to delete account" };
    }

    const cookieStore = await cookies();
    cookieStore.delete('authToken');
    return { success: true };
  } catch (error) {
    return { error: "An error occurred" };
  }
}

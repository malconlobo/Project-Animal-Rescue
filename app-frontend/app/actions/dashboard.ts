'use server';

import { fetchWithAuth } from './auth';
import { revalidatePath } from 'next/cache';

export async function assignIncident(incidentId: string) {
  const res = await fetchWithAuth(`/incidents/${incidentId}/assign`, {
    method: 'PUT',
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to assign incident');
  }
  
  revalidatePath('/dashboard');
  return true;
}

export async function updateIncidentStatus(incidentId: string, status: string) {
  const res = await fetchWithAuth(`/incidents/${incidentId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update status');
  }
  
  revalidatePath('/dashboard');
  return true;
}

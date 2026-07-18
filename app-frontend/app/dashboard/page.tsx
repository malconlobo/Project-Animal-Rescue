import { fetchWithAuth } from '../actions/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const orgRes = await fetchWithAuth('/organizations/me');
    const orgData = await orgRes.json();

    const unassignedRes = await fetchWithAuth('/incidents/unassigned');
    const unassignedData = await unassignedRes.json();

    const assignedRes = await fetchWithAuth('/incidents/assigned');
    const assignedData = await assignedRes.json();

    return (
      <DashboardClient 
        org={orgData.data} 
        unassigned={unassignedData.data} 
        assigned={assignedData.data} 
      />
    );
  } catch (error) {
    console.error('Dashboard load error:', error);
    redirect('/auth/login');
  }
}

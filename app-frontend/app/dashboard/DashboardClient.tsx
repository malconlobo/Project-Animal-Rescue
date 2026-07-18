'use client';

import { useState } from 'react';
import { assignIncident, updateIncidentStatus } from '../actions/dashboard';
import { logoutAction } from '../actions/auth';
import Link from 'next/link';

export default function DashboardClient({ org, unassigned, assigned }: { org: any, unassigned: any[], assigned: any[] }) {
  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned');
  const [loading, setLoading] = useState<string | null>(null);

  const handleAssign = async (id: string) => {
    setLoading(id);
    try {
      await assignIncident(id);
    } catch (err) {
      alert('Error assigning incident');
    } finally {
      setLoading(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(id);
    try {
      await updateIncidentStatus(id, newStatus);
    } catch (err) {
      alert('Error updating status');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#132822] font-sans">
      <nav className="bg-[#fffdf9] shadow-sm border-b border-[#dfe3dc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-[#f3654d] text-2xl -rotate-12 select-none" aria-hidden="true">♥</span>
              <h1 className="text-xl font-bold font-serif text-[#132822]">PawReach Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-[#145a46] font-semibold hover:text-[#0d3e32]">Public Home</Link>
              <span className="text-sm text-[#66746e]">Logged in as {org.name}</span>
              <button onClick={() => logoutAction()} className="text-sm font-medium text-[#f3654d] hover:underline hover:text-[#d9523c]">
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-[#fffdf9] rounded-lg shadow-sm border border-[#dfe3dc] px-6 py-6 sm:px-8 mb-8">
            <h2 className="text-xl font-bold font-serif text-[#132822] mb-1">Organization Profile</h2>
            <p className="mt-1 text-sm text-[#66746e]">City: <strong>{org.city}</strong> &bull; Type: <strong>{org.type}</strong> &bull; Contact: <strong>{org.phone}</strong></p>
          </div>

          <div className="border-b border-[#dfe3dc] mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('unassigned')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === 'unassigned' ? 'border-[#f3654d] text-[#f3654d]' : 'border-transparent text-[#66746e] hover:text-[#132822] hover:border-[#dfe3dc]'
                }`}
              >
                Unassigned in {org.city} ({unassigned.length})
              </button>
              <button
                onClick={() => setActiveTab('assigned')}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                  activeTab === 'assigned' ? 'border-[#f3654d] text-[#f3654d]' : 'border-transparent text-[#66746e] hover:text-[#132822] hover:border-[#dfe3dc]'
                }`}
              >
                My Cases ({assigned.length})
              </button>
            </nav>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeTab === 'unassigned' && unassigned.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#66746e] bg-[#fffdf9] border border-[#dfe3dc] rounded-lg">No unassigned incidents found in your area.</div>
            )}
            {activeTab === 'assigned' && assigned.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#66746e] bg-[#fffdf9] border border-[#dfe3dc] rounded-lg">You haven't claimed any incidents yet.</div>
            )}

            {(activeTab === 'unassigned' ? unassigned : assigned).map((incident) => (
              <div key={incident._id} className="bg-[#fffdf9] overflow-hidden shadow-sm border border-[#dfe3dc] rounded-xl flex flex-col hover:shadow-md transition-shadow">
                <div className="px-5 py-5 sm:p-6 flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold font-serif text-[#132822]">{incident.situation}</h3>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      incident.status === 'reported' ? 'bg-[#ffcf7b] text-[#87452c]' :
                      incident.status === 'in-progress' ? 'bg-[#bad5bc] text-[#145a46]' :
                      'bg-[#4c8d6d] text-white'
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#436059]"><strong>Location:</strong> {incident.location}</p>
                  <p className="mt-3 text-sm text-[#66746e] line-clamp-3">{incident.details}</p>
                  <p className="mt-4 text-xs text-[#a9c4b3]">Reported: {new Date(incident.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-[#e4f0e6] px-5 py-4 border-t border-[#dfe3dc]">
                  {activeTab === 'unassigned' ? (
                    <button
                      onClick={() => handleAssign(incident._id)}
                      disabled={loading === incident._id}
                      className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-[#145a46] hover:bg-[#0d3e32] disabled:bg-[#80b18a] transition-colors cursor-pointer"
                    >
                      {loading === incident._id ? 'Assigning...' : 'Assign to Me'}
                    </button>
                  ) : (
                    <select
                      value={incident.status}
                      disabled={loading === incident._id}
                      onChange={(e) => handleStatusChange(incident._id, e.target.value)}
                      className="block w-full pl-3 pr-10 py-2.5 text-sm font-semibold text-[#145a46] border border-[#a9c4b3] bg-white focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] rounded-md shadow-sm cursor-pointer"
                    >
                      <option value="in-progress">Status: In Progress</option>
                      <option value="resolved">Status: Resolved</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

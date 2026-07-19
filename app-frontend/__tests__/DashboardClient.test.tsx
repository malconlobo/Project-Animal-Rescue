import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DashboardClient from '../app/dashboard/DashboardClient';
import { assignIncident, updateIncidentStatus } from '../app/actions/dashboard';

jest.mock('../app/actions/dashboard', () => ({
  assignIncident: jest.fn().mockResolvedValue({}),
  updateIncidentStatus: jest.fn().mockResolvedValue({}),
}));

jest.mock('../app/actions/auth', () => ({
  logoutAction: jest.fn(),
  deleteAccountAction: jest.fn(),
}));

const mockOrg = { name: 'Test Org', city: 'Delhi', type: 'Rescue', phone: '123' };
const mockUnassigned = [
  { _id: '1', city: 'Delhi', location: 'Street 1', situation: 'Injured', details: '', createdAt: '2023-01-01', status: 'reported' }
];
const mockAssigned = [
  { _id: '2', city: 'Delhi', location: 'Street 2', situation: 'Stuck', details: '', status: 'in-progress', createdAt: '2023-01-02' }
];

describe('DashboardClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dashboard with correct tabs and org name', () => {
    render(<DashboardClient org={mockOrg} unassigned={mockUnassigned} assigned={mockAssigned} />);
    
    expect(screen.getByText('Logged in as Test Org')).toBeInTheDocument();
    expect(screen.getByText(/Unassigned in Delhi/)).toBeInTheDocument();
    expect(screen.getByText('Injured')).toBeInTheDocument();
  });

  it('switches tabs and displays assigned incidents', () => {
    render(<DashboardClient org={mockOrg} unassigned={mockUnassigned} assigned={mockAssigned} />);
    
    const assignedTabButton = screen.getByRole('button', { name: /My Cases/ });
    fireEvent.click(assignedTabButton);

    expect(screen.getByText('Stuck')).toBeInTheDocument();
  });

  it('calls assignIncident when Assign to Me is clicked', async () => {
    render(<DashboardClient org={mockOrg} unassigned={mockUnassigned} assigned={mockAssigned} />);
    
    const assignButton = screen.getByText('Assign to Me');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(assignIncident).toHaveBeenCalledWith('1');
    });
  });

  it('calls updateIncidentStatus when a new status is selected', async () => {
    render(<DashboardClient org={mockOrg} unassigned={mockUnassigned} assigned={mockAssigned} />);
    
    // switch to assigned tab
    fireEvent.click(screen.getByRole('button', { name: /My Cases/ }));
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(updateIncidentStatus).toHaveBeenCalledWith('2', 'resolved');
    });
  });
});

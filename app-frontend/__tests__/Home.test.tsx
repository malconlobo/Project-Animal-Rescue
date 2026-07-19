import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '../app/animal-rescue/page';

// Mock dependencies
jest.mock('../app/actions/auth', () => ({
  checkIsLoggedIn: jest.fn().mockResolvedValue(false),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        { id: '1', name: 'Delhi Animal Rescue', city: 'Delhi', phone: '1234567890' }
      ]
    }),
  })
) as jest.Mock;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the hero section correctly', async () => {
    await act(async () => {
      render(<Home />);
    });
    
    // Check if the main heading is present
    expect(screen.getByText(/Every animal deserves a/)).toBeInTheDocument();
    expect(screen.getByText(/way home./)).toBeInTheDocument();
    
    // Check if report button exists
    const reportButtons = screen.getAllByText(/Report an incident/);
    expect(reportButtons.length).toBeGreaterThan(0);
  });

  it('fetches and displays organizations', async () => {
    await act(async () => {
      render(<Home />);
    });
    
    // Wait for the fetched organization to appear
    await waitFor(() => {
      expect(screen.getByText('Delhi Animal Rescue')).toBeInTheDocument();
      expect(screen.getByText(/1234567890/)).toBeInTheDocument();
    });
  });

  it('opens the report modal when clicking report an emergency', async () => {
    await act(async () => {
      render(<Home />);
    });
    
    // The button in the header
    const reportButton = screen.getByText(/Report an emergency/);
    fireEvent.click(reportButton);
    
    // Modal title should appear
    expect(screen.getByText('Tell us what happened')).toBeInTheDocument();
  });
});

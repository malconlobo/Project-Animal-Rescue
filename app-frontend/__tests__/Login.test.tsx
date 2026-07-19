import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LoginPage from '../app/auth/login/page';
import { setToken } from '../app/actions/auth';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../app/actions/auth', () => ({
  setToken: jest.fn(),
}));

describe('Login Page', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign in to Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('shows error if fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    const { container } = render(<LoginPage />);
    
    const emailInput = container.querySelector('input[name="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    
    fireEvent.change(emailInput!, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput!, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls setToken and redirects on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-jwt-token' }),
    });

    const { container } = render(<LoginPage />);
    
    const emailInput = container.querySelector('input[name="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    
    fireEvent.change(emailInput!, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput!, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(setToken).toHaveBeenCalledWith('mock-jwt-token');
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});

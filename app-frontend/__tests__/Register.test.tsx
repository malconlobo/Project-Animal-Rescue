import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RegisterPage from '../app/auth/register/page';
import { setToken } from '../app/actions/auth';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../app/actions/auth', () => ({
  setToken: jest.fn(),
}));

describe('Register Page', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  it('renders register form', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Register Organization')).toBeInTheDocument();
  });

  it('shows error if fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Email already exists' }),
    });

    const { container } = render(<RegisterPage />);
    
    fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Test' } });
    fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'test@test.com' } });
    fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
    fireEvent.change(container.querySelector('input[name="phone"]')!, { target: { value: '1234567890' } });
    fireEvent.change(container.querySelector('select[name="city"]')!, { target: { value: 'Delhi' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Register Organization' }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  it('calls setToken and redirects on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-jwt-token' }),
    });

    const { container } = render(<RegisterPage />);
    
    fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Test' } });
    fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'test@test.com' } });
    fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
    fireEvent.change(container.querySelector('input[name="phone"]')!, { target: { value: '1234567890' } });
    fireEvent.change(container.querySelector('select[name="city"]')!, { target: { value: 'Delhi' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Register Organization' }));

    await waitFor(() => {
      expect(setToken).toHaveBeenCalledWith('mock-jwt-token');
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});

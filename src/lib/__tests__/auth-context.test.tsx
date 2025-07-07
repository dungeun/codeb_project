import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../auth-context'

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, loading } = useAuth()

  return (
    <div>
      {loading && <div>Loading...</div>}
      {user ? (
        <div>
          <div>Welcome, {user.name}!</div>
          <div>Role: {user.role}</div>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <div>Not logged in</div>
          <button 
            onClick={() => login('test@example.com', 'password123!')}
          >
            Login
          </button>
        </div>
      )}
    </div>
  )
}

const renderWithAuthProvider = (ui: React.ReactElement) => {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    renderWithAuthProvider(<TestComponent />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows not logged in state when no user', async () => {
    renderWithAuthProvider(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    renderWithAuthProvider(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
    
    const loginButton = screen.getByText('Login')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/Welcome,/)).toBeInTheDocument()
      expect(screen.getByText('Role:')).toBeInTheDocument()
    })
  })

  it('handles logout', async () => {
    const user = userEvent.setup()
    renderWithAuthProvider(<TestComponent />)
    
    // First login
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
    
    const loginButton = screen.getByText('Login')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/Welcome,/)).toBeInTheDocument()
    })

    // Then logout
    const logoutButton = screen.getByText('Logout')
    await user.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    console.error = originalError
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup()
    
    const TestComponentWithValidation = () => {
      const { login } = useAuth()
      const [error, setError] = React.useState('')

      const handleLogin = async () => {
        try {
          await login('test@example.com', 'weak')
        } catch (err: any) {
          setError(err.message)
        }
      }

      return (
        <div>
          <button onClick={handleLogin}>Login with weak password</button>
          {error && <div>Error: {error}</div>}
        </div>
      )
    }

    renderWithAuthProvider(<TestComponentWithValidation />)
    
    const loginButton = screen.getByText('Login with weak password')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument()
    })
  })

  it('remembers user session in localStorage', async () => {
    const user = userEvent.setup()
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })

    renderWithAuthProvider(<TestComponent />)
    
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
    
    const loginButton = screen.getByText('Login')
    await user.click(loginButton)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'codeb_user',
        expect.any(String)
      )
    })
  })

  it('auto-logs out after session timeout', async () => {
    // Mock timers
    jest.useFakeTimers()
    
    const user = userEvent.setup()
    renderWithAuthProvider(<TestComponent />)
    
    // Login first
    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
    
    const loginButton = screen.getByText('Login')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/Welcome,/)).toBeInTheDocument()
    })

    // Fast-forward time by 30 minutes
    jest.advanceTimersByTime(30 * 60 * 1000)

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('handles different user roles', async () => {
    const user = userEvent.setup()
    
    const TestComponentWithRoles = () => {
      const { login, user: currentUser } = useAuth()

      return (
        <div>
          {currentUser ? (
            <div>Role: {currentUser.role}</div>
          ) : (
            <div>
              <button onClick={() => login('admin@codeb.com', 'admin123!')}>
                Login as Admin
              </button>
              <button onClick={() => login('customer@test.com', 'customer123!')}>
                Login as Customer
              </button>
            </div>
          )}
        </div>
      )
    }

    renderWithAuthProvider(<TestComponentWithRoles />)
    
    const adminButton = screen.getByText('Login as Admin')
    await user.click(adminButton)

    await waitFor(() => {
      expect(screen.getByText('Role: admin')).toBeInTheDocument()
    })
  })
})
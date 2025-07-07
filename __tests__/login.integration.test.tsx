import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '../src/app/(auth)/login/page'
import { AuthProvider } from '../src/lib/auth-context'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

describe('Login Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  const renderLoginPage = () => {
    return render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )
  }

  it('renders login form correctly', () => {
    renderLoginPage()
    
    expect(screen.getByText('CodeB')).toBeInTheDocument()
    expect(screen.getByText('AI 기반 개발 플랫폼')).toBeInTheDocument()
    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('shows test accounts information', () => {
    renderLoginPage()
    
    expect(screen.getByText('테스트 계정:')).toBeInTheDocument()
    expect(screen.getByText('관리자: admin@codeb.com / admin123!')).toBeInTheDocument()
    expect(screen.getByText('고객: customer@test.com / customer123!')).toBeInTheDocument()
  })

  it('shows password requirements', () => {
    renderLoginPage()
    
    expect(screen.getByText('최소 8자, 특수문자 포함')).toBeInTheDocument()
  })

  it('handles successful login with admin credentials', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'admin@codeb.com')
    await user.type(passwordInput, 'admin123!')
    await user.click(loginButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles successful login with customer credentials', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'customer@test.com')
    await user.type(passwordInput, 'customer123!')
    await user.click(loginButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error for invalid credentials', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'invalid@email.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/로그인에 실패했습니다/)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error for weak password', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'weak')
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/로그인에 실패했습니다/)).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('requires both email and password', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const loginButton = screen.getByRole('button', { name: '로그인' })

    // Try to submit without filling fields
    await user.click(loginButton)

    // Form should not submit (HTML5 validation)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'admin@codeb.com')
    await user.type(passwordInput, 'admin123!')
    await user.click(loginButton)

    // Should show loading state briefly
    expect(screen.getByText('로그인 중...')).toBeInTheDocument()
  })

  it('handles remember me checkbox', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const rememberCheckbox = screen.getByLabelText('로그인 상태 유지')
    
    expect(rememberCheckbox).not.toBeChecked()
    
    await user.click(rememberCheckbox)
    
    expect(rememberCheckbox).toBeChecked()
  })

  it('has forgot password link', () => {
    renderLoginPage()
    
    const forgotPasswordLink = screen.getByText('비밀번호를 잊으셨나요?')
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'validpass123!')
    await user.click(loginButton)

    // HTML5 validation should prevent submission
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables login button when loading', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const loginButton = screen.getByRole('button', { name: '로그인' })

    await user.type(emailInput, 'admin@codeb.com')
    await user.type(passwordInput, 'admin123!')
    await user.click(loginButton)

    // Button should be disabled during loading
    const loadingButton = screen.getByRole('button', { name: '로그인 중...' })
    expect(loadingButton).toBeDisabled()
  })
})
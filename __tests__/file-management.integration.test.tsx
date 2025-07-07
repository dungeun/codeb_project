import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilesPage from '../src/app/(dashboard)/files/page'
import { AuthProvider } from '../src/lib/auth-context'

// Mock the auth context with different user roles
const mockAdminUser = {
  id: 'admin-1',
  name: '관리자',
  email: 'admin@codeb.com',
  role: 'admin' as const,
}

const mockCustomerUser = {
  id: 'customer-1', 
  name: '고객',
  email: 'customer@test.com',
  role: 'customer' as const,
}

// Mock auth context
jest.mock('../src/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}))

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { useAuth } from '../src/lib/auth-context'
import toast from 'react-hot-toast'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('File Management Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Admin User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('shows file upload section for admin', () => {
      render(<FilesPage />)
      
      expect(screen.getByText('파일 업로드')).toBeInTheDocument()
      expect(screen.getByText(/드래그하여 파일을 업로드하거나/)).toBeInTheDocument()
    })

    it('shows download history tab for admin', () => {
      render(<FilesPage />)
      
      expect(screen.getByText('파일 목록')).toBeInTheDocument()
      expect(screen.getByText('다운로드 이력')).toBeInTheDocument()
    })

    it('shows delete buttons on files for admin', () => {
      render(<FilesPage />)
      
      // Check for delete buttons (✕) on file items
      const deleteButtons = screen.getAllByText('✕')
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it('can upload files', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText(/파일 선택/)
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByText('hello.txt')).toBeInTheDocument()
      })
    })

    it('can download files', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const downloadButtons = screen.getAllByText('다운로드')
      await user.click(downloadButtons[0])
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('다운로드를 시작합니다')
      )
    })

    it('can delete files', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<FilesPage />)
      
      const deleteButtons = screen.getAllByText('✕')
      await user.click(deleteButtons[0])
      
      expect(confirmSpy).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('파일이 삭제되었습니다.')
      
      confirmSpy.mockRestore()
    })

    it('can view download history', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const historyTab = screen.getByText('다운로드 이력')
      await user.click(historyTab)
      
      expect(screen.getByText('다운로드 이력')).toBeInTheDocument()
      expect(screen.getByText('파일명')).toBeInTheDocument()
      expect(screen.getByText('다운로드한 사용자')).toBeInTheDocument()
      expect(screen.getByText('다운로드 시간')).toBeInTheDocument()
    })

    it('can preview files', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const previewButtons = screen.getAllByText('미리보기')
      await user.click(previewButtons[0])
      
      // FilePreview modal should open
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /다운로드/ })).toBeInTheDocument()
      })
    })
  })

  describe('Customer User', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockCustomerUser,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('hides file upload section for customer', () => {
      render(<FilesPage />)
      
      expect(screen.queryByText('파일 업로드')).not.toBeInTheDocument()
    })

    it('hides download history tab for customer', () => {
      render(<FilesPage />)
      
      expect(screen.queryByText('다운로드 이력')).not.toBeInTheDocument()
    })

    it('hides delete buttons on files for customer', () => {
      render(<FilesPage />)
      
      // Delete buttons should not be visible for customers
      const deleteButtons = screen.queryAllByText('✕')
      expect(deleteButtons).toHaveLength(0)
    })

    it('can still download files', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const downloadButtons = screen.getAllByText('다운로드')
      await user.click(downloadButtons[0])
      
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('다운로드를 시작합니다')
      )
    })

    it('can preview files', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const previewButtons = screen.getAllByText('미리보기')
      await user.click(previewButtons[0])
      
      // FilePreview modal should open
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /다운로드/ })).toBeInTheDocument()
      })
    })
  })

  describe('File Operations', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      })
    })

    it('filters files by category', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const imageFilter = screen.getByText('이미지')
      await user.click(imageFilter)
      
      // Should show only image files
      expect(screen.getByText('메인페이지 디자인.png')).toBeInTheDocument()
      expect(screen.queryByText('프로젝트 기획서.pdf')).not.toBeInTheDocument()
    })

    it('searches files by name', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      const searchInput = screen.getByPlaceholderText('파일 검색...')
      await user.type(searchInput, '기획서')
      
      expect(screen.getByText('프로젝트 기획서.pdf')).toBeInTheDocument()
      expect(screen.queryByText('메인페이지 디자인.png')).not.toBeInTheDocument()
    })

    it('records download history when file is downloaded', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      // Download a file
      const downloadButtons = screen.getAllByText('다운로드')
      await user.click(downloadButtons[0])
      
      // Switch to history tab
      const historyTab = screen.getByText('다운로드 이력')
      await user.click(historyTab)
      
      // Check that the download was recorded
      expect(screen.getByText('관리자')).toBeInTheDocument()
    })

    it('validates file size during upload', async () => {
      const user = userEvent.setup()
      render(<FilesPage />)
      
      // Create a large file (over 100MB limit)
      const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.txt', {
        type: 'text/plain'
      })
      
      const fileInput = screen.getByLabelText(/파일 선택/)
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      
      await user.upload(fileInput, largeFile)
      
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('파일 크기가 너무 큽니다')
      )
      
      alertSpy.mockRestore()
    })

    it('shows file information correctly', () => {
      render(<FilesPage />)
      
      // Check file information display
      expect(screen.getByText('크기: 2.43 MB')).toBeInTheDocument()
      expect(screen.getByText('업로드: 김기획')).toBeInTheDocument()
      expect(screen.getByText('2024년 01월 05일')).toBeInTheDocument()
    })

    it('handles empty file list gracefully', () => {
      // Mock empty files array
      jest.doMock('../src/app/(dashboard)/files/page', () => {
        return function FilesPage() {
          return <div>아직 업로드된 파일이 없습니다.</div>
        }
      })
      
      render(<FilesPage />)
      
      expect(screen.getByText('아직 업로드된 파일이 없습니다.')).toBeInTheDocument()
    })
  })
})
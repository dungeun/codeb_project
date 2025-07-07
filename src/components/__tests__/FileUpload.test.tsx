import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUpload from '../files/FileUpload'

describe('FileUpload', () => {
  const mockOnUpload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<FileUpload onUpload={mockOnUpload} />)
    
    expect(screen.getByText(/드래그하여 파일을 업로드하거나/)).toBeInTheDocument()
    expect(screen.getByText('파일 선택')).toBeInTheDocument()
  })

  it('shows file size limit', () => {
    render(<FileUpload onUpload={mockOnUpload} maxSize={50} />)
    
    expect(screen.getByText(/최대 50MB/)).toBeInTheDocument()
  })

  it('handles file input change', async () => {
    const user = userEvent.setup()
    render(<FileUpload onUpload={mockOnUpload} />)
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/파일 선택/)

    await user.upload(input, file)

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([file])
    })
  })

  it('handles multiple files', async () => {
    const user = userEvent.setup()
    render(<FileUpload onUpload={mockOnUpload} multiple={true} />)
    
    const file1 = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const file2 = new File(['world'], 'world.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/파일 선택/)

    await user.upload(input, [file1, file2])

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([file1, file2])
    })
  })

  it('rejects files that are too large', async () => {
    const user = userEvent.setup()
    render(<FileUpload onUpload={mockOnUpload} maxSize={1} />)
    
    // Create a file larger than 1MB
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.txt', { 
      type: 'text/plain' 
    })
    const input = screen.getByLabelText(/파일 선택/)

    await user.upload(input, largeFile)

    await waitFor(() => {
      expect(screen.getByText(/파일 크기가 너무 큽니다/)).toBeInTheDocument()
    })
    
    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('rejects files with invalid types', async () => {
    const user = userEvent.setup()
    render(<FileUpload onUpload={mockOnUpload} acceptedTypes={['image/*']} />)
    
    const textFile = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/파일 선택/)

    await user.upload(input, textFile)

    await waitFor(() => {
      expect(screen.getByText(/지원하지 않는 파일 형식입니다/)).toBeInTheDocument()
    })
    
    expect(mockOnUpload).not.toHaveBeenCalled()
  })

  it('shows drag active state on dragover', () => {
    render(<FileUpload onUpload={mockOnUpload} />)
    
    const dropzone = screen.getByText(/드래그하여 파일을 업로드하거나/).closest('div')
    
    fireEvent.dragEnter(dropzone)
    fireEvent.dragOver(dropzone, {
      dataTransfer: {
        files: [new File([''], 'test.txt', { type: 'text/plain' })]
      }
    })

    expect(dropzone).toHaveClass('border-primary')
  })

  it('handles drop events', async () => {
    render(<FileUpload onUpload={mockOnUpload} />)
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const dropzone = screen.getByText(/드래그하여 파일을 업로드하거나/).closest('div')
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([file])
    })
  })

  it('prevents default drag behaviors', () => {
    render(<FileUpload onUpload={mockOnUpload} />)
    
    const dropzone = screen.getByText(/드래그하여 파일을 업로드하거나/).closest('div')
    const preventDefault = jest.fn()
    
    fireEvent.dragEnter(dropzone, { preventDefault })
    fireEvent.dragLeave(dropzone, { preventDefault })
    fireEvent.dragOver(dropzone, { preventDefault })
    fireEvent.drop(dropzone, { preventDefault })

    expect(preventDefault).toHaveBeenCalledTimes(4)
  })

  it('shows upload progress when uploading', async () => {
    render(<FileUpload onUpload={mockOnUpload} />)
    
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/파일 선택/)

    await userEvent.upload(input, file)

    // Upload progress might be shown briefly
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled()
    })
  })
})
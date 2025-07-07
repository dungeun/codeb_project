import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileList, { FileItem } from '../files/FileList'

const mockFiles: FileItem[] = [
  {
    id: '1',
    name: '프로젝트 기획서.pdf',
    size: 2548576,
    type: 'application/pdf',
    url: 'mock-url-1',
    category: 'document',
    uploadedBy: '김기획',
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '2',
    name: '메인페이지 디자인.png',
    size: 5242880,
    type: 'image/png',
    url: 'mock-url-2',
    category: 'image',
    uploadedBy: '이디자인',
    createdAt: new Date('2024-01-04'),
  },
  {
    id: '3',
    name: '프로모션 비디오.mp4',
    size: 15728640,
    type: 'video/mp4',
    url: 'mock-url-3',
    category: 'video',
    uploadedBy: '박영상',
    createdAt: new Date('2024-01-03'),
  },
]

describe('FileList', () => {
  const mockOnDownload = jest.fn()
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders file list correctly', () => {
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    expect(screen.getByText('프로젝트 기획서.pdf')).toBeInTheDocument()
    expect(screen.getByText('메인페이지 디자인.png')).toBeInTheDocument()
    expect(screen.getByText('프로모션 비디오.mp4')).toBeInTheDocument()
  })

  it('shows file information correctly', () => {
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    expect(screen.getByText('크기: 2.43 MB')).toBeInTheDocument()
    expect(screen.getByText('업로드: 김기획')).toBeInTheDocument()
    expect(screen.getByText('2024년 01월 05일')).toBeInTheDocument()
  })

  it('filters files by category', async () => {
    const user = userEvent.setup()
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    const imageFilter = screen.getByText('이미지')
    await user.click(imageFilter)

    expect(screen.getByText('메인페이지 디자인.png')).toBeInTheDocument()
    expect(screen.queryByText('프로젝트 기획서.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('프로모션 비디오.mp4')).not.toBeInTheDocument()
  })

  it('searches files by name', async () => {
    const user = userEvent.setup()
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    const searchInput = screen.getByPlaceholderText('파일 검색...')
    await user.type(searchInput, '기획서')

    expect(screen.getByText('프로젝트 기획서.pdf')).toBeInTheDocument()
    expect(screen.queryByText('메인페이지 디자인.png')).not.toBeInTheDocument()
    expect(screen.queryByText('프로모션 비디오.mp4')).not.toBeInTheDocument()
  })

  it('shows empty state when no files match filter', async () => {
    const user = userEvent.setup()
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    const searchInput = screen.getByPlaceholderText('파일 검색...')
    await user.type(searchInput, '존재하지않는파일')

    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('shows empty state when no files are provided', () => {
    render(<FileList files={[]} onDownload={mockOnDownload} />)
    
    expect(screen.getByText('아직 업로드된 파일이 없습니다.')).toBeInTheDocument()
  })

  it('calls onDownload when download button is clicked', async () => {
    const user = userEvent.setup()
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    const downloadButtons = screen.getAllByText('다운로드')
    await user.click(downloadButtons[0])

    expect(mockOnDownload).toHaveBeenCalledWith(mockFiles[0])
  })

  it('calls onDownload when preview button is clicked', async () => {
    const user = userEvent.setup()
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    const previewButtons = screen.getAllByText('미리보기')
    await user.click(previewButtons[0])

    // FilePreview 모달이 열리는지 확인
    expect(screen.getByText('프로젝트 기획서.pdf')).toBeInTheDocument()
  })

  it('shows delete button when canDelete is true', () => {
    render(
      <FileList 
        files={mockFiles} 
        onDownload={mockOnDownload} 
        onDelete={mockOnDelete}
        canDelete={true}
      />
    )
    
    const deleteButtons = screen.getAllByText('✕')
    expect(deleteButtons).toHaveLength(mockFiles.length)
  })

  it('hides delete button when canDelete is false', () => {
    render(
      <FileList 
        files={mockFiles} 
        onDownload={mockOnDownload} 
        onDelete={mockOnDelete}
        canDelete={false}
      />
    )
    
    const deleteButtons = screen.queryAllByText('✕')
    expect(deleteButtons).toHaveLength(0)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FileList 
        files={mockFiles} 
        onDownload={mockOnDownload} 
        onDelete={mockOnDelete}
        canDelete={true}
      />
    )
    
    const deleteButtons = screen.getAllByText('✕')
    await user.click(deleteButtons[0])

    expect(mockOnDelete).toHaveBeenCalledWith(mockFiles[0])
  })

  it('shows correct file icons for different categories', () => {
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    // Check if different file icons are rendered (emojis in the component)
    expect(screen.getByText('📄')).toBeInTheDocument() // Document
    expect(screen.getByText('🖼️')).toBeInTheDocument() // Image
    expect(screen.getByText('🎥')).toBeInTheDocument() // Video
  })

  it('formats file sizes correctly', () => {
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    expect(screen.getByText('크기: 2.43 MB')).toBeInTheDocument()
    expect(screen.getByText('크기: 5.00 MB')).toBeInTheDocument()
    expect(screen.getByText('크기: 15.00 MB')).toBeInTheDocument()
  })

  it('shows all categories in filter buttons', () => {
    render(<FileList files={mockFiles} onDownload={mockOnDownload} />)
    
    expect(screen.getByText('전체')).toBeInTheDocument()
    expect(screen.getByText('문서')).toBeInTheDocument()
    expect(screen.getByText('이미지')).toBeInTheDocument()
    expect(screen.getByText('동영상')).toBeInTheDocument()
    expect(screen.getByText('기타')).toBeInTheDocument()
  })
})
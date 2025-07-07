import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata,
  uploadBytesResumable,
  UploadTask
} from 'firebase/storage'
import { storage } from './firebase'

export interface FileUploadProgress {
  progress: number
  bytesTransferred: number
  totalBytes: number
}

export interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
  uploadedAt: string
  path: string
}

export class StorageService {
  private static instance: StorageService

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  // 파일 업로드 (진행률 콜백 포함)
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    const fileName = `${Date.now()}_${file.name}`
    const fileRef = ref(storage, `${path}/${fileName}`)

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          
          if (onProgress) {
            onProgress({
              progress,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            })
          }
        },
        (error) => {
          console.error('파일 업로드 실패:', error)
          reject(error)
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            const metadata = await getMetadata(uploadTask.snapshot.ref)
            
            const uploadedFile: UploadedFile = {
              url: downloadURL,
              name: file.name,
              size: metadata.size,
              type: metadata.contentType || file.type,
              uploadedAt: metadata.timeCreated,
              path: `${path}/${fileName}`
            }
            
            resolve(uploadedFile)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  // 여러 파일 업로드
  async uploadMultipleFiles(
    files: File[],
    path: string,
    onProgress?: (fileIndex: number, progress: FileUploadProgress) => void
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file, index) => 
      this.uploadFile(file, path, (progress) => {
        if (onProgress) {
          onProgress(index, progress)
        }
      })
    )

    return Promise.all(uploadPromises)
  }

  // 이미지 업로드 (리사이징 포함)
  async uploadImage(
    file: File,
    path: string,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    const resizedFile = await this.resizeImage(file, maxWidth, maxHeight, quality)
    return this.uploadFile(resizedFile, path, onProgress)
  }

  // 이미지 리사이징
  private async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // 비율 계산
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height)

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(resizedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // 파일 삭제
  async deleteFile(filePath: string): Promise<void> {
    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
  }

  // 폴더 내 파일 목록 가져오기
  async listFiles(folderPath: string): Promise<UploadedFile[]> {
    const folderRef = ref(storage, folderPath)
    const result = await listAll(folderRef)
    
    const files: UploadedFile[] = []
    
    for (const itemRef of result.items) {
      try {
        const [url, metadata] = await Promise.all([
          getDownloadURL(itemRef),
          getMetadata(itemRef)
        ])
        
        files.push({
          url,
          name: metadata.name,
          size: metadata.size,
          type: metadata.contentType || '',
          uploadedAt: metadata.timeCreated,
          path: itemRef.fullPath
        })
      } catch (error) {
        console.error('파일 정보 로드 실패:', error)
      }
    }
    
    return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  // 파일 메타데이터 가져오기
  async getFileMetadata(filePath: string) {
    const fileRef = ref(storage, filePath)
    return await getMetadata(fileRef)
  }

  // 파일 다운로드 URL 가져오기
  async getDownloadURL(filePath: string): Promise<string> {
    const fileRef = ref(storage, filePath)
    return await getDownloadURL(fileRef)
  }

  // 파일 타입 검증
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -2))
      }
      return file.type === type
    })
  }

  // 파일 크기 검증
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  // 파일 이름 정리 (특수문자 제거)
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  // 파일 크기를 읽기 쉬운 형태로 변환
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 프로젝트별 파일 경로 생성
  getProjectFilePath(projectId: string, category: string, fileName: string): string {
    const sanitizedFileName = this.sanitizeFileName(fileName)
    return `projects/${projectId}/${category}/${sanitizedFileName}`
  }

  // 채팅 파일 경로 생성
  getChatFilePath(roomId: string, fileName: string): string {
    const sanitizedFileName = this.sanitizeFileName(fileName)
    return `chat/${roomId}/${sanitizedFileName}`
  }

  // 사용자 아바타 경로 생성
  getUserAvatarPath(userId: string, fileName: string): string {
    const sanitizedFileName = this.sanitizeFileName(fileName)
    return `users/${userId}/avatar/${sanitizedFileName}`
  }
}

export default StorageService.getInstance()
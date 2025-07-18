// 서비스 URL 설정
export const getServiceUrls = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 프로덕션 환경에서는 환경변수 사용
  if (isProduction) {
    return {
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || '',
      workflowUrl: process.env.NEXT_PUBLIC_WORKFLOW_API_URL || '',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || ''
    }
  }
  
  // 개발 환경에서는 자동 감지
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    
    // 로컬 개발
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        socketUrl: 'http://localhost:3003',
        workflowUrl: 'http://localhost:3004',
        apiUrl: 'http://localhost:3000'
      }
    }
    
    // 네트워크 환경 (같은 네트워크의 다른 기기에서 접속)
    return {
      socketUrl: `${protocol}//${hostname}:3003`,
      workflowUrl: `${protocol}//${hostname}:3004`,
      apiUrl: `${protocol}//${hostname}:3000`
    }
  }
  
  // 서버 사이드 렌더링
  return {
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3003',
    workflowUrl: process.env.NEXT_PUBLIC_WORKFLOW_API_URL || 'http://localhost:3004',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }
}

// 서비스 헬스 체크
export const checkServiceHealth = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(1000)
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.status === 'ok'
    }
  } catch (error) {
    // 연결 실패
  }
  
  return false
}

// 모든 서비스 상태 확인
export const checkAllServices = async () => {
  const urls = getServiceUrls()
  
  const [socketHealth, workflowHealth] = await Promise.all([
    checkServiceHealth(urls.socketUrl),
    checkServiceHealth(urls.workflowUrl)
  ])
  
  return {
    socket: {
      url: urls.socketUrl,
      healthy: socketHealth
    },
    workflow: {
      url: urls.workflowUrl,
      healthy: workflowHealth
    }
  }
}

// 서비스 URL 캐싱
const SERVICE_URL_CACHE_KEY = 'codeb_service_urls'
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export const getCachedServiceUrls = () => {
  if (typeof window === 'undefined') return null
  
  const cached = localStorage.getItem(SERVICE_URL_CACHE_KEY)
  if (!cached) return null
  
  try {
    const { urls, timestamp } = JSON.parse(cached)
    
    // 캐시 만료 확인
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(SERVICE_URL_CACHE_KEY)
      return null
    }
    
    return urls
  } catch (error) {
    localStorage.removeItem(SERVICE_URL_CACHE_KEY)
    return null
  }
}

export const setCachedServiceUrls = (urls: any) => {
  if (typeof window === 'undefined') return
  
  localStorage.setItem(SERVICE_URL_CACHE_KEY, JSON.stringify({
    urls,
    timestamp: Date.now()
  }))
}

// 스마트 서비스 URL 감지
export const detectServiceUrls = async () => {
  // 1. 캐시 확인
  const cached = getCachedServiceUrls()
  if (cached) {
    // 캐시된 URL이 여전히 유효한지 빠르게 확인
    const health = await checkServiceHealth(cached.workflowUrl)
    if (health) return cached
  }
  
  // 2. 환경 기반 URL 가져오기
  const urls = getServiceUrls()
  
  // 3. 헬스 체크
  const services = await checkAllServices()
  
  // 4. 건강한 서비스만 포함
  const validUrls = {
    socketUrl: services.socket.healthy ? services.socket.url : null,
    workflowUrl: services.workflow.healthy ? services.workflow.url : null,
    apiUrl: urls.apiUrl
  }
  
  // 5. 캐싱
  if (validUrls.workflowUrl || validUrls.socketUrl) {
    setCachedServiceUrls(validUrls)
  }
  
  return validUrls
}
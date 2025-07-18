/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'codeb-web.firebasestorage.app', 'lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Firebase 관련 설정
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        'child_process': false,
      }
    }

    // undici 모듈 문제 해결
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,
    }
    
    return config
  },
}

module.exports = nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/about%20us',
        destination: '/about-us',
      },
      {
        source: '/privacy%20policy',
        destination: '/privacy-policy',
      },
      {
        source: '/contact%20us',
        destination: '/contact-us',
      },
      {
        source: '/quality%20tv',
        destination: '/quality-tv',
      },
    ]
  },
}

export default nextConfig

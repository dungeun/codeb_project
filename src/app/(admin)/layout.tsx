'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/layout/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== 'admin')) {
      router.push('/login')
    }
  }, [userProfile, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
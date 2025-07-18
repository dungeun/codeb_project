'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getDatabase, ref, onValue, off, set, push, update, remove } from 'firebase/database'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { app } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  businessNumber?: string
  industry?: string
  website?: string
  notes?: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'inactive'
  projects?: number
}

export default function ClientsPage() {
  const { userProfile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [showDetail, setShowDetail] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    businessNumber: '',
    industry: '',
    website: '',
    notes: '',
    createAccount: true,
    password: ''
  })

  // Firebase에서 거래처 목록 가져오기
  useEffect(() => {
    const db = getDatabase(app)
    const usersRef = ref(db, 'users')
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const clientsList: Client[] = Object.entries(data)
          .filter(([_, user]: [string, any]) => user.role === 'customer')
          .map(([id, user]: [string, any]) => ({
            id,
            companyName: user.companyName || user.displayName || '미등록',
            contactPerson: user.contactPerson || user.displayName || '',
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            businessNumber: user.businessNumber || '',
            industry: user.industry || '',
            website: user.website || '',
            notes: user.notes || '',
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
            status: user.status || 'active',
            projects: user.projects || 0
          }))
        setClients(clientsList)
      }
      setLoading(false)
    })

    return () => off(usersRef)
  }, [])

  // 거래처 검색 및 필터링
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // 거래처 등록/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const db = getDatabase(app)
      
      if (editingClient) {
        // 기존 거래처 수정
        const updates: any = {
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          phone: formData.phone,
          address: formData.address,
          businessNumber: formData.businessNumber,
          industry: formData.industry,
          website: formData.website,
          notes: formData.notes,
          updatedAt: new Date().toISOString()
        }
        
        await update(ref(db, `users/${editingClient.id}`), updates)
        toast.success('거래처 정보가 수정되었습니다.')
      } else {
        // 새 거래처 등록
        if (formData.createAccount) {
          // Firebase Auth에 계정 생성
          const auth = getAuth(app)
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            formData.password || 'customer123!'
          )
          
          await updateProfile(userCredential.user, {
            displayName: formData.contactPerson
          })
          
          // 사용자 정보 저장
          await set(ref(db, `users/${userCredential.user.uid}`), {
            uid: userCredential.user.uid,
            email: formData.email,
            displayName: formData.contactPerson,
            companyName: formData.companyName,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            address: formData.address,
            businessNumber: formData.businessNumber,
            industry: formData.industry,
            website: formData.website,
            notes: formData.notes,
            role: 'customer',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOnline: false
          })
          
          toast.success('거래처가 등록되었습니다.')
        }
      }
      
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving client:', error)
      if (error.code === 'auth/email-already-in-use') {
        toast.error('이미 사용 중인 이메일입니다.')
      } else if (error.code === 'auth/weak-password') {
        toast.error('비밀번호는 6자 이상이어야 합니다.')
      } else {
        toast.error('거래처 저장 중 오류가 발생했습니다.')
      }
    }
  }

  // 거래처 삭제
  const handleDelete = async (clientId: string) => {
    if (!confirm('정말 이 거래처를 삭제하시겠습니까?')) return
    
    try {
      const db = getDatabase(app)
      await remove(ref(db, `users/${clientId}`))
      toast.success('거래처가 삭제되었습니다.')
      setShowDetail(null)
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('거래처 삭제 중 오류가 발생했습니다.')
    }
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      businessNumber: '',
      industry: '',
      website: '',
      notes: '',
      createAccount: true,
      password: ''
    })
  }

  // 수정 모드로 모달 열기
  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      address: client.address,
      businessNumber: client.businessNumber || '',
      industry: client.industry || '',
      website: client.website || '',
      notes: client.notes || '',
      createAccount: false,
      password: ''
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래처 관리</h1>
          <p className="text-gray-600 mt-1">거래처를 등록하고 관리합니다.</p>
        </div>
        
        {userProfile?.role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + 거래처 등록
          </button>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="거래처명, 담당자, 이메일 검색..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
        >
          <option value="all">전체 ({clients.length})</option>
          <option value="active">활성 ({clients.filter(c => c.status === 'active').length})</option>
          <option value="inactive">비활성 ({clients.filter(c => c.status === 'inactive').length})</option>
        </select>
      </div>

      {/* 거래처 목록 */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? '검색 결과가 없습니다' : '등록된 거래처가 없습니다'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 거래처를 등록해보세요.'}
          </p>
          {userProfile?.role === 'admin' && !searchTerm && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary mx-auto"
            >
              거래처 등록하기
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setShowDetail(showDetail === client.id ? null : client.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.companyName}</h3>
                  <p className="text-sm text-gray-600">{client.contactPerson}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  client.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {client.status === 'active' ? '활성' : '비활성'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {client.phone}
                  </div>
                )}
                {client.industry && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {client.industry}
                  </div>
                )}
              </div>

              {/* 상세 정보 */}
              {showDetail === client.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 pt-4 border-t space-y-2"
                >
                  {client.address && (
                    <div className="text-sm">
                      <span className="text-gray-500">주소:</span>
                      <p className="text-gray-700">{client.address}</p>
                    </div>
                  )}
                  {client.businessNumber && (
                    <div className="text-sm">
                      <span className="text-gray-500">사업자번호:</span>
                      <span className="ml-2 text-gray-700">{client.businessNumber}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="text-sm">
                      <span className="text-gray-500">웹사이트:</span>
                      <a href={client.website} target="_blank" rel="noopener noreferrer" 
                         className="ml-2 text-primary hover:underline">
                        {client.website}
                      </a>
                    </div>
                  )}
                  {client.notes && (
                    <div className="text-sm">
                      <span className="text-gray-500">메모:</span>
                      <p className="text-gray-700">{client.notes}</p>
                    </div>
                  )}
                  
                  {userProfile?.role === 'admin' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(client)
                        }}
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(client.id)
                        }}
                        className="flex-1 btn btn-secondary text-sm text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* 거래처 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingClient ? '거래처 수정' : '거래처 등록'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명 *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    담당자명 *
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                    disabled={!!editingClient}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자번호
                  </label>
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업종
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    웹사이트
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                {!editingClient && (
                  <>
                    <div className="md:col-span-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.createAccount}
                          onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">로그인 계정 생성</span>
                      </label>
                    </div>

                    {formData.createAccount && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          초기 비밀번호
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          placeholder="비어있으면 customer123! 사용"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 btn btn-secondary"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  {editingClient ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function CustomerReviewPage() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      alert('별점을 선택해주세요.')
      return
    }
    if (!review.trim()) {
      alert('리뷰 내용을 입력해주세요.')
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-4"
        >
          ✅
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">리뷰가 제출되었습니다!</h2>
        <p className="text-gray-600">소중한 의견 감사합니다.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">프로젝트 리뷰</h2>
      <p className="text-sm text-gray-600 mb-6">프로젝트에 대한 평가와 의견을 남겨주세요</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 별점 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전반적인 만족도
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-3xl transition-colors"
              >
                {star <= (hoverRating || rating) ? '⭐' : '☆'}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {rating > 0 && `${rating}점을 선택하셨습니다.`}
          </p>
        </div>

        {/* 리뷰 내용 */}
        <div>
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
            상세 리뷰
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="프로젝트 진행 과정, 결과물, 소통 등에 대한 의견을 자유롭게 작성해주세요."
          />
        </div>

        {/* 카테고리별 평가 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">세부 평가</h3>
          {[
            { label: '프로젝트 결과물', id: 'result' },
            { label: '일정 준수', id: 'timeline' },
            { label: '소통 및 협업', id: 'communication' },
            { label: '전문성', id: 'expertise' },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{item.label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className="text-lg transition-colors hover:text-yellow-500"
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-6 py-2 text-gray-700 hover:text-gray-900"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            리뷰 제출
          </button>
        </div>
      </form>
    </div>
  )
}
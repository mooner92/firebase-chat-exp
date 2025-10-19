'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  const checkDatabaseState = async () => {
    try {
      setDebugInfo('데이터베이스 상태 확인 중...\n')
      
      // 사용자 목록 확인
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
      
      if (usersError) {
        setDebugInfo(prev => prev + `사용자 테이블 오류: ${usersError.message}\n`)
        return
      }

      // 메시지 목록 확인
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
      
      if (messagesError) {
        setDebugInfo(prev => prev + `메시지 테이블 오류: ${messagesError.message}\n`)
        return
      }

      // 현재 로컬스토리지 사용자
      const localUserId = localStorage.getItem('chatUserId')
      const localUserName = localStorage.getItem('chatUserName')
      const localUserColor = localStorage.getItem('chatUserColor')

      let info = '=== 데이터베이스 상태 ===\n'
      info += `사용자 수: ${users?.length || 0}\n`
      info += `메시지 수: ${messages?.length || 0}\n\n`
      
      info += '=== 로컬 사용자 정보 ===\n'
      info += `ID: ${localUserId || '없음'}\n`
      info += `이름: ${localUserName || '없음'}\n`
      info += `색상: ${localUserColor || '없음'}\n\n`
      
      if (localUserId) {
        const userInDb = users?.find(u => u.id === localUserId)
        info += `DB에 사용자 존재: ${userInDb ? '예' : '아니오'}\n\n`
      }
      
      info += '=== 사용자 목록 ===\n'
      users?.forEach(user => {
        info += `${user.name} (${user.id.substring(0, 8)}...)\n`
      })
      
      info += '\n=== 최근 메시지 (최대 5개) ===\n'
      messages?.slice(-5).forEach(msg => {
        const user = users?.find(u => u.id === msg.user_id)
        info += `${user?.name || '알 수 없음'}: ${msg.text}\n`
      })

      setDebugInfo(info)
    } catch (error) {
      setDebugInfo(`오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('chatUserId')
    localStorage.removeItem('chatUserName')
    localStorage.removeItem('chatUserColor')
    setDebugInfo(prev => prev + '\n로컬스토리지가 cleared됨. 페이지를 새로고침하세요.')
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
      >
        Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96 max-h-80 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={checkDatabaseState}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
        >
          DB 상태 확인
        </button>
        
        <button
          onClick={clearLocalStorage}
          className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        >
          로컬스토리지 초기화
        </button>
      </div>
      
      {debugInfo && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {debugInfo}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface MessageInputProps {
  currentUser: {
    id: string
    name: string
    color: string
  }
}

export default function MessageInput({ currentUser }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      // 핵심 수정: 메시지 전송 전 사용자 존재 확인 및 생성
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('id', currentUser.id)
        .single()

      if (!userExists) {
        // 사용자가 없으면 먼저 생성
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: currentUser.id,
            name: currentUser.name,
            color: currentUser.color
          })

        if (userError && !userError.message.includes('duplicate key')) {
          console.error('사용자 생성 실패:', userError)
          alert('사용자 정보 생성에 실패했습니다. 페이지를 새로고침해주세요.')
          return
        }
      }

      // 메시지 전송
      const { error } = await supabase
        .from('messages')
        .insert({
          text: message.trim(),
          timestamp: Date.now(),
          user_id: currentUser.id
        })

      if (error) throw error

      setMessage('')
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      alert(`메시지 전송에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  return (
    <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t bg-white">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-600 placeholder:font-medium text-gray-800 font-medium"
        maxLength={500}
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={!message.trim()}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        전송
      </button>
    </form>
  )
}
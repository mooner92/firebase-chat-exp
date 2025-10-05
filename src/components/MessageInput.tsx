'use client'

import { useState } from 'react'
import { ref, push, serverTimestamp } from 'firebase/database'
import { database } from '@/lib/firebase'

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
      const messagesRef = ref(database, 'messages')
      await push(messagesRef, {
        text: message.trim(),
        timestamp: serverTimestamp(),
        user: currentUser
      })

      setMessage('')
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t bg-white">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
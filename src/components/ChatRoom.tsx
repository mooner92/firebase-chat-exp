// src/components/ChatRoom.tsx
'use client'

import { useState, useEffect } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { database } from '@/lib/firebase'
import { Message as MessageType } from '@/types/chat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { v4 as uuidv4 } from 'uuid'

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8BBD9', '#A8E6CF', '#FFD3A5', '#FD6A9A', '#C7CEEA'
]

export default function ChatRoom() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    color: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    // 사용자 정보 초기화
    const getIPBasedUsername = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        const ip = data.ip
        // Extract first 6 characters of IP
        return `익명${ip.substring(0, 7)}`
      } catch (error) {
        // Fallback to random number if IP fetch fails
        return `익명${Math.floor(Math.random() * 1000)}`
      }
    }

    const initializeUser = async () => {
      let userId = localStorage.getItem('chatUserId') || ''
      let userName = localStorage.getItem('chatUserName') || ''
      let userColor = localStorage.getItem('chatUserColor') || ''
    
      if (!userId) {
        userId = uuidv4()
        userName = await getIPBasedUsername()
        userColor = colors[Math.floor(Math.random() * colors.length)]
        
        localStorage.setItem('chatUserId', userId)
        localStorage.setItem('chatUserName', userName)
        localStorage.setItem('chatUserColor', userColor)
      }
    
      setCurrentUser({ id: userId, name: userName, color: userColor })
    }

    initializeUser()

    // 실시간 메시지 리스너
    const messagesRef = ref(database, 'messages')
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        const data = snapshot.val()
        if (data) {
          const messageList: MessageType[] = Object.entries(data).map(([id, message]: [string, any]) => ({
            id,
            ...message,
            timestamp: message.timestamp || Date.now()
          }))
          setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp))
        } else {
          setMessages([])
        }
        setConnectionStatus('connected')
      } catch (error) {
        console.error('메시지 로드 실패:', error)
        setConnectionStatus('disconnected')
      }
      setIsLoading(false)
    }, (error) => {
      console.error('데이터베이스 연결 실패:', error)
      setConnectionStatus('disconnected')
      setIsLoading(false)
    })

    return () => off(messagesRef, 'value', unsubscribe)
  }, [])

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return '연결 중...'
      case 'connected':
        return '연결됨'
      case 'disconnected':
        return '연결 끊김'
      default:
        return '알 수 없음'
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'text-yellow-600'
      case 'connected':
        return 'text-green-600'
      case 'disconnected':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">채팅방에 연결 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg">
      {/* 헤더 */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">실시간 채팅</h1>
          <p className="text-gray-600 text-sm">
            현재 {messages.length}개의 메시지 • 
            <span className={`ml-1 ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentUser.color }}
          ></div>
          <span className="text-sm text-gray-600">{currentUser.name}</span>
        </div>
      </div>
      
      {/* 메시지 리스트 */}
      <MessageList messages={messages} />
      
      {/* 메시지 입력 */}
      <MessageInput currentUser={currentUser} />
    </div>
  )
}
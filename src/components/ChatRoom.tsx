// src/components/ChatRoom.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Message as MessageType } from '@/types/chat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

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
    const getIPBasedUsername = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        const ip = data.ip
        return `익명${ip.substring(ip.length - 4)}`
      } catch {
        return `익명${Math.floor(Math.random() * 10000)}`
      }
    }

    const initializeUser = async () => {
      let userId = localStorage.getItem('chatUserId') || ''
      let userName = localStorage.getItem('chatUserName') || ''
      let userColor = localStorage.getItem('chatUserColor') || ''
    
      if (!userId) {
        userId = crypto.randomUUID()
        userName = await getIPBasedUsername()
        userColor = colors[Math.floor(Math.random() * colors.length)]
        
        // Supabase에 사용자 저장 (핵심 수정: 에러 처리 개선)
        const { error } = await supabase
          .from('users')
          .insert({ id: userId, name: userName, color: userColor })
        
        if (error && !error.message.includes('duplicate key')) {
          console.error('사용자 저장 실패:', error)
          // 여기서 return하지 말고 계속 진행
        }
        
        localStorage.setItem('chatUserId', userId)
        localStorage.setItem('chatUserName', userName)
        localStorage.setItem('chatUserColor', userColor)
      } else {
        // 기존 사용자 정보 확인
        const { data: userData } = await supabase
          .from('users')
          .select('name, color')
          .eq('id', userId)
          .single()
        
        if (userData) {
          userName = userData.name
          userColor = userData.color
          localStorage.setItem('chatUserName', userName)
          localStorage.setItem('chatUserColor', userColor)
        } else {
          // 사용자가 DB에 없으면 다시 생성
          const { error } = await supabase
            .from('users')
            .insert({ id: userId, name: userName, color: userColor })
          
          if (error && !error.message.includes('duplicate key')) {
            console.error('사용자 재생성 실패:', error)
          }
        }
      }
    
      setCurrentUser({ id: userId, name: userName, color: userColor })
    }

    const loadMessages = async () => {
      try {
        // 메시지와 사용자 정보를 별도로 가져와서 조합
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true })
        
        if (messagesError) throw messagesError
        
        // 사용자 정보도 가져오기
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
        
        if (usersError) throw usersError
        
        // 메시지와 사용자 정보 조합
        const messageList = messagesData?.map(msg => {
          const user = usersData?.find(u => u.id === msg.user_id)
          return {
            id: msg.id,
            text: msg.text,
            timestamp: msg.timestamp,
            user_id: msg.user_id,
            created_at: msg.created_at,
            user: {
              id: msg.user_id,
              name: user?.name || 'Unknown',
              color: user?.color || '#000000'
            }
          }
        }) || []
        
        setMessages(messageList)
        setConnectionStatus('connected')
        console.log('메시지 로드 완료:', messageList.length, '개')
      } catch (error) {
        console.error('메시지 로드 실패:', error)
        setConnectionStatus('disconnected')
      }
      setIsLoading(false)
    }

    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages' 
          }, 
          async (payload) => {
            console.log('새 메시지 수신:', payload)
            try {
              // 새 메시지가 추가되면 사용자 정보와 함께 가져오기
              const { data: userData } = await supabase
                .from('users')
                .select('name, color')
                .eq('id', payload.new.user_id)
                .single()
              
              const newMessage: MessageType = {
                id: payload.new.id,
                text: payload.new.text,
                timestamp: payload.new.timestamp,
                user_id: payload.new.user_id,
                created_at: payload.new.created_at,
                user: {
                  id: payload.new.user_id,
                  name: userData?.name || 'Unknown',
                  color: userData?.color || '#000000'
                }
              }
              
              setMessages(prev => [...prev, newMessage])
            } catch (error) {
              console.error('실시간 메시지 처리 실패:', error)
              // 에러가 발생해도 메시지 리스트를 다시 로드
              loadMessages()
            }
          }
        )
        .subscribe((status) => {
          console.log('구독 상태:', status)
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected')
          }
        })

      return () => {
        console.log('구독 해제')
        supabase.removeChannel(channel)
      }
    }

    initializeUser()
    loadMessages()
    const cleanup = setupRealtimeSubscription()

    return cleanup
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
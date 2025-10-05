// src/components/Message.tsx
import { Message as MessageType } from '@/types/chat'

interface MessageProps {
  message: MessageType
}

export default function Message({ message }: MessageProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col mb-4 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <span 
          className="font-semibold text-sm"
          style={{ color: message.user.color }}
        >
          {message.user.name}
        </span>
        <span className="text-xs text-gray-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <p className="text-gray-800 break-words leading-relaxed">{message.text}</p>
    </div>
  )
}
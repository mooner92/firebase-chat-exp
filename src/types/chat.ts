export interface User {
  id: string
  name: string
  color: string
  created_at?: string
}

export interface Message {
  id: string
  text: string
  timestamp: number
  user_id: string
  created_at?: string
  user?: User  // JOIN으로 가져올 때 사용
}
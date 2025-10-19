import { supabase } from './supabase'

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8BBD9', '#A8E6CF', '#FFD3A5', '#FD6A9A', '#C7CEEA'
]

export const getIPBasedUsername = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    const ip = data.ip
    return `익명${ip.substring(ip.length - 4)}`
  } catch {
    return `익명${Math.floor(Math.random() * 10000)}`
  }
}

export const ensureUserExists = async (userId: string, userName: string, userColor: string): Promise<boolean> => {
  try {
    // 먼저 사용자가 존재하는지 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return true
    }

    // 사용자가 없으면 생성
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: userName,
        color: userColor
      })

    if (error) {
      console.error('사용자 생성 실패:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('사용자 확인/생성 중 오류:', error)
    return false
  }
}

export const createNewUser = async (): Promise<{ id: string; name: string; color: string } | null> => {
  try {
    const userId = crypto.randomUUID()
    const userName = await getIPBasedUsername()
    const userColor = colors[Math.floor(Math.random() * colors.length)]

    const success = await ensureUserExists(userId, userName, userColor)
    
    if (success) {
      return { id: userId, name: userName, color: userColor }
    }
    
    return null
  } catch (error) {
    console.error('새 사용자 생성 실패:', error)
    return null
  }
}

export const getUserFromStorage = (): { id: string; name: string; color: string } | null => {
  const userId = localStorage.getItem('chatUserId')
  const userName = localStorage.getItem('chatUserName')
  const userColor = localStorage.getItem('chatUserColor')

  if (userId && userName && userColor) {
    return { id: userId, name: userName, color: userColor }
  }

  return null
}

export const saveUserToStorage = (user: { id: string; name: string; color: string }): void => {
  localStorage.setItem('chatUserId', user.id)
  localStorage.setItem('chatUserName', user.name)
  localStorage.setItem('chatUserColor', user.color)
}

export const clearUserFromStorage = (): void => {
  localStorage.removeItem('chatUserId')
  localStorage.removeItem('chatUserName')
  localStorage.removeItem('chatUserColor')
}
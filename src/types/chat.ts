export interface User {
    id: string
    name: string
    color: string
  }
  
  export interface Message {
    id: string
    text: string
    timestamp: number
    user: User
  }
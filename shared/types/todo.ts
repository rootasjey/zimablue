export interface Todo {
  id: number
  title: string
  description: string
  due_date: string // YYYY-MM-DD format
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  user_id: number
}

export interface TodoFormData {
  title: string
  description?: string
  due_date: string
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
}


'use client'
import { useState, useEffect } from 'react'
import supabase from '../../utils/supabase'
import NewTodo from '../../components/NewTodo'

export default function TodosPage() {
  const [todos, setTodos] = useState<any[]>([])

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*')
    setTodos(data)
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Todo List</h1>
      <NewTodo reload={fetchTodos} />
      <div className="mt-6">
        {todos.map((todo) => (
          <p key={todo.id} className="p-2 border-b border-gray-200">
            {todo.title}
          </p>
        ))}
      </div>
    </div>
  )
}

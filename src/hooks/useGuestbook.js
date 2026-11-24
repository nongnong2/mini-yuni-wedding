import { useCallback, useEffect, useState } from 'react'
import { LIMITS, addMessage, deleteMessage, loadMessages } from '../utils/guestbook'

// 방명록 글 목록과 쓰기·삭제. status: loading, ok, error
export function useGuestbook() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let alive = true // 화면이 닫힌 뒤에 도착한 글은 무시
    loadMessages()
      .then((loaded) => {
        if (!alive) return
        // 불러오는 사이에 내가 쓴 글이 있으면 함께 보여줌
        setMessages((mine) => [...loaded, ...mine.filter((m) => !loaded.some((l) => l.id === m.id))].slice(-LIMITS.messages))
        setStatus('ok')
      })
      .catch(() => { if (alive) setStatus('error') })
    return () => { alive = false }
  }, [])

  const add = useCallback(async (form) => {
    const message = await addMessage(form)
    setMessages((list) => [...list, message].slice(-LIMITS.messages))
    return message
  }, [])
  const remove = useCallback(async (id, password) => {
    await deleteMessage(id, password)
    setMessages((list) => list.filter((m) => m.id !== id))
  }, [])

  return { messages, status, add, remove }
}

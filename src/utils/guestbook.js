import { initializeApp } from 'firebase/app'
// lite: 실시간 기능을 뺀 가벼운 버전
import { collection, doc, getDocs, getFirestore, limit, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore/lite'
import { firebaseConfig } from '../data/firebase'

// 글자 수와 글 개수의 한도. 바꾸면 firestore.rules도 함께 바꿔야 함 (password는 최소 글자 수)
export const LIMITS = { name: 10, text: 200, password: 6, messages: 100 }

const db = getFirestore(initializeApp(firebaseConfig))
const messagesRef = collection(db, 'messages')

// 비밀번호를 되돌리기 어려운 값(SHA-256 해시)으로 바꿈. 원문은 어디에도 저장하지 않음
async function hashPassword(id, password) {
  const bytes = new TextEncoder().encode(id + password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 최신 글을 한도만큼 오래된 순서로 돌려줌
export async function loadMessages() {
  const snapshot = await getDocs(query(messagesRef, orderBy('createdAt', 'desc'), limit(LIMITS.messages)))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()
}

export async function addMessage({ name, text, avatar, password }) {
  const ref = doc(messagesRef) // 새 글의 id를 미리 만듦
  const hash = await hashPassword(ref.id, password)
  const batch = writeBatch(db) // batch: 두 문서를 한 묶음으로 저장 (하나만 저장되는 일이 없음)
  batch.set(ref, { name, text, avatar, createdAt: serverTimestamp() })
  batch.set(doc(db, 'secrets', ref.id), { hash })
  await batch.commit()
  return { id: ref.id, name, text, avatar }
}

// 비밀번호가 다르면 보안 규칙이 거부해서 오류가 남
export async function deleteMessage(id, password) {
  const hash = await hashPassword(id, password)
  const batch = writeBatch(db)
  batch.set(doc(db, 'deletions', id), { hash })
  batch.delete(doc(messagesRef, id))
  await batch.commit()
}

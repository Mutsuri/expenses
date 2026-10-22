export type TxType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  icon: string
}

export const CATEGORIES: Record<TxType, Category[]> = {
  expense: [
    { id: 'food', name: 'อาหาร', icon: '🍜' },
    { id: 'travel', name: 'เดินทาง', icon: '🚆' },
    { id: 'shopping', name: 'ช้อปปิ้ง', icon: '🛍️' },
    { id: 'bills', name: 'บิล/ค่าน้ำไฟ', icon: '🧾' },
    { id: 'home', name: 'ที่พัก', icon: '🏠' },
    { id: 'health', name: 'สุขภาพ', icon: '💊' },
    { id: 'fun', name: 'บันเทิง', icon: '🎮' },
    { id: 'family', name: 'ครอบครัว', icon: '👪' },
    { id: 'debt', name: 'ผ่อน/หนี้', icon: '💳' },
    { id: 'other-exp', name: 'อื่น ๆ', icon: '📦' },
  ],
  income: [
    { id: 'salary', name: 'เงินเดือน', icon: '💼' },
    { id: 'bonus', name: 'โบนัส', icon: '🎉' },
    { id: 'side', name: 'รายได้เสริม', icon: '🪙' },
    { id: 'interest', name: 'ดอกเบี้ย', icon: '🏦' },
    { id: 'other-inc', name: 'อื่น ๆ', icon: '📥' },
  ],
}

export function categoryById(type: TxType, id: string): Category {
  const list = CATEGORIES[type]
  return list.find((c) => c.id === id) ?? list[list.length - 1]!
}

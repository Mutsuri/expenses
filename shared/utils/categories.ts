export type TxType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  icon: string
}

export const CATEGORIES: Record<TxType, Category[]> = {
  expense: [
    { id: 'game-topup', name: 'เติมเกม', icon: '💎' },
    { id: 'game-buy', name: 'ซื้อเกม', icon: '🎮' },
    { id: 'online-shop', name: 'ซื้อของออนไลน์', icon: '🛒' },
    { id: 'mall-shop', name: 'ซื้อของในห้าง', icon: '🛍️' },
    { id: 'electricity', name: 'ค่าไฟ', icon: '⚡' },
    { id: 'internet', name: 'เน็ตบ้าน', icon: '🌐' },
    { id: 'mobile', name: 'ค่ามือถือ', icon: '📱' },
    { id: 'food', name: 'อาหาร', icon: '🍜' },
    // แท็กซี่ รถเมล์ MRT BTS
    { id: 'transport', name: 'การเดินทาง', icon: '🚇' },
    { id: 'haircut', name: 'ตัดผม', icon: '💈' },
    { id: 'other-exp', name: 'อื่น ๆ', icon: '📦' },
  ],
  income: [
    { id: 'salary', name: 'เงินเดือน', icon: '💼' },
    // รายรับของบัตรเครดิต (บัญชีอื่นไม่มีหมวดนี้ให้เลือก)
    { id: 'cashback', name: 'CashBack', icon: '💸' },
    { id: 'bonus', name: 'โบนัส', icon: '🎉' },
    { id: 'side', name: 'รายได้เสริม', icon: '🪙' },
    { id: 'interest', name: 'ดอกเบี้ย', icon: '🏦' },
    { id: 'other-inc', name: 'อื่น ๆ', icon: '📥' },
  ],
}

/** หมวดของเงินที่โอนระหว่างบัญชี (ไม่มีให้เลือกในฟอร์ม) */
/** เงินคืนจากบัตรเครดิต (รายรับอย่างเดียวของบัตรเครดิต) */
export const CASHBACK = 'cashback'
export const TRANSFER_IN = 'transfer-in'
export const TRANSFER_OUT = 'transfer-out'
/**
 * โอนจากบัญชีไปจ่ายบัตรเครดิต: เป็นรายจ่ายของบัญชีที่จ่าย นับในรอบเดียวกับที่รูดบัตร (ไม่ใช่รอบที่จ่าย)
 * เก็บเป็น 'card-pay@YYYY-MM-DD' = วันสรุปยอดของบิลที่จ่าย
 */
export const CARD_PAY = 'card-pay'
/** โอนระหว่างบัญชีเพื่อเอาไปจ่ายบัตร: ยังเป็นการโอนปกติ แต่นับรอบเดียวกับบิล 'card-fund@YYYY-MM-DD' */
export const CARD_FUND = 'card-fund'
const TRANSFER_CATEGORIES: Record<string, Category> = {
  [TRANSFER_IN]: { id: TRANSFER_IN, name: 'รับโอน', icon: '🔁' },
  [TRANSFER_OUT]: { id: TRANSFER_OUT, name: 'โอนออก', icon: '🔁' },
  [CARD_PAY]: { id: CARD_PAY, name: 'ชำระบัตรเครดิต', icon: '💳' },
}

export function categoryById(type: TxType, id: string): Category {
  if (TRANSFER_CATEGORIES[id]) return TRANSFER_CATEGORIES[id]
  const list = CATEGORIES[type]
  return list.find((c) => c.id === id) ?? list[list.length - 1]!
}

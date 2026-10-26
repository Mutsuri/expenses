// โลโก้จาก https://github.com/omise/banks-logo (MIT) อยู่ใน public/banks
export interface Bank {
  id: string
  name: string
  color: string
  /** ไม่มีไฟล์โลโก้ (บัตรเครดิต/เงินสด/อื่น ๆ) จะแสดงเป็นไอคอนแทน */
  logo: boolean
}

export const BANKS: Bank[] = [
  { id: 'kbank', name: 'กสิกรไทย', color: '#138f2d', logo: true },
  { id: 'scb', name: 'ไทยพาณิชย์', color: '#4e2e7f', logo: true },
  { id: 'bbl', name: 'กรุงเทพ', color: '#1e4598', logo: true },
  { id: 'ktb', name: 'กรุงไทย', color: '#1ba5e1', logo: true },
  { id: 'bay', name: 'กรุงศรีอยุธยา', color: '#fec43b', logo: true },
  { id: 'ttb', name: 'ทีทีบี', color: '#0b3a8f', logo: true },
  { id: 'gsb', name: 'ออมสิน', color: '#eb198d', logo: true },
  { id: 'uob', name: 'ยูโอบี', color: '#0b3979', logo: true },
  { id: 'cimb', name: 'ซีไอเอ็มบี ไทย', color: '#7e2f36', logo: true },
  { id: 'kk', name: 'เกียรตินาคินภัทร', color: '#199cc5', logo: true },
  { id: 'tisco', name: 'ทิสโก้', color: '#12549f', logo: true },
  { id: 'lhb', name: 'แลนด์ แอนด์ เฮ้าส์', color: '#6d6e71', logo: true },
  { id: 'ghb', name: 'อาคารสงเคราะห์ (ธอส.)', color: '#f57d23', logo: true },
  { id: 'baac', name: 'ธ.ก.ส.', color: '#4b9b1d', logo: true },
  { id: 'icbc', name: 'ไอซีบีซี (ไทย)', color: '#c50f1c', logo: true },
  { id: 'ibank', name: 'อิสลามแห่งประเทศไทย', color: '#184615', logo: true },
  { id: 'tcrb', name: 'ไทยเครดิต', color: '#0a4ab3', logo: true },
  { id: 'sc', name: 'สแตนดาร์ดชาร์เตอร์ด', color: '#0f6ea1', logo: true },
  { id: 'credit', name: 'บัตรเครดิต', color: '#b45309', logo: false },
  { id: 'cash', name: 'เงินสด', color: '#3d8b5f', logo: false },
  { id: 'other', name: 'อื่น ๆ', color: '#64748b', logo: false },
]

export function bankById(id: string): Bank {
  return BANKS.find((b) => b.id === id) ?? BANKS[BANKS.length - 1]!
}

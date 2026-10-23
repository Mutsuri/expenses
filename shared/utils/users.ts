// ผู้ใช้ของแอป: ชื่อที่ใช้ login → ชื่อที่แสดง
// ข้อมูลแยกตามผู้ใช้ทั้งในเครื่องและในชีต (คอลัมน์ owner)
export const USERS: Record<string, string> = {
  mutto: 'Mutsuri',
  rung: 'แม่',
}

/** เจ้าของข้อมูลจากก่อนแยกผู้ใช้ (ต้องตรงกับ DEFAULT_OWNER ใน apps-script/Code.gs) */
export const DEFAULT_OWNER = 'mutto'

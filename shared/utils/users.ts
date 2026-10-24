// ผู้ใช้ของแอป: ชื่อที่ใช้ login → ชื่อที่แสดง
// ข้อมูลแยกตามผู้ใช้ทั้งในเครื่องและในชีต (คอลัมน์ owner)
export const USERS: Record<string, string> = {
  mutto: 'Mutsuri',
  rung: 'แม่',
}

// ผู้ใช้ที่ไม่มีเงินเดือน: จดรายรับรายจ่ายเองทั้งหมด รอบเดือนเป็นเดือนปฏิทิน
const NO_SALARY: ReadonlySet<string> = new Set(['rung'])

export const usesSalary = (user: string) => !NO_SALARY.has(user)

/** เจ้าของข้อมูลจากก่อนแยกผู้ใช้ (ต้องตรงกับ DEFAULT_OWNER ใน apps-script/Code.gs) */
export const DEFAULT_OWNER = 'mutto'

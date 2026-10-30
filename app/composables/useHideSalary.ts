// ซ่อน/แสดงจำนวนเงินของบัญชีรับเงินเดือน จำไว้ในเครื่องนี้ (ค่าเริ่มต้น = ซ่อน)
const KEY = 'expenses.hideSalary'

function readSaved(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

const hidden = ref(import.meta.client ? readSaved() : true)

export function useHideSalary() {
  return {
    hidden: readonly(hidden),
    toggle() {
      hidden.value = !hidden.value
      try {
        localStorage.setItem(KEY, hidden.value ? '1' : '0')
      } catch {}
    },
  }
}

/** ตัวแทนจำนวนเงินตอนซ่อน */
export const MASK = '••••••'

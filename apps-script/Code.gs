// หลังบ้านของแอปจดจ่าย: วางไฟล์นี้ใน ส่วนขยาย → Apps Script ของ Google Sheet
// ตั้งรหัสลับที่ การตั้งค่าโปรเจกต์ → พร็อพเพอร์ตี้ของสคริปต์ ชื่อ SECRET
// แล้ว Deploy → การทำให้ใช้งานได้รายการใหม่ → เว็บแอป (ดำเนินการในฐานะ: ฉัน, ผู้มีสิทธิ์เข้าถึง: ทุกคน)

// คอลัมน์ใหม่ต่อท้ายเสมอ ข้อมูลเก่าในชีตจะได้ไม่เลื่อนช่อง
const SHEETS = {
  accounts: ['id', 'bankId', 'name', 'last4', 'openingBalance', 'createdAt', 'updatedAt', 'deleted', 'salary'],
  transactions: ['id', 'date', 'accountId', 'type', 'category', 'amount', 'note', 'createdAt', 'updatedAt', 'deleted', 'toAccountId'],
}
// ในชีตเก็บเป็นบาท ในแอปเก็บเป็นสตางค์
const MONEY = ['openingBalance', 'amount']
const NUMBERS = ['createdAt', 'updatedAt']
const BOOLEANS = ['deleted', 'salary']

function doGet() {
  return json({ ok: true, app: 'จดจ่าย' })
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const req = JSON.parse(e.postData.contents)
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET')
    if (!secret) return json({ ok: false, error: 'ยังไม่ได้ตั้ง SECRET ใน Script Properties' })
    if (req.secret !== secret) return json({ ok: false, error: 'รหัสลับไม่ตรง' })

    const ss = SpreadsheetApp.getActiveSpreadsheet()
    return json({
      ok: true,
      accounts: mergeSheet(ss, 'accounts', req.accounts || []),
      transactions: mergeSheet(ss, 'transactions', req.transactions || []),
      settings: mergeSettings(ss, req.settings),
    })
  } catch (err) {
    return json({ ok: false, error: String(err) })
  } finally {
    lock.releaseLock()
  }
}

function mergeSheet(ss, name, incoming) {
  const cols = SHEETS[name]
  const sheet = getSheet(ss, name, cols)
  const tz = ss.getSpreadsheetTimeZone()
  const byId = new Map()

  const last = sheet.getLastRow()
  if (last > 1) {
    for (const values of sheet.getRange(2, 1, last - 1, cols.length).getValues()) {
      if (!values[0]) continue
      const r = {}
      cols.forEach((c, i) => (r[c] = fromCell(c, values[i], tz)))
      byId.set(String(r.id), r)
    }
  }

  for (const r of incoming) {
    const mine = byId.get(r.id)
    if (mine && mine.updatedAt >= r.updatedAt) continue
    byId.set(r.id, r.deleted ? Object.assign({}, mine, { id: r.id, updatedAt: r.updatedAt, deleted: true }) : Object.assign({}, r, { deleted: false }))
  }

  const rows = Array.from(byId.values())
  if (name === 'transactions') rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.createdAt - b.createdAt)

  if (last > 1) sheet.getRange(2, 1, last - 1, cols.length).clearContent()
  if (rows.length) {
    const range = sheet.getRange(2, 1, rows.length, cols.length)
    range.setNumberFormats(rows.map(() => cols.map(formatOf)))
    range.setValues(rows.map((r) => cols.map((c) => toCell(c, r[c]))))
  }
  return rows
}

function mergeSettings(ss, incoming) {
  const sheet = getSheet(ss, 'settings', ['key', 'value'])
  const last = sheet.getLastRow()
  const kv = {}
  if (last > 1) for (const [k, v] of sheet.getRange(2, 1, last - 1, 2).getValues()) kv[k] = v
  const current = kv.updatedAt ? { paydayDay: Number(kv.paydayDay), holidays: JSON.parse(kv.holidays || '[]'), updatedAt: Number(kv.updatedAt) } : null

  if (incoming && (!current || incoming.updatedAt > current.updatedAt)) {
    const rows = [['paydayDay', incoming.paydayDay], ['holidays', JSON.stringify(incoming.holidays)], ['updatedAt', incoming.updatedAt]]
    const range = sheet.getRange(2, 1, rows.length, 2)
    range.setNumberFormat('@')
    range.setValues(rows.map(([k, v]) => [k, String(v)]))
    return incoming
  }
  return current
}

function getSheet(ss, name, cols) {
  let sheet = ss.getSheetByName(name)
  if (!sheet) sheet = ss.insertSheet(name)
  // เขียนหัวตารางทุกครั้ง เผื่อมีคอลัมน์ใหม่
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold')
  sheet.setFrozenRows(1)
  return sheet
}

function formatOf(col) {
  if (MONEY.includes(col)) return '#,##0.00'
  if (NUMBERS.includes(col)) return '0'
  return '@'
}

function toCell(col, v) {
  if (MONEY.includes(col)) return (Number(v) || 0) / 100
  if (BOOLEANS.includes(col)) return v ? 'TRUE' : ''
  return v === undefined || v === null ? '' : v
}

function fromCell(col, v, tz) {
  if (MONEY.includes(col)) return Math.round(Number(v || 0) * 100)
  if (NUMBERS.includes(col)) return Number(v) || 0
  if (BOOLEANS.includes(col)) return v === true || v === 'TRUE'
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd')
  return String(v)
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

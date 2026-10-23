// หลังบ้านของแอปจดจ่าย: วางไฟล์นี้ใน ส่วนขยาย → Apps Script ของ Google Sheet
// ตั้งรหัสลับที่ การตั้งค่าโปรเจกต์ → พร็อพเพอร์ตี้ของสคริปต์ ชื่อ SECRET
// แล้ว Deploy → การทำให้ใช้งานได้รายการใหม่ → เว็บแอป (ดำเนินการในฐานะ: ฉัน, ผู้มีสิทธิ์เข้าถึง: ทุกคน)

// คอลัมน์ใหม่ต่อท้ายเสมอ ข้อมูลเก่าในชีตจะได้ไม่เลื่อนช่อง
const SHEETS = {
  accounts: ['id', 'bankId', 'name', 'last4', 'openingBalance', 'createdAt', 'updatedAt', 'deleted', 'salary', 'owner'],
  transactions: ['id', 'date', 'accountId', 'type', 'category', 'amount', 'note', 'createdAt', 'updatedAt', 'deleted', 'toAccountId', 'owner'],
}
// แถวที่ยังไม่มี owner (ก่อนแยกผู้ใช้) และแอปรุ่นเก่าที่ไม่ส่งชื่อผู้ใช้ = ผู้ใช้คนแรก
const DEFAULT_OWNER = 'mutto'
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

    const user = String(req.user || DEFAULT_OWNER)
    if (!/^[a-z0-9_]+$/.test(user)) return json({ ok: false, error: 'ชื่อผู้ใช้ไม่ถูกต้อง' })

    const ss = SpreadsheetApp.getActiveSpreadsheet()
    return json({
      ok: true,
      accounts: mergeSheet(ss, 'accounts', req.accounts || [], user),
      transactions: mergeSheet(ss, 'transactions', req.transactions || [], user),
      settings: mergeSettings(ss, req.settings, user),
    })
  } catch (err) {
    return json({ ok: false, error: String(err) })
  } finally {
    lock.releaseLock()
  }
}

// รวมแถวของผู้ใช้คนนี้ แถวของคนอื่นเก็บไว้ตามเดิม คืนเฉพาะแถวของผู้ใช้คนนี้
function mergeSheet(ss, name, incoming, user) {
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
      r.owner = r.owner || DEFAULT_OWNER
      byId.set(String(r.id), r)
    }
  }

  for (const r of incoming) {
    const mine = byId.get(r.id)
    // แก้แถวของคนอื่นไม่ได้
    if (mine && mine.owner !== user) continue
    if (mine && mine.updatedAt >= r.updatedAt) continue
    byId.set(
      r.id,
      r.deleted
        ? Object.assign({}, mine, { id: r.id, updatedAt: r.updatedAt, deleted: true, owner: user })
        : Object.assign({}, r, { deleted: false, owner: user }),
    )
  }

  const rows = Array.from(byId.values())
  if (name === 'transactions') rows.sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.createdAt - b.createdAt)

  if (last > 1) sheet.getRange(2, 1, last - 1, cols.length).clearContent()
  if (rows.length) {
    const range = sheet.getRange(2, 1, rows.length, cols.length)
    range.setNumberFormats(rows.map(() => cols.map(formatOf)))
    range.setValues(rows.map((r) => cols.map((c) => toCell(c, r[c]))))
  }
  return rows.filter((r) => r.owner === user)
}

// ตั้งค่าแยกตามผู้ใช้: คีย์ในชีตเป็น "ชื่อผู้ใช้.paydayDay" เป็นต้น
// คีย์แบบไม่มีชื่อผู้ใช้ (ก่อนแยกผู้ใช้) เป็นของ DEFAULT_OWNER
function mergeSettings(ss, incoming, user) {
  const sheet = getSheet(ss, 'settings', ['key', 'value'])
  const last = sheet.getLastRow()
  const kv = {}
  if (last > 1) for (const [k, v] of sheet.getRange(2, 1, last - 1, 2).getValues()) if (k) kv[k] = v
  const FIELDS = ['paydayDay', 'holidays', 'updatedAt']
  if (user === DEFAULT_OWNER && !kv[`${user}.updatedAt`] && kv.updatedAt) {
    for (const f of FIELDS) kv[`${user}.${f}`] = kv[f]
  }
  for (const f of FIELDS) delete kv[f]

  const p = `${user}.`
  const current = kv[`${p}updatedAt`]
    ? { paydayDay: Number(kv[`${p}paydayDay`]), holidays: JSON.parse(kv[`${p}holidays`] || '[]'), updatedAt: Number(kv[`${p}updatedAt`]) }
    : null
  const result = incoming && (!current || incoming.updatedAt > current.updatedAt) ? incoming : current
  if (result) {
    kv[`${p}paydayDay`] = result.paydayDay
    kv[`${p}holidays`] = JSON.stringify(result.holidays)
    kv[`${p}updatedAt`] = result.updatedAt
  }

  const rows = Object.keys(kv).sort().map((k) => [k, String(kv[k])])
  if (last > 1) sheet.getRange(2, 1, last - 1, 2).clearContent()
  if (rows.length) {
    const range = sheet.getRange(2, 1, rows.length, 2)
    range.setNumberFormat('@')
    range.setValues(rows)
  }
  return result
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

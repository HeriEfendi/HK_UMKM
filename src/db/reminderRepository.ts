import { db } from './schema'

/** Tipe pengulangan pengingat */
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Opsi notifikasi: kapan mulai mengingatkan sebelum hari H */
export type NotifyMode = 'on_day' | '3_days' | '7_days'

export interface ReminderItem {
  id?: number
  title: string
  emoji?: string
  category?: string
  /** Tanggal acuan/mulai: YYYY-MM-DD */
  date: string
  notes?: string

  /** Tipe pengulangan */
  recurringType: RecurringType
  /** Untuk daily: array hari (0=Minggu … 6=Sabtu), [] = setiap hari */
  recurringDays?: number[]
  /** Untuk monthly: tanggal dalam bulan (1-31) */
  recurringDayOfMonth?: number

  /** Opsi reminder: 'on_day' | '3_days' | '7_days' */
  notifyMode: NotifyMode
  /** Jam notifikasi, format HH:MM */
  notifyTime?: string

  createdAt?: string
}

export const ReminderRepository = {
  async getAll(): Promise<ReminderItem[]> {
    return db.table('reminders').orderBy('date').toArray()
  },
  async add(data: Omit<ReminderItem, 'id' | 'createdAt'>): Promise<number> {
    return db.table('reminders').add({ ...data, createdAt: new Date().toISOString() })
  },
  async update(id: number, data: Partial<ReminderItem>): Promise<number> {
    return db.table('reminders').update(id, data)
  },
  async delete(id: number): Promise<void> {
    return db.table('reminders').delete(id)
  },
  async getUpcoming(days = 30): Promise<ReminderItem[]> {
    const todayStr = todayDate()
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() + days)
    const limitStr = formatLocalDate(limitDate)
    const all: ReminderItem[] = await db.table('reminders').toArray()
    return all
      .filter(r => {
        const next = getNextOccurrence(r)
        return next !== null && next >= todayStr && next <= limitStr
      })
      .sort((a, b) => {
        const da = getNextOccurrence(a) ?? ''
        const db2 = getNextOccurrence(b) ?? ''
        return da.localeCompare(db2)
      })
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayDate(): string {
  return formatLocalDate(new Date())
}

/**
 * Hitung tanggal kejadian berikutnya (>= hari ini) untuk suatu reminder.
 * Return null jika sudah lewat tanpa pengulangan.
 */
export function getNextOccurrence(r: ReminderItem): string | null {
  const today = todayDate()

  switch (r.recurringType) {
    case 'none':
      return r.date >= today ? r.date : null

    case 'daily': {
      const days = r.recurringDays && r.recurringDays.length > 0 ? r.recurringDays : [0,1,2,3,4,5,6]
      // Cari hari terdekat dari sekarang
      for (let offset = 0; offset <= 7; offset++) {
        const d = new Date()
        d.setDate(d.getDate() + offset)
        if (days.includes(d.getDay())) {
          return formatLocalDate(d)
        }
      }
      return null
    }

    case 'weekly': {
      // Hari dalam seminggu sama dengan hari di r.date
      const parts = r.date.split('-').map(Number)
      const refDate = new Date(parts[0], parts[1] - 1, parts[2])
      const targetDay = refDate.getDay()
      const now = new Date()
      const diff = (targetDay - now.getDay() + 7) % 7
      const next = new Date()
      next.setDate(now.getDate() + (diff === 0 ? 0 : diff))
      return formatLocalDate(next)
    }

    case 'monthly': {
      const parts = (r.date || '').split('-')
      const dayOfMonth = r.recurringDayOfMonth ?? parseInt(parts[2] || '1', 10)
      const now = new Date()
      const maxDaysThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      let candidate = new Date(now.getFullYear(), now.getMonth(), Math.min(dayOfMonth, maxDaysThisMonth))
      if (formatLocalDate(candidate) < today) {
        const maxDaysNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()
        candidate = new Date(now.getFullYear(), now.getMonth() + 1, Math.min(dayOfMonth, maxDaysNextMonth))
      }
      return formatLocalDate(candidate)
    }

    case 'yearly': {
      const parts = (r.date || '').split('-')
      const mm = parts[1] || '01'
      const dd = parts[2] || '01'
      const thisYear = new Date().getFullYear()
      let candidate = `${thisYear}-${mm}-${dd}`
      if (candidate < today) candidate = `${thisYear + 1}-${mm}-${dd}`
      return candidate
    }

    default:
      return r.date >= today ? r.date : null
  }
}

export function daysUntil(dateStr?: string | null): number {
  if (!dateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const parts = String(dateStr).split('-').map(Number)
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) return 0
  const target = new Date(parts[0], parts[1] - 1, parts[2])
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Label teks singkat untuk mode notifikasi */
export function notifyModeLabel(mode: NotifyMode): string {
  if (mode === '7_days') return 'Mulai 7 hari sebelumnya'
  if (mode === '3_days') return 'Mulai 3 hari sebelumnya'
  return 'Hanya hari H'
}

/** Label singkat untuk recurringType */
export function recurringLabel(r: ReminderItem): string {
  switch (r.recurringType) {
    case 'daily':   return r.recurringDays?.length ? `Mingguan (${r.recurringDays.map(d => ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][d]).join(',')})` : 'Setiap Hari'
    case 'weekly':  return 'Setiap Minggu'
    case 'monthly': return `Setiap Tgl ${r.recurringDayOfMonth ?? parseInt(r.date.split('-')[2] || '1', 10)}`
    case 'yearly':  return 'Setiap Tahun'
    default:        return 'Sekali'
  }
}

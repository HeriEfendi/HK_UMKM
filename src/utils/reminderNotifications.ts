import { Capacitor } from '@capacitor/core'
import { ReminderItem, getNextOccurrence } from '@/db/reminderRepository'

/**
 * Check permission status
 */
export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.checkPermissions()
      return perm.display === 'granted' ? 'granted' : (perm.display === 'denied' ? 'denied' : 'prompt')
    } catch {
      return 'prompt'
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission as 'granted' | 'denied' | 'prompt'
  }
  return 'denied'
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.requestPermissions()
      return perm.display === 'granted'
    } catch {
      return false
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    const res = await Notification.requestPermission()
    return res === 'granted'
  }
  return false
}

/**
 * Trigger instant test notification
 */
export async function triggerTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission()
  if (!granted) return false

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99999,
            title: '🔔 Uji Coba Pengingat HK UMKM',
            body: 'Notifikasi berhasil diatur dan berfungsi dengan baik!',
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: 'reminders',
            sound: 'default'
          }
        ]
      })
      return true
    } catch (e) {
      console.warn('Native test notification error:', e)
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      new Notification('🔔 Uji Coba Pengingat HK UMKM', {
        body: 'Notifikasi berhasil diatur dan berfungsi dengan baik!',
        icon: '/favicon.ico'
      })
      return true
    } catch (e) {
      console.warn('Web notification error:', e)
    }
  }

  return false
}

/**
 * Reschedule semua notifikasi pengingat.
 * - Berjalan di native Android/iOS dengan channel khusus
 * - Fallback web Notification jika didukung
 */
export async function scheduleReminderNotifications(reminders: ReminderItem[]) {
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      let perm = await LocalNotifications.checkPermissions()
      if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
      if (perm.display !== 'granted') return

      await LocalNotifications.createChannel({
        id: 'reminders',
        name: 'Pengingat',
        description: 'Notifikasi hari-hari penting',
        importance: 4,
        sound: 'default',
        vibration: true,
      })

      // Batalkan semua notif pengingat lama (id range 90000–99998)
      const pending = await LocalNotifications.getPending()
      const old = pending.notifications.filter(n => n.id >= 90000 && n.id < 99999)
      if (old.length > 0) await LocalNotifications.cancel({ notifications: old })

      const notifications: any[] = []
      let notifIdx = 0

      reminders.forEach(r => {
        const nextDate = getNextOccurrence(r)
        if (!nextDate) return

        const [hh, mm2] = (r.notifyTime || '08:00').split(':').map(Number)
        const leadDays = r.notifyMode === '7_days' ? 7 : r.notifyMode === '3_days' ? 3 : 0

        for (let offset = leadDays; offset >= 0; offset--) {
          const atDate = new Date(nextDate)
          atDate.setDate(atDate.getDate() - offset)
          atDate.setHours(hh, mm2, 0, 0)

          if (atDate <= new Date()) continue

          let title = `${r.emoji || '📅'} ${r.title}`
          let body: string
          if (offset === 0) {
            body = `Hari ini adalah hari spesial!${r.notes ? ' ' + r.notes : ''}`
          } else if (offset === 1) {
            body = `Besok: ${r.title}. Jangan sampai lupa!`
          } else {
            body = `${r.title} — tinggal ${offset} hari lagi!`
          }

          notifications.push({
            id: 90000 + notifIdx++,
            title,
            body,
            schedule: { at: atDate },
            channelId: 'reminders',
            iconColor: offset === 0 ? '#6366f1' : '#f59e0b',
          })
        }
      })

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications })
      }
    } catch (e) {
      console.warn('Reminder notification scheduling failed:', e)
    }
  }
}

// Persian strings and formatters. Dates use the Persian calendar, digits are Persian
// (the Vazir "FD" font also renders Latin digits as Persian digits).

export const t = {
  appName: 'داشبورد تی‌پی‌کال',
  company: 'تفکر پردازان',
  login: { title: 'ورود مدیر', extension: 'داخلی', password: 'رمز عبور', submit: 'ورود',
    badCreds: 'داخلی یا رمز عبور اشتباه است', forbidden: 'این حساب دسترسی مدیریت ندارد',
    network: 'ارتباط با سرور برقرار نشد' },
  nav: { overview: 'نمای کلی', users: 'کاربران', calls: 'تماس‌ها', logout: 'خروج', refresh: 'به‌روزرسانی' },
  stats: { users: 'کاربران', online: 'آنلاین', callsToday: 'تماس‌های امروز', callsTotal: 'کل تماس‌ها',
    answered: 'تماس‌های پاسخ‌داده‌شده', avgTalk: 'میانگین مدت مکالمه', totalTalk: 'مجموع مدت مکالمه',
    reasons: 'نتیجه تماس‌ها' },
  reasons: {
    completed: 'انجام‌شده', rejected: 'رد شده', no_answer: 'بی‌پاسخ', caller_cancelled: 'لغو توسط تماس‌گیرنده',
    callee_cancelled: 'لغو توسط گیرنده', peer_disconnected: 'قطع ارتباط',
  } as Record<string, string>,
  users: { search: 'جستجو بر اساس نام یا داخلی', add: 'کاربر جدید', name: 'نام', extension: 'داخلی',
    status: 'وضعیت', lastLogin: 'آخرین ورود', created: 'تاریخ ایجاد', actions: 'عملیات',
    online: 'آنلاین', offline: 'آفلاین', admin: 'مدیر', never: 'هرگز', empty: 'کاربری یافت نشد',
    edit: 'ویرایش نام', reset: 'بازنشانی رمز عبور', delete: 'حذف کاربر',
    addTitle: 'افزودن کاربر', editTitle: 'ویرایش نام', resetTitle: 'بازنشانی رمز عبور',
    deleteTitle: 'حذف کاربر', save: 'ذخیره', cancel: 'انصراف', create: 'ایجاد', confirmDelete: 'حذف',
    deleteWarn: 'کاربر و تمام سابقهٔ تماس‌های او برای همیشه حذف می‌شود و نشست فعلی‌اش بسته خواهد شد.',
    passwordHint: 'حداقل ۶ نویسه', extensionHint: 'سه رقم بین ۱۰۰ تا ۹۹۹',
    created_ok: 'کاربر ایجاد شد', renamed_ok: 'نام ذخیره شد', reset_ok: 'رمز عبور تغییر کرد',
    deleted_ok: 'کاربر حذف شد' },
  calls: { caller: 'تماس‌گیرنده', callee: 'گیرنده', started: 'شروع', duration: 'مدت', result: 'نتیجه',
    empty: 'هنوز تماسی ثبت نشده است', more: 'نمایش بیشتر' },
  errors: { generic: 'خطایی رخ داد. دوباره تلاش کنید.', load: 'بارگذاری اطلاعات ناموفق بود',
    exists: 'این داخلی قبلاً ثبت شده است', validation: 'مقادیر واردشده معتبر نیست',
    network: 'ارتباط با سرور برقرار نشد', retry: 'تلاش دوباره' },
}

/** Replaces Latin digits with Persian digits (for extensions and other ids shown in the UI). */
export const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])

const nf = new Intl.NumberFormat('fa-IR')
export const fmtNum = (n: number) => nf.format(n)

const df = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short' })
export const fmtDate = (iso: string | null | undefined) => (iso ? df.format(new Date(iso)) : '—')

export function fmtDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return '—'
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const two = (n: number) => fmtNum(n).padStart(2, '۰')
  // U+200E (LRM) around the text keeps the h:mm:ss order stable inside RTL text
  const text = h > 0 ? `${fmtNum(h)}:${two(m)}:${two(sec)}` : `${two(m)}:${two(sec)}`
  return `\u200e${text}\u200e`
}

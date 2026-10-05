const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function todayDateString() {
  const tz = process.env.ATTENDANCE_TIMEZONE
  if (tz) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }
  return new Date().toISOString().slice(0, 10)
}

export function parseOptionalDateRange(query) {
  const from = query.from?.trim() || null
  const to = query.to?.trim() || null

  if (from && !ISO_DATE.test(from)) {
    return { error: 'from must be YYYY-MM-DD' }
  }
  if (to && !ISO_DATE.test(to)) {
    return { error: 'to must be YYYY-MM-DD' }
  }
  if (from && to && from > to) {
    return { error: 'from must be on or before to' }
  }

  return { from, to }
}

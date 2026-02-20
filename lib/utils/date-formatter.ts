/**
 * Date formatting utilities with timezone support
 *
 * Best Practice:
 * - Store in UTC
 * - Calculate billing in EAT
 * - Display in user's local timezone
 */

/**
 * Get user's timezone
 * Priority: 1) User preference (from profile) 2) Browser detection 3) Default to EAT
 */
export function getUserTimezone(): string {
  try {
    // Browser auto-detection (most accurate for user's device)
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Fallback to East Africa Time
    return 'Africa/Nairobi'
  }
}

/**
 * Format date in user's local timezone
 * Automatically detects user's timezone from browser
 */
export function formatDate(
  date: string | Date | null,
  options?: {
    showTime?: boolean
    timezone?: string
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
  }
): string {
  if (!date) return 'Never'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  const timezone = options?.timezone || getUserTimezone()

  try {
    if (options?.dateStyle || options?.timeStyle) {
      return dateObj.toLocaleString('en-US', {
        timeZone: timezone,
        dateStyle: options.dateStyle,
        timeStyle: options.timeStyle,
      })
    }

    return dateObj.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(options?.showTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })
  } catch {
    // Fallback to ISO string if timezone is invalid
    return dateObj.toISOString()
  }
}

/**
 * Format date for display in admin dashboard
 * Shows full date and time in user's timezone
 */
export function formatDateTime(date: string | Date | null): string {
  return formatDate(date, { showTime: true })
}

/**
 * Format date without time
 */
export function formatDateOnly(date: string | Date | null): string {
  return formatDate(date, { showTime: false })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return 'Never'

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check for invalid date
    if (isNaN(dateObj.getTime())) return 'Unknown'

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()

    // Handle future dates (clock skew)
    if (diffMs < 0) return 'Just now'

    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffDay > 7) {
      return formatDate(date, { showTime: true })
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  } catch {
    return 'Unknown'
  }
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplay(): string {
  const timezone = getUserTimezone()
  const now = new Date()

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })

    const parts = formatter.formatToParts(now)
    const tzPart = parts.find(part => part.type === 'timeZoneName')

    return tzPart ? `${timezone} (${tzPart.value})` : timezone
  } catch {
    return timezone
  }
}

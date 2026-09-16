import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

/** The engine timestamps everything in Unix seconds. */
export const fromEngineTime = (seconds: number) => dayjs.unix(seconds)

export const formatRelative = (seconds: number) => (seconds ? fromEngineTime(seconds).fromNow() : '—')

export const formatAbsolute = (seconds: number) =>
  seconds ? fromEngineTime(seconds).format('MMM D, YYYY h:mm A') : '—'

export const formatCount = (value: number) => value.toLocaleString()

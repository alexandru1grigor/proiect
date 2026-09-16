type ApiErrorPayload = {
  data?: {
    message?: string | string[]
  }
}

export const getApiErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (typeof error !== 'object' || error === null) return fallback

  const message = (error as ApiErrorPayload).data?.message
  if (Array.isArray(message)) return message.join('. ')
  return typeof message === 'string' ? message : fallback
}

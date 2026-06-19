export const useErrorToast = () => {
  const { toast } = useToast()

  const extractErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message
    if (error && typeof error === 'object') {
      const obj = error as Record<string, any>
      return obj?.data?.statusMessage
        || obj?.data?.message
        || obj?.message
        || obj?.statusMessage
        || 'An unexpected error occurred'
    }
    return 'An unexpected error occurred'
  }

  const getErrorDetails = (error: unknown): string => {
    if (typeof error === 'string') return error
    if (error instanceof Error) {
      let details = error.message
      if (error.stack) details += `\n\n${error.stack}`
      return details
    }
    if (error && typeof error === 'object') {
      try {
        return JSON.stringify(error, null, 2)
      } catch {
        return String(error)
      }
    }
    return String(error)
  }

  const showErrorToast = (error: unknown, title: string = 'Error', fallbackMessage?: string) => {
    const message = extractErrorMessage(error) || fallbackMessage || 'An unexpected error occurred'
    const details = getErrorDetails(error)

    return toast({
      title,
      description: message,
      toast: 'soft-error',
      duration: 5000,
      showProgress: true,
      actions: details !== message ? [{
        label: 'Copy',
        altText: 'Copy error details',
        onClick: () => navigator.clipboard.writeText(details),
      }] : undefined,
    })
  }

  return { showErrorToast, extractErrorMessage }
}

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date: Date | string | number) => {
  return format(new Date(date), 'PPP', { locale: fr })
}

export const formatDateTime = (date: Date | string | number) => {
  return format(new Date(date), "PPP 'à' p", { locale: fr })
}

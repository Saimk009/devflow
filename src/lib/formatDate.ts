import { format, formatDistanceToNow } from "date-fns"

import { dateFormatStorageKey, defaultDateFormat } from "./constants"

export type DateFormatPreference = "relative" | "absolute" | "both"

const isDateFormatPreference = (value: string | null): value is DateFormatPreference =>
  value === "relative" || value === "absolute" || value === "both"

export function getDateFormatPreference(): DateFormatPreference {
  const preference = localStorage.getItem(dateFormatStorageKey)

  return isDateFormatPreference(preference) ? preference : defaultDateFormat
}

export function formatDate(value: string | number | Date): string {
  const date = new Date(value)
  const relative = formatDistanceToNow(date, { addSuffix: true })
  const absolute = format(date, "MMM d, HH:mm")
  const preference = getDateFormatPreference()

  if (preference === "absolute") {
    return absolute
  }

  if (preference === "both") {
    return `${relative} (${absolute})`
  }

  return relative
}

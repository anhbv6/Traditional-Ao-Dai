export function secondsUntil(date: Date) {
  return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000))
}
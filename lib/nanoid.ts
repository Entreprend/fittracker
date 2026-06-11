/** Mini générateur d'ID unique côté client — évite la dépendance nanoid */
export function nanoid(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

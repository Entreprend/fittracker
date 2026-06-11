import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}min` : `${h}h`
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg}kg`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getMuscleGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    pectoraux:        'Pectoraux',
    dos:              'Dos',
    epaules:          'Épaules',
    biceps:           'Bras',
    triceps:          'Bras',
    quadriceps:       'Jambes',
    ischio_jambiers:  'Jambes',
    fessiers:         'Fessiers',
    mollets:          'Mollets',
    abdominaux:       'Abdos',
    cardio:           'Cardio',
    full_body:        'Full Body',
  }
  return labels[group] ?? group
}

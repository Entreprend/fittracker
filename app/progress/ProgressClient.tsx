'use client'

import { useState, useRef } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { getMuscleGroupLabel, formatDateShort } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { ChargeItem, BWItem, PhotoItem } from './page'

// ─── ExerciseChart ─────────────────────────────────────────────────────────────

function ExerciseChart({ history }: { history: { date: string; maxWeight: number }[] }) {
  const chartData = history.map((h) => ({
    date: h.date,
    weight: h.maxWeight,
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1E2A1E" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#6B7B6B' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => {
            const parts = v.split('-')
            return `${parts[2]}/${parts[1]}`
          }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6B7B6B' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          contentStyle={{ background: '#111811', border: '1px solid #1E2A1E', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#6B7B6B' }}
          itemStyle={{ color: '#14B8A6' }}
          formatter={(v) => [`${v} kg`, 'Poids']}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#14B8A6"
          strokeWidth={2}
          dot={{ fill: '#14B8A6', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  charges: ChargeItem[]
  bodyWeights: BWItem[]
  photos: PhotoItem[]
}

type Tab = 'charges' | 'poids' | 'photos'

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgressClient({ userId, charges, bodyWeights, photos }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('charges')

  // Body weight state
  const [localBodyWeights, setLocalBodyWeights] = useState<BWItem[]>(bodyWeights)
  const [addWeightOpen, setAddWeightOpen] = useState(false)
  const [addWeightValue, setAddWeightValue] = useState('')
  const [addWeightDate, setAddWeightDate] = useState(new Date().toISOString().split('T')[0])
  const [addingWeight, setAddingWeight] = useState(false)

  // Photos state
  const [localPhotos, setLocalPhotos] = useState<PhotoItem[]>(photos)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charge sheet state
  const [selectedCharge, setSelectedCharge] = useState<ChargeItem | null>(null)
  const [chargeSheetOpen, setChargeSheetOpen] = useState(false)

  // Lightbox state
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(addWeightValue)
    if (!val || isNaN(val)) return
    setAddingWeight(true)
    try {
      const res = await fetch('/api/body-weights', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId, weight_kg: val, date: addWeightDate }),
      })
      console.log('body-weights POST status:', res.status)
      const body = await res.text()
      console.log('body-weights POST body:', body)
      if (res.ok) {
        const data = JSON.parse(body)
        if (data?.id) {
          const newBW: BWItem = { id: data.id, weight_kg: data.weight_kg, date: data.date }
          setLocalBodyWeights((prev) =>
            [...prev, newBW].sort((a, b) => a.date.localeCompare(b.date)),
          )
        }
      }
      setAddWeightValue('')
      setAddWeightDate(new Date().toISOString().split('T')[0])
      setAddWeightOpen(false)
    } finally {
      setAddingWeight(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('1. fichier sélectionné:', file.name, 'type:', file.type, 'size:', file.size)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', userId)

      const uploadRes = await fetch('/api/upload-photo', { method: 'POST', body: formData })
      console.log('2. upload-photo response status:', uploadRes.status)
      const uploadBody = await uploadRes.text()
      console.log('3. upload-photo response body:', uploadBody)
      if (!uploadRes.ok) throw new Error(uploadBody)
      const { url, storage_path } = JSON.parse(uploadBody)

      const takenAt = new Date().toISOString()

      const today = new Date().toISOString().split('T')[0]
      const photoRes = await fetch('/api/progress-photos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: userId, image_url: url, date: today }),
      })
      console.log('4. progress-photos response status:', photoRes.status)
      if (photoRes.ok) {
        const inserted = await photoRes.json()
        if (inserted?.id) {
          const newPhoto: PhotoItem = { id: inserted.id, image_url: inserted.image_url, date: inserted.date }
          setLocalPhotos((prev) => [newPhoto, ...prev])
        }
      }
    } catch (err) {
      console.error('[handleUpload] erreur:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Chart data for body weight ───────────────────────────────────────────────

  const bwChartData = localBodyWeights.map((bw) => ({
    date: bw.date.split('T')[0],
    weight_kg: bw.weight_kg,
  }))

  const last5BW = [...localBodyWeights].reverse().slice(0, 5)

  // ── Render ──────────────────────────────────────────────────────────────────

  const tabs: { value: Tab; label: string }[] = [
    { value: 'charges', label: 'Charges' },
    { value: 'poids',   label: 'Poids'   },
    { value: 'photos',  label: 'Photos'  },
  ]

  return (
    <div className="flex flex-col px-4 py-4">

      {/* ── Custom Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-elevated rounded-[14px] p-1 mb-4">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={cn(
              'flex-1 text-center py-2 text-xs font-semibold rounded-[10px] cursor-pointer transition-colors',
              activeTab === value
                ? 'bg-surface text-accent border border-border'
                : 'text-text3',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB CHARGES ──────────────────────────────────────────────────────── */}
      {activeTab === 'charges' && (
        charges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
            <svg
              width="80"
              height="56"
              viewBox="0 0 80 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Axe ascendant */}
              <polyline
                points="8,44 28,28 44,34 68,12"
                stroke="#14B8A6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.4"
              />
              {/* Points */}
              <circle cx="8"  cy="44" r="3.5" fill="#14B8A6" fillOpacity="0.4" />
              <circle cx="28" cy="28" r="3.5" fill="#14B8A6" fillOpacity="0.6" />
              <circle cx="44" cy="34" r="3.5" fill="#14B8A6" fillOpacity="0.6" />
              <circle cx="68" cy="12" r="4.5" fill="#14B8A6" />
              {/* Flèche haut */}
              <polyline
                points="62,6 68,12 74,6"
                stroke="#14B8A6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex flex-col gap-1.5">
              <p className="font-display font-bold text-[17px] text-text1">
                Suis ta progression
              </p>
              <p className="font-body text-[13px] text-text3 max-w-[240px]">
                Enregistre ta première séance pour voir ta progression de charges
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {charges.map((ep) => (
              <button
                key={ep.exerciseId}
                type="button"
                onClick={() => {
                  setSelectedCharge(ep)
                  setChargeSheetOpen(true)
                }}
                className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-3 text-left w-full hover:border-border-hi transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-[15px] text-text1 leading-tight">
                    {ep.name}
                  </span>
                  <span className="shrink-0 bg-elevated border border-border rounded-full px-2.5 py-0.5 font-body text-[11px] text-text2">
                    {getMuscleGroupLabel(ep.muscleGroup)}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${Math.max(3, Math.min(ep.progressPct, 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text3 text-[12px] font-body">
                      {ep.firstWeight}kg → {ep.bestWeight}kg
                    </span>
                    <span className="text-accent font-bold text-[12px] font-body">
                      +{ep.progressPct}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* ── TAB POIDS ──────────────────────────────────────────────────────────── */}
      {activeTab === 'poids' && (
        <div className="flex flex-col gap-4">
          {bwChartData.length > 0 ? (
            <div className="bg-surface border border-border rounded-[20px] p-4">
              <p className="font-body text-[11px] uppercase tracking-widest text-text3 mb-3">
                Historique poids
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={bwChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#1E2A1E" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6B7B6B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => {
                      const parts = v.split('-')
                      return `${parts[2]}/${parts[1]}`
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B7B6B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#111811', border: '1px solid #1E2A1E', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#6B7B6B' }}
                    itemStyle={{ color: '#14B8A6' }}
                    formatter={(v) => [`${v} kg`, 'Poids']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight_kg"
                    stroke="#14B8A6"
                    strokeWidth={2}
                    dot={{ fill: '#14B8A6', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <TrendingUp className="w-10 h-10 text-text3" strokeWidth={1.5} />
              <p className="font-body text-[14px] text-text3 text-center">
                Aucune pesée enregistrée.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAddWeightOpen((v) => !v)}
            className="w-full h-12 rounded-full bg-accent text-bg font-body font-semibold text-[15px] hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {addWeightOpen ? 'Annuler' : 'Ajouter une pesée'}
          </button>

          {addWeightOpen && (
            <form onSubmit={handleAddWeight} className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[12px] text-text3">Poids (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="ex. 75.5"
                  value={addWeightValue}
                  onChange={(e) => setAddWeightValue(e.target.value)}
                  className="h-11 rounded-[14px] bg-elevated border border-border px-4 font-body text-[15px] text-text1 placeholder:text-text3 focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-[12px] text-text3">Date</label>
                <input
                  type="date"
                  value={addWeightDate}
                  onChange={(e) => setAddWeightDate(e.target.value)}
                  className="h-11 rounded-[14px] bg-elevated border border-border px-4 font-body text-[15px] text-text1 focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={addingWeight}
                className="h-11 w-full rounded-full bg-accent text-bg font-body font-semibold text-[14px] disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {addingWeight ? 'Enregistrement…' : 'Valider'}
              </button>
            </form>
          )}

          {last5BW.length > 0 && (
            <div className="bg-surface border border-border rounded-[20px] p-4 flex flex-col gap-2">
              <p className="font-body text-[11px] uppercase tracking-widest text-text3 mb-1">
                Dernières pesées
              </p>
              {last5BW.map((bw) => (
                <div key={bw.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="font-body text-[13px] text-text2">
                    {formatDateShort(bw.date)}
                  </span>
                  <span className="font-display font-bold text-[15px] text-text1">
                    {bw.weight_kg} kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB PHOTOS ─────────────────────────────────────────────────────────── */}
      {activeTab === 'photos' && (
        <>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square bg-elevated border-2 border-dashed border-border-hi rounded-[14px] flex items-center justify-center text-text3 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="font-body text-[10px]">…</span>
              ) : (
                <span className="text-[28px] leading-none">+</span>
              )}
            </button>

            {localPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  setSelectedPhoto(photo)
                  setLightboxOpen(true)
                }}
                className="aspect-square rounded-[14px] overflow-hidden relative cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                  <span className="text-white text-[9px] font-body">
                    {formatDateShort(photo.date)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {localPhotos.length === 0 && !uploading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <TrendingUp className="w-10 h-10 text-text3" strokeWidth={1.5} />
              <p className="font-body text-[14px] text-text3 text-center">
                Aucune photo enregistrée.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Charge Sheet ─────────────────────────────────────────────────────── */}
      <Sheet open={chargeSheetOpen} onOpenChange={setChargeSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[65vh] bg-surface border-t border-border rounded-t-[24px] px-4 pt-4 pb-6 overflow-y-auto"
          showCloseButton={false}
        >
          {selectedCharge && (
            <>
              <SheetHeader className="p-0 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="font-display font-bold text-[18px] text-text1">
                    {selectedCharge.name}
                  </SheetTitle>
                  <span className="bg-elevated border border-border rounded-full px-2.5 py-0.5 font-body text-[11px] text-text2">
                    {getMuscleGroupLabel(selectedCharge.muscleGroup)}
                  </span>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-elevated rounded-[14px] p-3 flex flex-col gap-0.5">
                  <span className="font-body text-[10px] uppercase tracking-widest text-text3">Départ</span>
                  <span className="font-display font-bold text-[18px] text-text1">
                    {selectedCharge.firstWeight}
                    <span className="text-[12px] font-body text-text2 ml-0.5">kg</span>
                  </span>
                </div>
                <div className="bg-elevated rounded-[14px] p-3 flex flex-col gap-0.5">
                  <span className="font-body text-[10px] uppercase tracking-widest text-text3">Meilleur</span>
                  <span className="font-display font-bold text-[18px] text-text1">
                    {selectedCharge.bestWeight}
                    <span className="text-[12px] font-body text-text2 ml-0.5">kg</span>
                  </span>
                </div>
                <div className="bg-elevated rounded-[14px] p-3 flex flex-col gap-0.5">
                  <span className="font-body text-[10px] uppercase tracking-widest text-text3">Progression</span>
                  <span className="font-display font-bold text-[18px] text-accent">
                    +{selectedCharge.progressPct}
                    <span className="text-[12px] font-body ml-0.5">%</span>
                  </span>
                </div>
              </div>

              <ExerciseChart history={selectedCharge.history} />
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxOpen && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto.image_url}
            alt="Photo progression"
            className="max-w-full max-h-full object-contain rounded-[14px]"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <span className="text-[18px] leading-none">×</span>
          </button>
        </div>
      )}

      <div className="h-2" />
    </div>
  )
}

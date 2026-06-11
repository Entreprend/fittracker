import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file   = formData.get('file')    as File   | null
    const userId = formData.get('user_id') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'file and user_id are required' }, { status: 400 })
    }

    const ext      = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${userId}/${crypto.randomUUID()}.${ext}`
    const buffer   = await file.arrayBuffer()

    const storageRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/progress-photos/${fileName}`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type':  file.type || 'application/octet-stream',
        },
        body: buffer,
      },
    )

    if (!storageRes.ok) {
      const err = await storageRes.text()
      console.error('[POST /api/upload-photo] storage error', storageRes.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/progress-photos/${fileName}`
    return NextResponse.json({ url, storage_path: fileName })
  } catch (e) {
    console.error('[POST /api/upload-photo]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

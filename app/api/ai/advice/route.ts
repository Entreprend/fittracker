import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export interface AdviceRequest {
  weekVolume: number
  prevWeekVolume: number
  weekWorkouts: number
  workedGroups: string[]
  missingGroups: string[]
  topExercise: string | null
  stagnatingExercise: string | null
}

export async function POST(request: Request) {
  console.log('ANTHROPIC_KEY exists:', !!process.env.ANTHROPIC_API_KEY)

  try {
    const body: AdviceRequest = await request.json()
    const { weekVolume, weekWorkouts, workedGroups, missingGroups } = body

    const hasCardio = workedGroups.includes('cardio')

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `Tu es un coach fitness expert. En 3-4 phrases max en français, donne un conseil personnalisé basé sur :
- Volume cette semaine : ${weekVolume}kg
- Séances : ${weekWorkouts}
- Groupes musculaires travaillés : ${workedGroups.length ? workedGroups.join(', ') : 'aucun'}
- Groupes non travaillés : ${missingGroups.length ? missingGroups.join(', ') : 'aucun'}
- Cardio cette semaine : ${hasCardio ? 'oui' : 'non'}

Commence par féliciter la régularité, puis signale les groupes manquants importants, et rappelle le cardio si absent. Sois direct, motivant et concis. Pas d'emojis.`

    const message = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 250,
      messages:   [{ role: 'user', content: prompt }],
    })

    const advice = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ advice })
  } catch (error) {
    console.error('AI advice error:', error)
    return NextResponse.json(
      { advice: "Continue sur ta lancée — la régularité est la clé du progrès." },
      { status: 200 },
    )
  }
}

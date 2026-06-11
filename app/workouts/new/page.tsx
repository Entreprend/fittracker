import NewWorkoutClient from './NewWorkoutClient'

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>
}) {
  const { duplicate } = await searchParams
  return <NewWorkoutClient duplicateId={duplicate} />
}

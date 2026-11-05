import { RadioModule } from '@/modules/radio/RadioModule'

export const dynamic = 'force-dynamic'

/** The current station cards, with saved artwork and previews. */
export async function GET() {
  return Response.json(await new RadioModule().card())
}

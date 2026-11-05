import { WeatherModule } from '@/modules/weather/WeatherModule'

export const dynamic = 'force-dynamic'

/** The homepage weather card, for the visitor's location when the browser shares it. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return Response.json(await new WeatherModule().load({ lat: searchParams.get('lat') ?? '', lon: searchParams.get('lon') ?? '' }))
}

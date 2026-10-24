// Sample MusicBrainz data shared by the unit and integration tests.

export const PEARL_JAM_ID = '83b9cbe7-9857-49e2-ab8e-b57b01038103'
export const VEDDER_ID = '8b9d3d7f-3a37-4e8f-b9e8-0e3b6a4f1c2d'
export const TAME_IMPALA_ID = '22222222-2222-2222-2222-222222222222'

export const PEARL_JAM = {
  id: PEARL_JAM_ID, name: 'Pearl Jam', type: 'Group', country: 'US',
  area: { name: 'United States' }, 'begin-area': { name: 'Seattle' },
  'life-span': { begin: '1990', end: null, ended: false },
  aliases: [{ name: 'Mookie Blaylock' }], isnis: ['0000000123426109'], ipis: [],
  genres: [{ name: 'rock', count: 5 }, { name: 'grunge', count: 9 }],
  tags: [{ name: 'grunge', count: 9 }, { name: 'seattle', count: 3 }],
  rating: { value: 4.6, 'votes-count': 29 },
  relations: [
    { 'target-type': 'url', type: 'official homepage', url: { resource: 'https://pearljam.com/' } },
    { 'target-type': 'url', type: 'free streaming', url: { resource: 'https://open.spotify.com/artist/1w5K' } },
    { 'target-type': 'url', type: 'image', url: { resource: 'https://commons.wikimedia.org/wiki/File:PJ.jpg' } },
    { 'target-type': 'artist', type: 'member of band', direction: 'backward', begin: '1990', ended: false,
      attributes: ['original', 'lead vocals'], artist: { id: VEDDER_ID, name: 'Eddie Vedder' } },
    { 'target-type': 'artist', type: 'member of band', direction: 'backward', begin: '1990-09-22', end: '1991-05-22',
      ended: true, attributes: ['drums'], artist: { id: '11111111-1111-1111-1111-111111111111', name: 'Dave Krusen' } },
  ],
}

export const RELEASE_GROUPS = [
  { id: 'aaaaaaaa-0000-0000-0000-000000000001', title: 'Vs.', 'primary-type': 'Album', 'first-release-date': '1993-10-08' },
  { id: 'aaaaaaaa-0000-0000-0000-000000000002', title: 'Ten', 'primary-type': 'Album', 'first-release-date': '1991-08-27' },
  { id: 'aaaaaaaa-0000-0000-0000-000000000003', title: 'Alive', 'primary-type': 'Single', 'first-release-date': '1991' },
  { id: 'aaaaaaaa-0000-0000-0000-000000000004', title: 'Live on Two Legs', 'primary-type': 'Album',
    'secondary-types': ['Live'], 'first-release-date': '1998' },
]

/** Stands in for MusicBrainzClient and records the calls. */
export class FakeMusicBrainz {
  calls: [string, string][] = []

  async searchArtists(name: string) {
    this.calls.push(['search', name])
    const known: Record<string, string> = { 'pearl jam': PEARL_JAM_ID, 'tame impala': TAME_IMPALA_ID }
    const id = known[name.toLowerCase()]
    return id ? [{ id, name, score: 100 }] : [{ id: 'x', name: 'Something Else', score: 95 }]
  }

  async artist(mbid: string) {
    this.calls.push(['artist', mbid])
    if (mbid === PEARL_JAM_ID) return PEARL_JAM
    return { id: mbid, name: mbid === TAME_IMPALA_ID ? 'Tame Impala' : 'Eddie Vedder', relations: [] }
  }

  async releaseGroups(mbid: string) {
    this.calls.push(['releaseGroups', mbid])
    return mbid === PEARL_JAM_ID ? RELEASE_GROUPS : []
  }
}

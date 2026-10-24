/** Compare names loosely: no accents, case, or punctuation. */
export function normalize(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^\x00-\x7f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Separators the stations use between several artists, as in "Tame Impala [+] Jennie".
const SEPARATORS = /\s*(?:\[\+\]|,|&|\bfeat\.?|\bft\.?|\bfeaturing\b|\bwith\b|\bx\b|\/)\s*/i

/** The full name first (for duos like "Simon & Garfunkel"), then the first listed artist. */
export function nameCandidates(name: string): string[] {
  const full = name.trim()
  const first = full.split(SEPARATORS)[0].trim()
  return first === '' || first === full ? [full] : [full, first]
}

/** The key a radio name is saved under. */
export const nameKey = (name: string) => name.trim().toLowerCase()

// Addresses used by modules. Kept separate from the module classes so the
// Payload config can read them without importing the modules (which import Payload).
export const MODULE_SLUGS = ['weather', 'news', 'todo', 'notes', 'agenda', 'radio', 'charts', 'concerts', 'listening', 'brat', 'about', 'built'] as const

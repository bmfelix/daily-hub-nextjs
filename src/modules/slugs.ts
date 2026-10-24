// Addresses used by modules. Kept separate from the module classes so the
// Payload config can read them without importing the modules (which import Payload).
export const MODULE_SLUGS = ['weather', 'news', 'todo', 'currency', 'notes', 'radio'] as const

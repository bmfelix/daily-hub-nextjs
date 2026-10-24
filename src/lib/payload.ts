import { getPayload } from 'payload'

import config from '@/payload.config'

/** The shared Payload instance for server code (Local API, no HTTP round trip). */
export const getPayloadClient = () => getPayload({ config })

import type { CollectionSchema } from 'deepspace/schema'

export const callsSchema: CollectionSchema = {
  name: 'calls',
  columns: [
    { name: 'status', storage: 'text', interpretation: { kind: 'select', options: ['live', 'ended'] }, default: 'live' },
    { name: 'startedByName', storage: 'text', interpretation: 'plain' },
    { name: 'startedAt', storage: 'text', interpretation: 'plain' },
    { name: 'startedById', storage: 'text', interpretation: 'plain', required: true, userBound: true, immutable: true },
  ],
  ownerField: 'startedById',
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: 'own', delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

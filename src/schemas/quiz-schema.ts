import type { CollectionSchema } from 'deepspace/schema'

export const quizQuestionsSchema: CollectionSchema = {
  name: 'quiz-questions',
  columns: [
    { name: 'question', storage: 'text', interpretation: 'plain', required: true },
    { name: 'choiceA', storage: 'text', interpretation: 'plain', required: true },
    { name: 'choiceB', storage: 'text', interpretation: 'plain', required: true },
    { name: 'choiceC', storage: 'text', interpretation: 'plain', required: true },
    { name: 'choiceD', storage: 'text', interpretation: 'plain', required: true },
    {
      name: 'correct',
      storage: 'text',
      interpretation: { kind: 'select', options: ['A', 'B', 'C', 'D'] },
      required: true,
    },
    { name: 'topic', storage: 'text', interpretation: 'plain' },
    { name: 'createdByName', storage: 'text', interpretation: 'plain' },
    {
      name: 'createdById',
      storage: 'text',
      interpretation: 'plain',
      required: true,
      userBound: true,
      immutable: true,
    },
  ],
  ownerField: 'createdById',
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

export const quizAttemptsSchema: CollectionSchema = {
  name: 'quiz-attempts',
  columns: [
    { name: 'playerName', storage: 'text', interpretation: 'plain' },
    { name: 'score', storage: 'number', interpretation: 'plain', required: true },
    { name: 'total', storage: 'number', interpretation: 'plain', required: true },
    { name: 'playedAt', storage: 'text', interpretation: 'plain' },
    {
      name: 'playerId',
      storage: 'text',
      interpretation: 'plain',
      required: true,
      userBound: true,
      immutable: true,
    },
  ],
  ownerField: 'playerId',
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}

import { z } from 'zod'

export const createConversation = z.object({
  body: z.object({
    participantIds: z.array(z.string()).min(1, 'At least one participant required'),
    name: z.string().optional(), // for group chats
    type: z.enum(['DIRECT', 'GROUP']).optional(),
  }),
})

export const sendMessage = z.object({
  body: z.object({
    content: z.string().min(1, 'Message cannot be empty').max(5000),
  }),
})

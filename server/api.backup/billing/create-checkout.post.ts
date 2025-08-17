import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

const requestSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  userId: z.string().cuid('Invalid user ID'),
  workspaceId: z.string().cuid('Invalid workspace ID'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validatedData = requestSchema.parse(body)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: validatedData.priceId,
          quantity: 1,
        },
      ],
      success_url: validatedData.successUrl,
      cancel_url: validatedData.cancelUrl,
      metadata: {
        userId: validatedData.userId,
        workspaceId: validatedData.workspaceId
      },
      customer_email: undefined, // Would get from user in production
      allow_promotion_codes: true,
    })

    return {
      sessionId: session.id,
      url: session.url
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: error.errors
      })
    }
    
    console.error('Stripe checkout error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create checkout session'
    })
  }
})
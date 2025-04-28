import type { NextApiRequest, NextApiResponse } from 'next'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { amount, currency, delegateEmail, isDoubleDel, committee, portfolio } = req.body

    const options = {
      amount: amount,
      currency: currency,
      receipt: `kimun_${Date.now()}`,
      notes: {
        delegateEmail,
        registrationType: isDoubleDel ? 'double' : 'single',
        committee,
        portfolio
      }
    }

    const order = await razorpay.orders.create(options)

    return res.status(200).json({
      success: true,
      orderId: order.id
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent'
    })
  }
}
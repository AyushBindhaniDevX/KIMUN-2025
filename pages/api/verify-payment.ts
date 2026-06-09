import type { NextApiRequest, NextApiResponse } from 'next'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { paymentId, orderId, signature, amount } = req.body

    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature'
      })
    }

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(paymentId)

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        error: 'Payment not captured',
        paymentStatus: payment.status
      })
    }

    if (payment.amount !== amount) {
      return res.status(400).json({
        success: false,
        error: 'Payment amount mismatch',
        expectedAmount: amount,
        actualAmount: payment.amount
      })
    }

    return res.status(200).json({
      success: true,
      paymentId,
      amount: payment.amount,
      currency: payment.currency
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    })
  }
}
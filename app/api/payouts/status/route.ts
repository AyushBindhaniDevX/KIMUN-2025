import { NextResponse } from 'next/server';
import { Payouts } from '@cashfreepayments/cashfree-sdk';

const cashfree = new Payouts({
  env: process.env.CASHFREE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX',
  clientId: process.env.CASHFREE_CLIENT_ID!,
  clientSecret: process.env.CASHFREE_CLIENT_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { referenceId } = await request.json();
    
    if (!referenceId) {
      return NextResponse.json(
        { error: 'referenceId is required' },
        { status: 400 }
      );
    }

    const response = await cashfree.getTransferStatus(referenceId);
    
    return NextResponse.json({
      status: response.data.status,
      utr: response.data.utr,
      details: response.data
    });

  } catch (error: any) {
    console.error('Status check failed:', error);
    return NextResponse.json(
      { 
        error: error.response?.data?.message || 'Status check failed',
        code: error.response?.data?.code
      },
      { status: error.response?.status || 500 }
    );
  }
}
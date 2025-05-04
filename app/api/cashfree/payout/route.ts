import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Implement Cashfree API call here
    const response = await axios.post('https://payout-api.cashfree.com/payout/v1/requestTransfer', {
      beneId: body.accountNumber,
      amount: body.amount,
      transferId: `MUNP${Date.now()}`,
      transferMode: 'banktransfer',
      remarks: `MUN Award: ${body.award}`,
      bankAccount: body.accountNumber,
      ifsc: body.ifscCode,
      name: body.name
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CASHFREE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      referenceId: response.data.referenceId
    });
  } catch (error) {
    console.error('Cashfree payout error:', error);
    return NextResponse.json(
      { error: 'Payout failed' },
      { status: 500 }
    );
  }
}
// app/api/cashfree-auth/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const isSandbox = process.env.CASHFREE_ENV === 'sandbox';
    const baseUrl = isSandbox 
      ? 'https://payout-gamma.cashfree.com' 
      : 'https://payout-api.cashfree.com';

    console.log('Attempting Cashfree auth with:', {
      baseUrl,
      clientId: process.env.CASHFREE_CLIENT_ID?.substring(0, 4) + '...',
      env: process.env.CASHFREE_ENV
    });

    const response = await fetch(`${baseUrl}/payout/v1/authorize`, {
      method: 'POST',
      headers: {
        'X-Client-Id': process.env.CASHFREE_CLIENT_ID!,
        'X-Client-Secret': process.env.CASHFREE_CLIENT_SECRET!,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const responseData = await response.json();
    console.log('Cashfree auth response:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP ${response.status}`);
    }

    // Cashfree's actual token location in response
    const token = responseData.token || responseData.data?.token || responseData.data?.authorization;
    
    if (!token) {
      console.error('Token not found in response keys:', Object.keys(responseData));
      throw new Error('Token not found in response');
    }

    return NextResponse.json({ 
      success: true,
      token: token,
      expiresIn: 3600 // Cashfree tokens typically expire in 1 hour
    });

  } catch (error: any) {
    console.error('Cashfree auth error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to authenticate with Cashfree',
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
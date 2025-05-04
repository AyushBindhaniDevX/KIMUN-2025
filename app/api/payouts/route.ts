import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Initialize performance tracking
  const startTime = Date.now();
  
  try {
    console.log('Starting Cashfree payout request...');
    
    // Validate environment variables
    if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
      const error = 'Cashfree credentials not configured in environment variables';
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      const error = 'Invalid JSON payload';
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['cashgramId', 'amount', 'name', 'phone'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      const error = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(body.amount) || Number(body.amount) < 1) {
      const error = 'Amount must be a number and at least 1.00';
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Step 1: Get authorization token
    console.log('Requesting authorization token...');
    const authUrl = 'https://sandbox.cashfree.com/payout/v1/authorize';
    
    let authResponse;
    try {
      authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'X-Client-Id': process.env.CASHFREE_CLIENT_ID,
          'X-Client-Secret': process.env.CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
          'X-Cf-Signature' : "demo",
        }
      });

      if (!authResponse.ok) {
        throw new Error(`HTTP ${authResponse.status} from auth endpoint`);
      }
    } catch (e) {
      console.error('Failed to connect to Cashfree auth endpoint:', e);
      return NextResponse.json(
        { error: 'Failed to connect to payment service' },
        { status: 502 }
      );
    }

    let authData;
    try {
      authData = await authResponse.json();
      console.log('Auth response:', JSON.stringify(authData, null, 2));
    } catch (e) {
      console.error('Failed to parse auth response:', e);
      return NextResponse.json(
        { error: 'Invalid response from payment service' },
        { status: 502 }
      );
    }

    // Extract token from response
    const token = authData.token || authData.data?.token;
    if (!token) {
      console.error('Token not found in auth response');
      return NextResponse.json(
        { error: 'Authentication failed - no token received' },
        { status: 401 }
      );
    }

    // Step 2: Create Cashgram
    console.log('Creating Cashgram with token...');
    const cashgramUrl = 'https://sandbox.cashfree.com/payout/v1/createCashgram';
    
    // Prepare payload
    const payload = {
      cashgramId: body.cashgramId,
      amount: Number(body.amount).toFixed(2),
      name: body.name,
      phone: body.phone,
      email: body.email || '',
      linkExpiry: body.linkExpiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0].replace(/-/g, '/'),
      remarks: body.remarks || '',
      notifyCustomer: body.notifyCustomer !== false
    };

    console.log('Cashgram payload:', JSON.stringify(payload, null, 2));

    let cashgramResponse;
    try {
      cashgramResponse = await fetch(cashgramUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!cashgramResponse.ok) {
        throw new Error(`HTTP ${cashgramResponse.status} from cashgram endpoint`);
      }
    } catch (e) {
      console.error('Failed to create Cashgram:', e);
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 502 }
      );
    }

    let cashgramData;
    try {
      cashgramData = await cashgramResponse.json();
      console.log('Cashgram response:', JSON.stringify(cashgramData, null, 2));
    } catch (e) {
      console.error('Failed to parse Cashgram response:', e);
      return NextResponse.json(
        { error: 'Invalid response from payment service' },
        { status: 502 }
      );
    }

    // Validate successful response
    if (!cashgramData.referenceId && !cashgramData.data?.referenceId) {
      console.error('Reference ID missing in response');
      return NextResponse.json(
        { error: 'Payment processed but no reference ID received' },
        { status: 502 }
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(`Successfully processed payout in ${responseTime}ms`);

    return NextResponse.json({
      status: 'SUCCESS',
      referenceId: cashgramData.referenceId || cashgramData.data?.referenceId,
      responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Payout failed after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
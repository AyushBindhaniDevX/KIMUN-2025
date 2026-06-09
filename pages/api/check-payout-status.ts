import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { referenceId } = req.query;
    
    if (!referenceId) {
      return res.status(400).json({ message: 'Reference ID is required' });
    }

    const cashfreeConfig = {
      clientId: process.env.CASHFREE_CLIENT_ID,
      clientSecret: process.env.CASHFREE_CLIENT_SECRET,
      endpoint: process.env.NEXT_PUBLIC_ENV === 'production' 
        ? 'https://payout-api.cashfree.com' 
        : 'https://payout-gamma.cashfree.com'
    };

    const response = await axios.get(
      `${cashfreeConfig.endpoint}/payout/v1/getTransferStatus?referenceId=${referenceId}`,
      {
        headers: {
          'X-Client-Id': cashfreeConfig.clientId,
          'X-Client-Secret': cashfreeConfig.clientSecret,
        }
      }
    );

    res.status(200).json({
      status: response.data.transfer.status,
      data: response.data
    });

  } catch (error: any) {
    console.error('Cashfree status check error:', error.response?.data || error.message);
    res.status(500).json({
      message: error.response?.data?.message || error.message || 'Status check failed'
    });
  }
}
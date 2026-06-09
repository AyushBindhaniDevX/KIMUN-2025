import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      beneId,
      amount,
      transferId,
      transferMode,
      bankAccount,
      ifsc,
      name,
      email,
      phone,
      remarks
    } = req.body;

    // Cashfree API configuration
    const cashfreeConfig = {
      clientId: process.env.CASHFREE_CLIENT_ID,
      clientSecret: process.env.CASHFREE_CLIENT_SECRET,
      endpoint: process.env.NEXT_PUBLIC_ENV === 'production' 
        ? 'https://payout-api.cashfree.com' 
        : 'https://payout-gamma.cashfree.com'
    };

    // First, check if beneficiary exists or create one
    const beneficiaryResponse = await axios.post(
      `${cashfreeConfig.endpoint}/payout/v1/addBeneficiary`,
      {
        beneId,
        name,
        email,
        phone,
        bankAccount,
        ifsc,
        address1: "KIMUN 2025 Participant",
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': cashfreeConfig.clientId,
          'X-Client-Secret': cashfreeConfig.clientSecret,
        }
      }
    );

    // Then initiate the transfer
    const transferResponse = await axios.post(
      `${cashfreeConfig.endpoint}/payout/v1/requestTransfer`,
      {
        beneId,
        amount,
        transferId,
        transferMode,
        remarks
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': cashfreeConfig.clientId,
          'X-Client-Secret': cashfreeConfig.clientSecret,
        }
      }
    );

    res.status(200).json({
      success: true,
      referenceId: transferResponse.data.referenceId,
      data: transferResponse.data
    });

  } catch (error: any) {
    console.error('Cashfree payout error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Payout failed'
    });
  }
}
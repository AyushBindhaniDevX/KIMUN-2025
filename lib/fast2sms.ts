// lib/fast2sms.ts

const API_KEY = 'reQDjRhwEOWu31HxZ8nd0p2VLNYg7lmb5kvcAtCG4FfKP9XSTqHYjRZhMg6uCapTUS8nE9fiNFvI5eXA'
const PHONE_NUMBER_ID = '1218952421300906'

/**
 * Sends a WhatsApp Template message via Fast2SMS API.
 * 
 * @param messageId The template message ID (e.g. 25457 for payment_completed)
 * @param numbers Comma-separated list of 10-digit mobile numbers
 * @param variables Array of string values to replace template variables
 */
export async function sendWhatsAppTemplate(messageId: string | number, numbers: string, variables: string[] = []) {
  try {
    const url = new URL('https://www.fast2sms.com/dev/whatsapp')
    url.searchParams.append('message_id', messageId.toString())
    url.searchParams.append('phone_number_id', PHONE_NUMBER_ID)
    
    // Fast2SMS requires 10 digit Indian number without country code or 10+ digits with country code.
    url.searchParams.append('numbers', numbers)

    if (variables.length > 0) {
      url.searchParams.append('variables_values', variables.join('|'))
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': API_KEY,
        'Cache-Control': 'no-cache'
      }
    })

    const data = await response.json()
    console.log(`WhatsApp Template ${messageId} sent to ${numbers}:`, data)
    return data
  } catch (error) {
    console.error('Fast2SMS Error:', error)
    return { return: false, error }
  }
}

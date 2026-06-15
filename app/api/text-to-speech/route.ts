import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured' }, { status: 500 })
    }

    // Default to 'Rachel' (21m00Tcm4TlvDq8ikWAM) which is a standard pre-made voice that works on Free Tier.
    // Library voices (like Bill or custom community voices) throw a 402 Payment Required error on the Free plan API.
    // You can override this ID in .env.local via ELEVENLABS_VOICE_ID.
    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', // Multilingual model handles accents well
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API Error:', errorText)
      throw new Error(`ElevenLabs API returned ${response.status}: ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error: any) {
    console.error('TTS Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

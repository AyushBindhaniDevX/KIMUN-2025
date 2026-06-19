import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured' }, { status: 500 });
    }

    // Prepare form data for ElevenLabs
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('file', file);
    elevenLabsFormData.append('model_id', 'scribe_v2');
    // Optional: tag_audio_events=false if we don't want (laughter) etc. Let's keep it clean.
    elevenLabsFormData.append('tag_audio_events', 'false');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs STT API Error:', errorText);
      throw new Error(`ElevenLabs API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error('STT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

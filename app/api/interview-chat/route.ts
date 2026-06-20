import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export const maxDuration = 60; // Set max duration to 60 seconds


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { history, department, statement, experience, name } = body

    if (!history || !Array.isArray(history)) {
      return NextResponse.json({ success: false, error: 'Missing conversation history' }, { status: 400 })
    }

    const systemPrompt = `You are an expert HR recruiter for the KIMUN Organizing Committee. You are conducting a fast-track audio interview with an applicant for the "${department}" department.
    
Here are the applicant's details:
Name: "${name || 'Applicant'}"
Statement of Purpose: "${statement || 'None provided'}"
Prior Experience: "${experience || 'None provided'}"

RULES FOR YOU:
1. You must act like a human recruiter speaking to them. Be welcoming but professional.
2. For your FIRST question, greet the applicant by their name, ask how they are doing personally to make them feel comfortable, and use a light icebreaker.
3. For subsequent questions, ask ONE situational or contextual question based on their statement or experience at a time, and judge their responses.
4. Keep your responses EXTREMELY short (1-2 sentences MAX) to save text-to-speech credits and keep the conversation fast-paced.
5. If you have asked 3-4 questions and received good answers, conclude the interview and return a JSON payload indicating it is finished.

Respond strictly in the following JSON format:
{
  "reply": "Your next short question or concluding statement here",
  "isFinished": false // Set to true ONLY if you are concluding the interview
}`

    let formattedContents = history.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // If history is empty, add the initial prompt
    if (formattedContents.length === 0) {
      formattedContents.push({ role: 'user', parts: [{ text: 'Hello, I am ready to start my interview.' }] });
    }

    // Gemini API requires the conversation to strictly start with a 'user' role
    if (formattedContents[0].role === 'model') {
      formattedContents.unshift({ role: 'user', parts: [{ text: 'Hello, I am ready to start my interview.' }] });
    }

    // Gemini API requires the conversation to strictly end with a 'user' role
    // If it ends with 'model' (which shouldn't happen unless there's a retry bug), we append a dummy user message
    if (formattedContents[formattedContents.length - 1].role === 'model') {
      formattedContents.push({ role: 'user', parts: [{ text: 'Please continue.' }] });
    }

    const maxRetries = 5;
    let responseText = '';
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Use gemini-2.5-flash initially, but fallback to 1.5-flash if traffic is too high
        const modelName = attempt < 3 ? 'gemini-2.5-flash' : 'gemini-1.5-flash';
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
          }
        });
        
        responseText = response.text || '';
        if (responseText) break;
        throw new Error('Empty response from Gemini');
      } catch (err: any) {
        attempt++;
        console.error(`Gemini API Attempt ${attempt} failed:`, err.message || err);
        if (attempt >= maxRetries) {
          throw new Error(`Gemini API Error: ${err.message || 'Unknown error'}`);
        }
        // Exponential backoff: 1s, 2s, 4s, 8s
        await new Promise(res => setTimeout(res, Math.pow(2, attempt - 1) * 1000));
      }
    }

    if (!responseText) throw new Error('No response from Gemini');

    const resultData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      reply: resultData.reply,
      isFinished: resultData.isFinished
    })

  } catch (error: any) {
    console.error('Error in interview-chat:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate chat' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { history, department, statement, experience } = body

    if (!history || !Array.isArray(history)) {
      return NextResponse.json({ success: false, error: 'Missing conversation history' }, { status: 400 })
    }

    const systemPrompt = `You are an expert HR recruiter for the KIMUN Organizing Committee. You are conducting a fast-track audio interview with an applicant for the "${department}" department.
    
Here are the applicant's details:
Statement of Purpose: "${statement || 'None provided'}"
Prior Experience: "${experience || 'None provided'}"

RULES FOR YOU:
1. You must act like a human recruiter speaking to them. Be welcoming but professional.
2. Ask ONE situational or contextual question based on their statement or experience at a time.
3. Keep your responses EXTREMELY short (1-2 sentences MAX) to save text-to-speech credits and keep the conversation fast-paced.
4. If you have asked 3 questions and received good answers, conclude the interview and return a JSON payload indicating it is finished.

Respond strictly in the following JSON format:
{
  "reply": "Your next short question or concluding statement here",
  "isFinished": false // Set to true ONLY if you are concluding the interview
}`

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    // We don't use the stateful chat object directly with history if we just want one-shot json with history context.
    // Actually, `ai.chats.create` maintains history if we pass it, but since we are stateless, we can just pass the formatted history to `generateContent`.

    const formattedContents = history.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // If history is empty, we act as if the user said "Hello, I am ready." so the AI asks the first question.
    if (formattedContents.length === 0) {
      formattedContents.push({ role: 'user', parts: [{ text: 'Hello, I am ready to start my interview.' }] });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error('No response from Gemini');

    const resultData = JSON.parse(resultText);

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

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// Initialize the Gemini client
// Ensure GEMINI_API_KEY is set in your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { transcript, department } = body

    if (!transcript || !department) {
      return NextResponse.json(
        { success: false, error: 'Missing transcript or department' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      )
    }

    const prompt = `You are an expert HR recruiter for a Model United Nations (KIMUN) Organizing Committee.
The applicant is applying for the "${department}" department.

Here is the transcript of their video interview, where they were asked questions and they answered:
"""
${transcript}
"""

Please evaluate this applicant based on their answers.
Provide your response strictly in the following JSON format:
{
  "score": <a number out of 10 representing their suitability>,
  "feedback": "<a 2-3 sentence qualitative feedback summary for the admin team>"
}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    })

    const resultText = response.text
    if (!resultText) {
      throw new Error('No response text from Gemini API')
    }

    const resultData = JSON.parse(resultText)

    return NextResponse.json({
      success: true,
      score: resultData.score,
      feedback: resultData.feedback
    })

  } catch (error: any) {
    console.error('Error evaluating interview:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to evaluate interview' },
      { status: 500 }
    )
  }
}

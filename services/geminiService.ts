
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ChatMessage, FileData } from "../types";

// Initialize the Gemini API client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subjects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subjectName: { type: Type.STRING },
          units: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                unitName: { type: Type.STRING },
                veryImportant: { type: Type.ARRAY, items: { type: Type.STRING } },
                important: { type: Type.ARRAY, items: { type: Type.STRING } },
                optional: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["unitName", "veryImportant", "important", "optional"]
            }
          }
        },
        required: ["subjectName", "units"]
      }
    },
    examFocusPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    suggestedStudyPlan: {
      type: Type.OBJECT,
      properties: {
        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendedOrder: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["steps", "recommendedOrder"]
    }
  },
  required: ["subjects", "examFocusPoints", "suggestedStudyPlan"]
};

/**
 * Handles API errors gracefully, specifically checking for Rate Limits (429).
 */
const handleApiError = (error: any) => {
  console.error("Gemini API Error:", error);
  
  const errorMessage = error?.message || "";
  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
    throw new Error("The AI engine is currently at its limit. Please wait about 30-60 seconds before trying your next analysis.");
  }
  
  throw new Error(errorMessage || "An unexpected error occurred during analysis.");
};

// Switching to gemini-3-flash-preview as it has significantly higher rate limits on the free tier.
export async function analyzeSyllabus(
  file: FileData | null, 
  textInput: string, 
  customQuery: string = ""
): Promise<AnalysisResult> {
  try {
    const parts: any[] = [];
    
    if (file) {
      parts.push({
        inlineData: {
          data: file.base64,
          mimeType: file.mimeType,
        },
      });
    }

    const basePrompt = `You are an expert academic syllabus analyzer for ARAMBH Group. 
    Carefully analyze the content provided. 
    Identify subjects and units. Classify topics into Very Important, Important, and Optional. 
    Predict exam focus areas and suggest a study plan.`;

    const inputPrompt = textInput ? `\n\nSyllabus Text Provided:\n${textInput}` : "";
    const queryPrompt = customQuery ? `\n\nSpecific User Focus: ${customQuery}` : "";

    parts.push({
      text: `${basePrompt}${inputPrompt}${queryPrompt}`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any,
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function explainTopic(topic: string, subject: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the following academic topic in a concise, student-friendly way. Focus on concepts likely to appear in examinations. Subject: ${subject}. Topic: ${topic}. Format the output with clear bullet points and simple language. Keep it under 200 words. No emojis.`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Explanation Error:", error);
    // Return a soft error message instead of throwing
    return "The AI is currently busy. Please try clicking this topic again in a few moments.";
  }
}

export async function getPlatformAssistantResponse(history: ChatMessage[]): Promise<string> {
  const systemInstruction = `You are the AI assistant of ARAMBH Group. 
  Theme: Fire (Passion, Energy). 
  Guide users to the 'Scanner' for PDF analysis. Explain ARAMBH vision: guidance and trust. 
  Tone: Professional, passionate. No emojis.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: { systemInstruction, temperature: 0.7 }
    });
    return response.text || "How can I assist you?";
  } catch (error) {
    return "I am experiencing high demand right now. Let's take a quick 30-second break, then I'll be ready to help you again!";
  }
}

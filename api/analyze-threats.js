import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // RULE 1: Only accept POST requests. Drop everything else.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // RULE 2: Initialize securely using the backend environment variable.
    // This key never reaches the user's browser.
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // RULE 3: Extract the payload sent from your React frontend.
    const { dashboardSummary } = req.body;

    // RULE 4: Advanced Prompt Engineering (Chain-of-Thought)
    // We are forcing the AI to act as a SOC Analyst and structuring its output.
    const prompt = `
      You are an expert Security Operations Center (SOC) AI Analyst specializing in Software-Defined Networking (SDN).
      
      Analyze the following live network telemetry summary from our database:
      ${JSON.stringify(dashboardSummary, null, 2)}
      
      Perform your analysis step-by-step using this strict layout:
      1. THREAT ASSESSMENT: Identify anomalous patterns (e.g., unusual spikes in byte_count, out-of-bounds duration_zscores). Explain your reasoning.
      2. POTENTIAL ATTACK VECTOR: Categorize the likely network threat (e.g., DDoS, port scanning, Ping Flood).
      3. MITIGATION STRATEGY: Provide exactly 2 actionable SDN controller instructions (e.g., specific OpenFlow rules) to mitigate this.
      
      Keep your response concise, professional, and tightly bound to the numbers provided.
    `;

    // RULE 5: Execute the API call to Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Updated to the active 2026 model endpoint
      contents: prompt,
    });

    // RULE 6: Send the generated text back to the frontend
    return res.status(200).json({ insight: response.text });

  } catch (error) {
    console.error("Backend API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
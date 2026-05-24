// File: src/components/AISecurityAnalyst.jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AISecurityAnalyst({ currentLogs, kpis }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const generateAIInsight = async () => {
    setLoading(true);
    setInsight(""); 

    try {
      // THE PAYLOAD: We package the live React state into a JSON object.
      // This is the data that gets injected into the AI's prompt.
      const dashboardSummary = {
        totalRecordsAnalyzed: kpis?.totalRecords || 0,
        averageByteCount: kpis?.avgBytes || 0,
        maxDurationZScore: kpis?.maxZScore || 0,
        recentAnomalousEvents: currentLogs ? currentLogs.slice(0, 5) : []
      };

      // THE DISPATCH: Send the payload to our Vercel Serverless Function
      const response = await fetch('/api/analyze-threats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardSummary })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // THE RESPONSE: Unpack the JSON and update the UI state
      const data = await response.json();
      setInsight(data.insight);

    } catch (error) {
      console.error("AI Generation failed:", error);
      setInsight("Error generating security brief. Ensure the API key is valid and the backend is reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-lg mt-6">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold tracking-wide text-blue-400">🧠 Gemini SOC Analyst</h2>
        
        {/* The Trigger */}
        <button 
          onClick={generateAIInsight}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 font-medium rounded-lg transition-colors text-sm shadow"
        >
          {loading ? "Analyzing Pipeline..." : "Generate Live Insight"}
        </button>
      </div>

      {/* The Display Layer */}
      {insight ? (
        <div className="prose prose-invert max-w-none text-slate-300 text-sm bg-slate-950 p-4 rounded-lg border border-slate-800 leading-relaxed">
          {/* We use ReactMarkdown to format the asterisks and hashes returned by Gemini */}
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-slate-500 text-sm italic text-center py-4">
          Click the button above to feed current SDN metrics to the Gemini instance for real-time risk assessment.
        </p>
      )}
    </div>
  );
}
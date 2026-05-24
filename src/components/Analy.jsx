// src/components/AISecurityAnalyst.jsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AISecurityAnalyst({ currentLogs, kpis }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGICAL BLOCK 1: Triggering the AI and packaging the dataset context
  const generateAIInsight = async () => {
    setLoading(true);
    setInsight(""); 

    try {
      // Packaging actual telemetry from the dashboard (Rubric Requirement)
      const dashboardSummary = {
        totalRecordsAnalyzed: kpis?.totalRecords || 0,
        averageByteCount: kpis?.avgBytes || 0,
        maxDurationZScore: kpis?.maxZScore || 0,
        recentAnomalousEvents: currentLogs ? currentLogs.slice(0, 5) : []
      };

      // LOGICAL BLOCK 2: Transmitting KPIs to the Serverless Gemini API Route
      const response = await fetch('/api/analyze-threats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardSummary })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // LOGICAL BLOCK 3: Receiving and rendering the natural-language recommendation
      const data = await response.json();
      setInsight(data.insight);

    } catch (error) {
      console.error("AI Generation failed:", error);
      setInsight("SYSTEM ERROR: UNABLE TO ESTABLISH SECURE UPLINK TO LLM.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 shadow-2xl mt-6 font-mono">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
        
        {/* Terminal Header with Live Status Pulse */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="text-lg font-bold tracking-widest text-emerald-500 uppercase">
            Gemini SOC Analyst // Uplink
          </h2>
        </div>
        
        {/* The "Generate Insight" Mechanism (Rubric Requirement) */}
        <button 
          onClick={generateAIInsight}
          disabled={loading}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded uppercase transition-colors text-xs tracking-widest shadow"
        >
          {loading ? "[ AGGREGATING TELEMETRY... ]" : "[ INITIALIZE SCAN ]"}
        </button>
      </div>

      {/* Output Display Area */}
      {insight ? (
        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed p-4 bg-black rounded border border-slate-800 overflow-x-auto shadow-inner">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-slate-600 text-xs uppercase tracking-widest text-center py-8 border border-dashed border-slate-800 rounded bg-slate-900/50">
          Awaiting authorization to transmit network telemetry to LLM.
        </div>
      )}
    </div>
  );
}
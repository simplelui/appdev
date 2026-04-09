import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from './lib/supabaseClient'
import { Bar, Line, Pie } from 'react-chartjs-2' 
import 'chart.js/auto'
import './App.css' 
import LiveThreatFeed from './components/livethreatfeed'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [windowIndex, setWindowIndex] = useState(0)
  
  // --- MOBILE NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('charts'); // 'charts' or 'feed'

  const [protocolFilter, setProtocolFilter] = useState('ALL')
  const [showOnlyThreats, setShowOnlyThreats] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true);
    const { count } = await supabase.from('sdn_traffic').select('*', { count: 'exact', head: true });
    const pageSize = 1000;
    const fetchPromises = [];
    for (let i = 0; i < Math.ceil(count / pageSize); i++) {
      fetchPromises.push(supabase.from('sdn_traffic').select('*').range(i * pageSize, (i + 1) * pageSize - 1));
    }
    const results = await Promise.all(fetchPromises);
    const allData = results.flatMap(res => res.data || []);
    setData(allData);
    setLoading(false);
  };

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchesProtocol = protocolFilter === 'ALL' || String(d.protocol) === protocolFilter;
      const matchesThreat = !showOnlyThreats || String(d.label) === '1';
      return matchesProtocol && matchesThreat;
    });
  }, [data, protocolFilter, showOnlyThreats]);

  useEffect(() => {
    if (filteredData.length === 0) return;
    const ticker = setInterval(() => {
      setWindowIndex((prev) => (prev + 1) % (filteredData.length - 50 || 1));
    }, 1000);
    return () => clearInterval(ticker);
  }, [filteredData]);

  const totalLogs = filteredData.length
  const avgBytes = totalLogs > 0 ? (filteredData.reduce((acc, curr) => acc + (Number(curr.byte_count) || 0), 0) / totalLogs).toFixed(2) : 0
  const threatCount = filteredData.filter(d => String(d.label) === '1').length;

  if (loading) return <div className="loading"><h1>LOADING...</h1></div>;

  return (
    <div className="dashboard-root">
      {/* MOBILE TAB BAR: Only visible on small screens */}
      <nav className="mobile-nav-bar">
        <button 
          className={activeTab === 'charts' ? 'nav-active' : ''} 
          onClick={() => setActiveTab('charts')}
        >
          ANALYSIS
        </button>
        <button 
          className={activeTab === 'feed' ? 'nav-active' : ''} 
          onClick={() => setActiveTab('feed')}
        >
          LIVE FEED
        </button>
      </nav>

      <header className="dashboard-header">
        <div className="title-area">
          <h1>GROWKNEE SDN NETWORK MONITORING</h1>
          <p>Made by</p>
        </div>
        <div className="control-area">
          <select className="ui-input" value={protocolFilter} onChange={(e) => setProtocolFilter(e.target.value)}>
            <option value="ALL">ALL PROTOCOLS</option>
            <option value="6">TCP (6)</option>
            <option value="17">UDP (17)</option>
            <option value="1">ICMP (1)</option>
          </select>
          <button className={`ui-btn ${showOnlyThreats ? 'btn-danger' : ''}`} onClick={() => setShowOnlyThreats(!showOnlyThreats)}>
            {showOnlyThreats ? '⚠️ THREATS' : '🔍 ALL'}
          </button>
        </div>
      </header>

      <main className={`main-layout ${activeTab}`}>
        {/* LEFT COLUMN: CHARTS */}
        <section className="column-charts">
          <div className="kpi-strip">
            <div className="kpi"><span>LOGS</span><strong>{totalLogs.toLocaleString()}</strong></div>
            <div className="kpi"><span>AVG</span><strong>{avgBytes}B</strong></div>
            <div className="kpi threat-kpi"><span>THREATS</span><strong>{threatCount}</strong></div>
          </div>

          <div className="card telemetry-card">
            <h3>TELEMETRY STREAM</h3>
            <div className="chart-box">
              <Line 
                data={{
                  labels: filteredData.slice(windowIndex, windowIndex + 50).map((_, i) => i),
                  datasets: [{
                    data: filteredData.slice(windowIndex, windowIndex + 50).map(d => d.byte_count),
                    tension: 0, borderColor: '#00e5ff', borderWidth: 1.5, pointRadius: 0, fill: true,
                    backgroundColor: 'rgba(0, 229, 255, 0.05)'
                  }]
                }} 
                options={{ maintainAspectRatio: false, animation: false, scales: { x: { display: false } }, plugins: { legend: { display: false } } }} 
              />
            </div>
          </div>

          <div className="dual-row">
            <div className="card small-card">
              <h3>PROTOCOLS</h3>
              <div className="chart-box">
                <Bar 
                  data={{
                    labels: ['TCP', 'UDP', 'ICMP'],
                    datasets: [{
                      data: [
                        filteredData.filter(d => String(d.protocol) === '6').length,
                        filteredData.filter(d => String(d.protocol) === '17').length,
                        filteredData.filter(d => String(d.protocol) === '1').length,
                      ],
                      backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b']
                    }]
                  }} 
                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                />
              </div>
            </div>
            <div className="card small-card">
              <h3>RATIO</h3>
              <div className="chart-box">
                <Pie 
                  data={{ labels: ['Normal', 'Attack'], datasets: [{ data: [totalLogs - threatCount, threatCount], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] }} 
                  options={{ maintainAspectRatio: false }} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: LIVE THREAT STREAM */}
        <aside className="column-feed">
          <div className="feed-container">
            <LiveThreatFeed />
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
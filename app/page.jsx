"use client";
import React, { useState, useEffect, useContext, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ScatterChart,
  Scatter, CartesianGrid
} from 'recharts'
import { Sun, Cloud, Search, Menu, AlertCircle, CheckCircle, Loader,
  MessageSquare, FileText, Bot, Download, Upload, User, Send, Play,
  Pause, Save, Trash2
 } from 'lucide-react'

const API_BASE_URL =  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // for development server use http://localhost:5000 

const COLORS = {
  operations: '#10b981',
  logistics: '#06b6d4',
  risk: {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700'
  },
  tier: {
    'Tier-1': 'bg-purple-100 text-purple-700',
    'Tier-2': 'bg-blue-100 text-blue-700',
    'Tier-3': 'bg-slate-100 text-slate-700'
  }
}

const calculatePieData = (suppliers) => {
  if (!suppliers || suppliers.length === 0) {
    return [
      { name: 'Operations', value: 100 },
      { name: 'Logistics', value: 0 }
    ];
  }
  
  const totalEmissions = suppliers.reduce((sum, s) => sum + safeParseNumber(s.emissions), 0);

  const operationsEmissions = suppliers
    .filter(s => s.category && s.category.toLowerCase().includes('manufactur'))
    .reduce((sum, s) => sum + safeParseNumber(s.emissions), 0);
  
  const logisticsEmissions = suppliers
    .filter(s => s.category && s.category.toLowerCase().includes('logistics'))
    .reduce((sum, s) => sum + safeParseNumber(s.emissions), 0);
  
  const operationsPct = totalEmissions > 0 ? Math.round((operationsEmissions / totalEmissions) * 100) : 50;
  const logisticsPct = totalEmissions > 0 ? Math.round((logisticsEmissions / totalEmissions) * 100) : 50;
  
  return [
    { name: 'Operations', value: operationsPct },
    { name: 'Logistics', value: logisticsPct }
  ];
};

const getRiskColor = (risk) => {
  if (risk >= 85) return COLORS.risk.critical;
  if (risk >= 70) return COLORS.risk.high;
  if (risk >= 50) return COLORS.risk.medium;
  return COLORS.risk.low;
}

const safeParseNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return Number(value);
}

const safeParseArray = (arr, defaultValue = []) => {
  if (!Array.isArray(arr)) return defaultValue;
  return arr.map(item => {
    if (typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          typeof value === 'number' ? safeParseNumber(value) : value
        ])
      );
    }
    return safeParseNumber(item);
  });
}

const apiService = {
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  async getForecast(facilityId = 'F001', horizonDays = 30) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/forecast/emissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: facilityId, horizon_days: horizonDays })
      });
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.success && data.forecast) {
        data.forecast = safeParseArray(data.forecast);
        if (data.confidence_intervals) {
          data.confidence_intervals = safeParseArray(data.confidence_intervals);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Forecast API error:', error);
      throw error;
    }
  },

  async optimizeScenario(scenario) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/optimize/supply-chain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      const text = await response.text();
      const data = JSON.parse(text);
      
      // Clean optimization data
      if (data.success && data.results) {
        data.results = {
          ...data.results,
          baseline_emissions: safeParseNumber(data.results.baseline_emissions, 100000),
          optimized_emissions: safeParseNumber(data.results.optimized_emissions, 80000),
          emission_reduction_pct: safeParseNumber(data.results.emission_reduction_pct, 20),
          cost_change_pct: safeParseNumber(data.results.cost_change_pct, 5),
          baseline_cost: safeParseNumber(data.results.baseline_cost, 500000),
          optimized_cost: safeParseNumber(data.results.optimized_cost, 525000)
        };
      }
      
      return data;
    } catch (error) {
      console.error('Optimization API error:', error);
      throw error;
    }
  },

  async analyzeRegulation(text, analysisType = 'regulation', supplierId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze/regulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          regulation_text: text,
          analysis_type: analysisType,
          supplier_id: supplierId
        })
      });
      const textResponse = await response.text();
      const data = JSON.parse(textResponse);
      return data;
    } catch (error) {
      console.error('Regulation analysis error:', error);
      throw error;
    }
  },

  async chatWithRegulationBot(question) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/regulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const textResponse = await response.text();
      const data = JSON.parse(textResponse);
      return data;
    } catch (error) {
      console.error('Regulation chatbot error:', error);
      throw error;
    }
  },

async generateReport(reportType, parameters = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        report_type: reportType,
        parameters: parameters
      })
    });
    const textResponse = await response.text();
    const data = JSON.parse(textResponse);
    return data;
  } catch (error) {
    console.error('Report generation error:', error);
    throw error;
  }
},

async chatWithReportingAssistant(question) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat/reporting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const textResponse = await response.text();
    const data = JSON.parse(textResponse);
    return data;
  } catch (error) {
    console.error('Reporting assistant error:', error);
    throw error;
  }
},

async downloadReport(reportId, reportType) {
  try {
    const downloadUrl = `${API_BASE_URL}/api/v1/download/${reportId}?type=${reportType}`;
    
    // Create a hidden anchor element to trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${reportId}.${reportType}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
    
    return { success: true, reportId };
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
},

async getReportStatus(reportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/report/status/${reportId}`);
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
},

async getSuppliers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/suppliers`);
    const text = await response.text();
    const data = JSON.parse(text);
    
    // Clean supplier data
    if (data.success && data.suppliers) {
      data.suppliers = data.suppliers.map(s => ({
        ...s,
        id: s.id || `S-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: s.name || s.supplier_name || 'Unknown Supplier',
        country: s.country || 'Unknown',
        emissions: safeParseNumber(s.emissions || s.total_emissions_kg),
        risk: safeParseNumber(s.risk, 50),
        renewable_pct: safeParseNumber(s.renewable_pct || s.renewable_energy_pct, 0),
        tier: s.tier || 'Tier-1',
        category: s.category || 'Manufacturing',
        status: s.status || 'Active'
      }));
    }
    
    return data;
  } catch (error) {
    console.error('Suppliers API error:', error);
    throw error;
  }
},

async addSupplier(supplierData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData)
    });
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Add supplier error:', error);
    throw error;
  }
},

async updateSupplier(supplierId, supplierData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/${supplierId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData)
    });
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Update supplier error:', error);
    throw error;
  }
},

async deleteSupplier(supplierId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/${supplierId}`, {
      method: 'DELETE'
    });
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Delete supplier error:', error);
    throw error;
  }
},

async uploadSupplierFile(file, fileType = 'csv') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/upload`, {
      method: 'POST',
      body: formData
    });
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Upload supplier file error:', error);
    throw error;
  }
},

async getSupplierAnalytics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/suppliers/analytics`);
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Supplier analytics error:', error);
    throw error;
  }
},

async loadScenarios() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenarios`);
    return await response.json();
  } catch (err) {
    console.error("Error loading scenarios:", err);
    return { success: false, scenarios: [] };
  }
},

async saveScenario(scenario) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario)
    });
    return await response.json();
  } catch (err) {
    console.error("Error saving scenario:", err);
    return { success: false };
  }
},

async deleteScenario(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/scenarios/${id}`, {
      method: "DELETE"
    });
    return await response.json();
  } catch (err) {
    console.error("Error deleting scenario:", err);
    return { success: false };
  }
}

};

export default function SSCAApp() {
  const [active, setActive] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [scenario, setScenario] = useState({ modalShiftPct: 30, renewableIncreasePct: 50 })
  const [forecastData, setForecastData] = useState([])
  const [supplierData, setSupplierData] = useState([])
  const [optimizationData, setOptimizationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [error, setError] = useState(null)

  useEffect(() => {
    initializeApp();
  }, [])

  const initializeApp = async () => {
    await checkBackendHealth();
    await loadInitialData();
  }

  const checkBackendHealth = async () => {
    try {
      const data = await apiService.checkHealth();
      setBackendStatus(data.status === 'healthy' ? 'connected' : 'error');
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('disconnected');
      setError('Cannot connect to backend. Make sure Docker is running.');
    }
  }

  const loadInitialData = async () => {
  try {
    setLoading(true);

    const forecastRes = await apiService.getForecast();
    if (forecastRes.success) {
      // Handle both array and object formats from API
      if (Array.isArray(forecastRes.forecast)) {
        const formatted = forecastRes.forecast.map((value, idx) => ({
          date: forecastRes.dates?.[idx] || forecastRes.dates?.[idx] || `D${idx + 1}`,
          emissions: Math.round(safeParseNumber(value)),
          lower: forecastRes.confidence_intervals ? 
            Math.round(safeParseNumber(forecastRes.confidence_intervals[idx]?.[0], value * 0.9)) : 
            Math.round(safeParseNumber(value) * 0.9),
          upper: forecastRes.confidence_intervals ? 
            Math.round(safeParseNumber(forecastRes.confidence_intervals[idx]?.[1], value * 1.1)) : 
            Math.round(safeParseNumber(value) * 1.1)
        }));
        setForecastData(formatted);
      } else if (forecastRes.forecast && typeof forecastRes.forecast === 'object') {
        const formatted = Object.entries(forecastRes.forecast).map(([date, value], idx) => ({
          date: date || `D${idx + 1}`,
          emissions: Math.round(safeParseNumber(value)),
          lower: Math.round(safeParseNumber(value) * 0.9),
          upper: Math.round(safeParseNumber(value) * 1.1)
        }));
        setForecastData(formatted);
      }
    } else {
      setForecastData([]);
    }

    const supplierRes = await apiService.getSuppliers();
    if (supplierRes.success) {
      const suppliers = Array.isArray(supplierRes.suppliers) ? 
        supplierRes.suppliers : 
        (supplierRes.suppliers ? Object.values(supplierRes.suppliers) : []);
      
      const cleanedSuppliers = suppliers.map(s => ({
        id: s.id || `S-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: s.name || s.supplier_name || 'Unknown Supplier',
        country: s.country || 'Unknown',
        emissions: safeParseNumber(s.emissions || s.total_emissions_kg),
        risk: safeParseNumber(s.risk, 50),
        renewable_pct: safeParseNumber(s.renewable_pct || s.renewable_energy_pct, 0),
        tier: s.tier || 'Tier-1',
        category: s.category || 'Manufacturing',
        status: s.status || 'Active',
        created_at: s.created_at,
        last_updated: s.last_updated
      }));
      
      setSupplierData(cleanedSuppliers);
    } else {
      setSupplierData([]);
    }

    await runOptimization(scenario);

    setLoading(false);
    setError(null);
  } catch (error) {
    console.error('Error loading data:', error);
    setLoading(false);
    setError('Failed to load data from backend. Make sure the backend server is running.');
    
    setForecastData([]);
    setSupplierData([]);
  }
}

  const runOptimization = async (scenarioParams) => {
    try {
      const data = await apiService.optimizeScenario(scenarioParams);
      if (data.success) {
        setOptimizationData(data.results);
      }
    } catch (error) {
      console.error('Optimization error:', error);
    }
  }

  if (loading) {
    return <LoadingScreen backendStatus={backendStatus} />
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <Header 
          query={query} 
          setQuery={setQuery} 
          setActive={setActive} 
          backendStatus={backendStatus}
        />

        {error && <ErrorBanner error={error} onRetry={initializeApp} />}

        <div className="grid grid-cols-12 gap-6 mt-6">
          <Sidebar active={active} setActive={setActive} backendStatus={backendStatus} />
          
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            <div className="bg-white rounded-2xl p-6 shadow">
              <ContentRouter 
                active={active}
                forecastData={forecastData}
                supplierData={supplierData}
                scenario={scenario}
                setScenario={setScenario}
                optimizationData={optimizationData}
                runOptimization={runOptimization}
              />
            </div>
          </main>
        </div>

        <Footer backendStatus={backendStatus} />
      </div>
    </div>
  )
}

function LoadingScreen({ backendStatus }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader className="animate-spin h-12 w-12 text-teal-500 mx-auto" />
        <p className="mt-4 text-slate-600">Loading SSCA Dashboard...</p>
        <p className="text-sm text-slate-400 mt-2">Connecting to MindSpore Backend</p>
        <p className="text-xs text-slate-400 mt-1">Status: {backendStatus}</p>
      </div>
    </div>
  )
}

function ErrorBanner({ error, onRetry }) {
  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
      <div>
        <p className="text-sm text-red-800 font-medium">Connection Error</p>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <button 
          onClick={onRetry}
          className="mt-2 text-xs text-red-700 underline hover:text-red-900"
        >
          Retry Connection
        </button>
      </div>
    </div>
  )
}

function Header({ query, setQuery, setActive, backendStatus }) {
  return (
    <header className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow">
          <Sun size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">SSCA</h1>
          <p className="text-sm text-slate-500">Sustainable Supply Chain AI Advisor</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={backendStatus} />
      </div>
    </header>
  )
}

function StatusBadge({ status }) {
  const isConnected = status === 'connected';
  return (
    <div className={`px-3 py-2 rounded-2xl shadow flex items-center gap-2 ${
      isConnected ? 'bg-green-50 text-green-700' : 'bg-white'
    }`}>
      <Cloud size={16} /> 
      <span className="text-sm hidden sm:inline">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}

function Footer({ backendStatus }) {
  return (
    <footer className="mt-6 text-sm text-slate-500 flex justify-between items-center">
      <span>SSCA Dashboard · Built with Next.js & MindSpore AI</span>
      <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 ${
        backendStatus === 'connected' ? 'bg-green-100 text-green-700' :
        backendStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>
        {backendStatus === 'connected' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
        Backend: {backendStatus}
      </span>
    </footer>
  )
}

function Sidebar({ active, setActive, backendStatus }) {
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'modules', label: 'Modules', icon: '🧩' },
    { key: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { key: 'optimization', label: 'Optimization', icon: '⚡' },
    { key: 'reporting', label: 'Reporting', icon: '📄' },
    { key: 'regulations', label: 'Regulations', icon: '⚖️' }
  ];

  return (
    <nav className="h-fit col-span-12 md:col-span-3 lg:col-span-2 bg-white rounded-2xl p-4 shadow">
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.key}>
            <button
              onClick={() => setActive(item.key)}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition ${
                active === item.key 
                  ? 'bg-slate-100 font-semibold text-slate-900' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-4 pb-4 border-t border-slate-100">
        <div className="text-xs text-slate-500 space-y-1">
          <div>Data: {backendStatus === 'connected' ? 'Real-time' : 'Mock'}</div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span>MindSpore 2.7.1</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

const RegulationContext = React.createContext();

function ContentRouter({ 
  active, 
  forecastData, 
  supplierData,
  scenario, 
  setScenario, 
  optimizationData, 
  runOptimization 
}) {
  const [regulationText, setRegulationText] = useState('');
  const [nlpResult, setNlpResult] = useState(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const pieData = calculatePieData(supplierData);
  
  const handleAnalyzeRegulation = async () => {
    if (!regulationText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await apiService.analyzeRegulation(regulationText);
      setNlpResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      setNlpResult({
        success: false,
        error: 'Failed to analyze regulation text'
      });
    }
    setIsAnalyzing(false);
  };
  
  const handleChatSubmit = async () => {
    if (!chatQuestion.trim()) return;
    
    setIsChatting(true);
    try {
      const response = await apiService.chatWithRegulationBot(chatQuestion);
      setChatResponse(response);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatResponse({
        success: false,
        error: 'Failed to get response from chatbot'
      });
    }
    setIsChatting(false);
  };
  
  const routes = {
    dashboard: (
      <Dashboard
        forecastData={forecastData}
        supplierData={supplierData}
        pieData={pieData}
        scenario={scenario}
        setScenario={setScenario}
        runOptimization={runOptimization}
      />
    ),
    modules: <ModulesExplorer />,
    optimization: (
      <Optimization 
        scenario={scenario} 
        setScenario={setScenario} 
        optimizationData={optimizationData}
        runOptimization={runOptimization}
      />
    ),
    reporting: <Reporting />,
    suppliers: <SupplierManagement />,
    regulations: (
      <RegulationContext.Provider value={{
        regulationText,
        setRegulationText,
        nlpResult,
        setNlpResult,
        chatQuestion,
        setChatQuestion,
        chatResponse,
        setChatResponse,
        isAnalyzing,
        setIsAnalyzing,
        isChatting,
        setIsChatting,
        handleAnalyzeRegulation,
        handleChatSubmit
      }}>
        <Regulations />
      </RegulationContext.Provider>
    )
  };
  
  return routes[active] || routes.dashboard;
}

function MetricsCards({ avgEmissions, highRiskSuppliers, supplierData, uniqueCountries }) {
  const metrics = [
    {
      title: 'Avg Daily Emissions',
      value: `${avgEmissions.toLocaleString()} kg`,
      subtitle: 'CO₂e (30-day forecast)',
      gradient: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      textColor: 'text-blue-600',
      valueColor: 'text-blue-900'
    },
    {
      title: 'High-Risk Suppliers',
      value: highRiskSuppliers,
      subtitle: 'Risk score ≥ 70',
      gradient: 'from-red-50 to-red-100',
      border: 'border-red-200',
      textColor: 'text-red-600',
      valueColor: 'text-red-900'
    },
    {
      title: 'Active Suppliers',
      value: supplierData.length,
      subtitle: `Across ${uniqueCountries} countries`,
      gradient: 'from-green-50 to-green-100',
      border: 'border-green-200',
      textColor: 'text-green-600',
      valueColor: 'text-green-900'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => (
        <div key={idx} className={`bg-gradient-to-br ${metric.gradient} rounded-xl p-4 border ${metric.border}`}>
          <div className={`text-sm ${metric.textColor} font-medium`}>{metric.title}</div>
          <div className={`text-2xl font-bold ${metric.valueColor} mt-1`}>{metric.value}</div>
          <div className={`text-xs ${metric.textColor} mt-1`}>{metric.subtitle}</div>
        </div>
      ))}
    </div>
  );
}

function ForecastChart({ data }) {
  return (
    <div className="col-span-2 bg-white rounded-xl p-4 shadow border border-slate-100">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        30-Day Emission Forecast (MindSpore LSTM)
      </h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255,255,255,0.95)', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Line type="monotone" dataKey="emissions" stroke="#0ea5a4" strokeWidth={2} dot={false} name="Predicted" />
            <Line type="monotone" dataKey="lower" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Lower" />
            <Line type="monotone" dataKey="upper" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="3 3" name="Upper" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Model: LSTM-Attention with uncertainty quantification
      </div>
    </div>
  )
}

function SourceBreakdownChart({ data }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        Source Breakdown
      </h3>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie 
              dataKey="value" 
              data={data} 
              innerRadius={45} 
              outerRadius={75} 
              label
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.operations : COLORS.logistics} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ScenarioPlaybookSidebar({ onLoadScenario }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiService.loadScenarios();
        if (mounted && res.success) setScenarios(res.scenarios || []);
      } catch (e) {
        console.error('Failed to load scenarios', e);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <aside className="w-64 bg-white rounded-xl shadow p-4 space-y-3 border border-slate-100">
      <h4 className="font-semibold text-sm">Scenario Playbook</h4>

      <div className="text-xs text-slate-500">Presets & saved scenarios</div>

      {loading ? (
        <div className="pt-4"><Loader className="animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {scenarios.length === 0 && (
            <div className="text-xs text-slate-400">No saved scenarios. Create a new one below.</div>
          )}
          {scenarios.map((s) => (
            <div
              key={s.id}
              className="w-full p-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between"
            >
              <button
                onClick={() => onLoadScenario(s)}
                className="text-left flex-1"
              >
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.description || `${s.modal_shift_pct}% modal, +${s.renewable_increase_pct}% renew`}
                </div>
              </button>

              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const confirmed = confirm(`Delete scenario "${s.name}"?`);
                  if (!confirmed) return;
                  const res = await apiService.deleteScenario(s.id);
                  if (res.success) {
                    setScenarios(prev => prev.filter(x => x.id !== s.id));
                  } else {
                    alert("Failed to delete scenario.");
                  }
                }}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

        </div>
      )}
    </aside>
  );
}

function ScenarioControls({ scenario, setScenario, onSimulate, optimizationData }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0); // 0..100 timeline
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTime((t) => {
        const nt = t + 2;
        if (nt > 100) { setPlaying(false); return 100; }
        return nt;
      });
    }, 450); 
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  useEffect(() => {
    const frac = time / 100;
    const animatedScenario = {
      modalShiftPct: Math.round((scenario.modalShiftTarget || scenario.modalShiftPct || 0) * frac),
      renewableIncreasePct: Math.round((scenario.renewableTarget || scenario.renewableIncreasePct || 0) * frac)
    };
    setScenario(prev => ({ ...prev, ...animatedScenario }));
    onSimulate(animatedScenario);
  }, [time]);

  const handlePlayToggle = () => {
    setPlaying(p => !p);
  };

  const handleSave = async () => {
    const payload = {
      name: scenario.name || `Scenario ${new Date().toLocaleString()}`,
      description: scenario.description || '',
      modal_shift_pct: scenario.modalShiftPct,
      renewable_increase_pct: scenario.renewableIncreasePct,
      created_at: new Date().toISOString()
    };
    try {
      const res = await apiService.saveScenario(payload);
      if (res.success) {
        alert('Saved scenario to playbook');
      } else {
        alert('Failed to save scenario');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving scenario');
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow border border-slate-100 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="text-xs text-slate-600">Modal shift (target %)</label>
          <input
            type="text" 
            value={scenario.modalShiftTarget ?? scenario.modalShiftPct}
            onChange={(e) => {
              const inputValue = e.target.value;
              const numberValue = Number(inputValue);

              if (!isNaN(numberValue)) {
                let finalValue = numberValue;

                if (numberValue > 100) {
                  finalValue = 100;
                }

                if (numberValue < 0) {
                  finalValue = 0;
                }

                setScenario(prev => ({ 
                  ...prev, 
                  modalShiftTarget: finalValue 
                }));
              }
            }}
            className="w-32 p-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-600">Renewable increase (target %)</label>
          <input
            type="text" 
            value={scenario.renewableTarget ?? scenario.renewableIncreasePct}
            onChange={(e) => {
              const inputValue = e.target.value;
              const numberValue = Number(inputValue);

              if (!isNaN(numberValue)) {
                let finalValue = numberValue;

                if (numberValue > 100) {
                  finalValue = 100;
                }

                if (numberValue < 0) {
                  finalValue = 0;
                }

                setScenario(prev => ({ 
                  ...prev, 
                  renewableTarget: finalValue 
                }));
              }
            }}
            className="w-32 p-2 border rounded-lg text-sm"
          />
        </div>

        <div className="flex flex-col items-end">
          <div className="flex gap-2">
            <button onClick={handlePlayToggle} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-50 flex items-center gap-2">
              {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => { setTime(100); setPlaying(false); }} className="px-3 py-2 rounded-lg border">Jump</button>
            <button onClick={handleSave} className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 flex items-center gap-2">
              <Save size={14} /> Save
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <Metric label="Emission Δ" value={optimizationData ? `${Math.round((optimizationData.emission_reduction_pct || 0))}%` : '—'} />
        <Metric label="Cost Δ" value={optimizationData ? `${Math.round((optimizationData.cost_change_pct || 0))}%` : '—'} />
        <Metric label="Baseline Emissions" value={optimizationData ? (optimizationData.baseline_emissions || '—') : '—'} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-slate-50 p-3 rounded-lg">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ParetoChart({ paretoSolutions, optimizationData, scenario, isOptimizing }) {
  const chartData = React.useMemo(() => {
    if (paretoSolutions && paretoSolutions.length > 0) {
      const sorted = paretoSolutions
        .map((p, idx) => ({
          id: idx,
          cost: Math.round(p.cost || p.optimized_cost || 0),
          emissions: Math.round(p.emissions || p.optimized_emissions || 0),
          label: p.name || `sol-${idx+1}`
        }))
        .sort((a, b) => b.emissions - a.emissions); // Sort by emissions descending
      
      // Calculate cumulative percentage
      const totalEmissions = sorted.reduce((sum, s) => sum + s.emissions, 0);
      let cumulative = 0;
      
      return sorted.map((s) => {
        cumulative += s.emissions;
        return {
          ...s,
          cumulativePct: Math.round((cumulative / totalEmissions) * 100)
        };
      });
    }
    
    // Generate synthetic pareto data from current optimization
    if (!optimizationData) {
      return [];
    }
    
    const baseline = {
      id: 0,
      cost: Math.round(optimizationData.baseline_cost || 500000),
      emissions: Math.round(optimizationData.baseline_emissions || 100000),
      label: 'Baseline'
    };
    
    const optimized = {
      id: 1,
      cost: Math.round(optimizationData.optimized_cost || 525000),
      emissions: Math.round(optimizationData.optimized_emissions || 80000),
      label: `Optimized`
    };
    
    // Generate intermediate points for pareto front
    const intermediate1 = {
      id: 2,
      cost: Math.round(baseline.cost * 1.02),
      emissions: Math.round(baseline.emissions * 0.92),
      label: 'Conservative'
    };
    
    const intermediate2 = {
      id: 3,
      cost: Math.round(baseline.cost * 1.04),
      emissions: Math.round(baseline.emissions * 0.85),
      label: 'Balanced'
    };
    
    const aggressive = {
      id: 4,
      cost: Math.round(baseline.cost * 1.08),
      emissions: Math.round(baseline.emissions * 0.75),
      label: 'Aggressive'
    };
    
    const data = [baseline, intermediate1, optimized, intermediate2, aggressive]
      .sort((a, b) => b.emissions - a.emissions);
    
    // Calculate cumulative percentage
    const totalEmissions = data.reduce((sum, s) => sum + s.emissions, 0);
    let cumulative = 0;
    
    return data.map((s) => {
      cumulative += s.emissions;
      return {
        ...s,
        cumulativePct: Math.round((cumulative / totalEmissions) * 100)
      };
    });
  }, [paretoSolutions, optimizationData, scenario]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
        <h4 className="font-medium text-sm mb-2">Pareto Analysis (Emissions by Solution)</h4>
        <div className="p-8 text-center text-slate-500">
          <div className="text-xs">Run an optimization to see pareto analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
      <h4 className="font-medium text-sm mb-2 flex items-center justify-between">
        <span>Pareto Analysis (Emissions by Solution)</span>
        <span className="text-xs text-slate-500">
          {scenario?.modalShiftPct || 0}% modal, {scenario?.renewableIncreasePct || 0}% renew
        </span>
      </h4>
      <div style={{ width: '100%', height: 240 }} key={`pareto-${chartData.length}-${chartData[0]?.emissions}`}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10 }}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'Emissions (kg)', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
              label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ fontSize: '12px' }}
              formatter={(value, name) => {
                if (name === 'Emissions') {
                  return [`${value.toLocaleString()} kg`, name];
                }
                if (name === 'Cost') {
                  return [
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0
                    }).format(value),
                    name
                  ];
                }
                return [`${value}%`, name];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <Bar yAxisId="left" dataKey="emissions" name="Emissions" fill="#3b82f6">
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.label === 'Baseline' ? '#ef4444' : 
                    entry.label === 'Optimized' ? '#10b981' : 
                    '#3b82f6'
                  } 
                />
              ))}
            </Bar>
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumulativePct" 
              name="Cumulative %" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-slate-500 mt-2">
        Red: Baseline • Green: Optimized • Blue: Alternative Solutions • Orange Line: Cumulative %
      </div>
    </div>
  );
}

function ScenarioDetailsPanel({ optimizationData }) {
  if (!optimizationData) {
    return <div className="text-xs text-slate-500 p-4">Run a simulation to see details.</div>;
  }

  const topChangedSuppliers = (optimizationData.supplier_changes || []).slice(0, 6);

  return (
    <div className="bg-white rounded-xl p-4 shadow border border-slate-100 space-y-3">
      <h4 className="font-medium">Scenario Details</h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-slate-50">
          <div className="text-xs text-slate-500">Baseline emissions</div>
          <div className="font-medium">{optimizationData.baseline_emissions}</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50">
          <div className="text-xs text-slate-500">Optimized emissions</div>
          <div className="font-medium">{optimizationData.optimized_emissions}</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50">
          <div className="text-xs text-slate-500">Emission reduction</div>
          <div className="font-medium">{Math.round(optimizationData.emission_reduction_pct || optimizationData.emission_reduction || 0)}%</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50">
          <div className="text-xs text-slate-500">Cost change</div>
          <div className="font-medium">{Math.round(optimizationData.cost_change_pct || 0)}%</div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Top supplier allocations changed</div>
        {topChangedSuppliers.length === 0 ? (
          <div className="text-xs text-slate-500">No supplier changes reported by optimizer.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {topChangedSuppliers.map((s, i) => (
              <li key={i} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{s.name || s.supplier_id}</div>
                  <div className="text-xs text-slate-500">{s.note || ''}</div>
                </div>
                <div className="text-xs text-slate-600">{s.emission_impact || s.change_pct ? `${s.change_pct || ''}%` : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SupplierHotspotsTable({ suppliers }) {
  const topSuppliers = [...suppliers]
    .sort((a, b) => safeParseNumber(b.emissions) - safeParseNumber(a.emissions))
    .slice(0, 4);

  return (
    <div className="col-span-2 bg-white rounded-xl p-4 shadow border border-slate-100">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        Top Emission Hotspots
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-left bg-slate-50">
            <tr>
              <th className="p-2 rounded-tl-lg">Supplier</th>
              <th className="p-2">Country</th>
              <th className="p-2">Emissions (kg)</th>
              <th className="p-2">Risk</th>
              <th className="p-2 rounded-tr-lg">Renewable %</th>
            </tr>
          </thead>
          <tbody>
            {topSuppliers.map((s, index) => (
              <tr key={s.id || `supplier-${index}`} className="border-t border-slate-100 hover:bg-slate-50 transition">
                <td className="p-2 font-medium">{s.name || 'Unknown Supplier'}</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{s.country || 'Unknown'}</span>
                </td>
                <td className="p-2">{safeParseNumber(s.emissions).toLocaleString()}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(safeParseNumber(s.risk, 50))}`}>
                    {safeParseNumber(s.risk, 50)}%
                  </span>
                </td>
                <td className="p-2">{safeParseNumber(s.renewable_pct, 0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Showing top {Math.min(4, suppliers.length)} of {suppliers.length} suppliers by emissions
      </div>
    </div>
  );
}

function ScenarioPlanner({ scenario, setScenario, runOptimization, supplierData = [], forecastData = [] }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [saving, setSaving] = useState(false);

  // Simple client-side heuristic estimator for immediate feedback
  const estimateImpact = (sc) => {
    // baseline: use forecastData average (if available) or sum of supplier emissions
    const baselineFromForecast = forecastData.length ? forecastData.reduce((s, d) => s + safeParseNumber(d.emissions), 0) / Math.max(1, forecastData.length) : null;
    const baselineFromSuppliers = supplierData.length ? supplierData.reduce((s, sup) => s + safeParseNumber(sup.emissions), 0) : null;

    const baselineEmissions = baselineFromForecast !== null ? Math.round(baselineFromForecast) : Math.round(baselineFromSuppliers || 100000);

    // Heuristic: modal shift mostly reduces logistics emissions; renewables reduce operations emissions.
    // We combine them into an approximate overall reduction fraction.
    const modalEffectiveness = 0.35; // each 1% modal shift reduces total emissions by ~0.35% (example heuristic)
    const renewableEffectiveness = 0.38; // each 1% renewable increase reduces total emissions by ~0.38%

    const emissionReductionPct = Math.round(
      (safeParseNumber(sc.modalShiftPct, 0) * modalEffectiveness) +
      (safeParseNumber(sc.renewableIncreasePct, 0) * renewableEffectiveness)
    );

    // Cost change heuristic: modal shift may *increase* cost slightly, renewables may increase cost somewhat.
    const costIncreasePerModalPct = 0.018; // 1% modal shift -> 0.018% cost increase
    const costIncreasePerRenewPct = 0.03; // 1% renew -> 0.03% cost increase (sourcing premium)
    const costChangePct = Number((safeParseNumber(sc.modalShiftPct, 0) * costIncreasePerModalPct + safeParseNumber(sc.renewableIncreasePct, 0) * costIncreasePerRenewPct).toFixed(2));

    const optimizedEmissions = Math.round(baselineEmissions * Math.max(0, (1 - emissionReductionPct / 100)));

    return {
      baselineEmissions,
      emissionReductionPct,
      optimizedEmissions,
      costChangePct
    };
  };

  // Update estimate whenever scenario changes
  useEffect(() => {
    setEstimate(estimateImpact(scenario));
  }, [scenario, supplierData, forecastData]);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      // keep API shape the same as before
      await runOptimization({
        modal_shift_pct: scenario.modalShiftPct,
        renewable_increase_pct: scenario.renewableIncreasePct
      });
    } catch (e) {
      console.error('Simulation call failed', e);
      alert('Simulation failed. Check backend console.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: scenario.name || `Scenario ${new Date().toLocaleString()}`,
      description: scenario.description || `Smart scenario — modal ${scenario.modalShiftPct}%, renew ${scenario.renewableIncreasePct}%`,
      modal_shift_pct: scenario.modalShiftPct,
      renewable_increase_pct: scenario.renewableIncreasePct,
      created_at: new Date().toISOString()
    };

    try {
      const res = await apiService.saveScenario(payload);
      if (res.success) {
        alert('Scenario saved to playbook.');
      } else {
        alert('Failed to save scenario.');
      }
    } catch (e) {
      console.error('Save scenario error', e);
      alert('Error saving scenario.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    setSelectedPreset(preset.name);
    setScenario(prev => ({
      ...prev,
      modalShiftPct: preset.modalShiftPct,
      renewableIncreasePct: preset.renewableIncreasePct
    }));
  };

  const PRESETS = [
    { name: 'Conservative', modalShiftPct: 15, renewableIncreasePct: 10 },
    { name: 'Balanced', modalShiftPct: 30, renewableIncreasePct: 40 },
    { name: 'Aggressive Green', modalShiftPct: 50, renewableIncreasePct: 70 }
  ];

  return (
  <div className="bg-white rounded-xl p-4 shadow border border-slate-100 space-y-6">

    {/* Header & Save */}
    <div className="flex items-center justify-between">
      <h3 className="font-semibold flex items-center gap-2">
        Scenario Planner 
      </h3>
    </div>

    {/* Presets */}
    <div className="flex gap-2 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p.name}
          onClick={() => applyPreset(p)}
          className={`px-3 py-1 rounded-lg text-sm ${
            selectedPreset === p.name
              ? 'bg-teal-600 text-white'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {p.name}
        </button>
      ))}
      <button
        onClick={() => {
          setSelectedPreset(null);
          setScenario(prev => ({ ...prev, modalShiftPct: 0, renewableIncreasePct: 0 }));
        }}
        className="px-3 py-1 rounded-lg text-sm bg-slate-50 text-slate-700 hover:bg-slate-100"
      >
        Reset
      </button>
    </div>

    {/* Gauge */}
    <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center border border-slate-100">
      <Gauge
        emissionReductionPct={estimate?.emissionReductionPct || 0}
        costChangePct={estimate?.costChangePct || 0}
      />
      <div className="text-xs text-slate-500 mt-2 text-center">Estimated immediate impact</div>
    </div>

    {/* Impact Preview */}
    <div className="bg-slate-50 rounded-lg p-4">
      <ImpactPreview estimate={estimate} />
    </div>
  </div>
);
}

function ImpactPreview({ estimate }) {
  if (!estimate) {
    return <div className="text-sm text-slate-500">Adjust sliders to see an instant estimate of emissions & cost impact.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Baseline emissions (est.)</div>
          <div className="text-lg font-medium">{estimate.baselineEmissions.toLocaleString()} kg</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Optimized emissions (est.)</div>
          <div className="text-lg font-medium text-emerald-700">{estimate.optimizedEmissions.toLocaleString()} kg</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Emission reduction</div>
          <div className="text-lg font-medium">{estimate.emissionReductionPct}%</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Cost change (est.)</div>
          <div className="text-lg font-medium">{estimate.costChangePct}%</div>
        </div>
      </div>
    </div>
  );
}

function Gauge({ emissionReductionPct = 0, costChangePct = 0 }) {
  // Simple circular gauge. emissionReductionPct shown as green arc; costChangePct shown as orange small inner arc.
  const size = 100;
  const stroke = 10;
  const center = size / 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const emissionOffset = circumference * (1 - Math.min(1, emissionReductionPct / 100));
  const costOffset = circumference * (1 - Math.min(1, Math.min(10, costChangePct) / 10)); // scale cost to 0..10% visible

  return (
    <svg width={size} height={size} className="block">
      {/* background circle */}
      <circle cx={center} cy={center} r={radius} stroke="#eef2f7" strokeWidth={stroke} fill="none" />
      {/* emission arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#10b981"
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={emissionOffset}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${center} ${center})`}
      />
      {/* inner cost arc (smaller radius) */}
      <circle cx={center} cy={center} r={radius - 16} stroke="#f59e0b" strokeWidth={6}
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={costOffset}
        strokeLinecap="round" fill="none" transform={`rotate(-90 ${center} ${center})`} />
      {/* center labels */}
      <text x={center} y={center - 4} textAnchor="middle" fontSize="16" fontWeight="600" fill="#0f172a">{emissionReductionPct}%</text>
      <text x={center} y={center + 14} textAnchor="middle" fontSize="10" fill="#64748b">emissions</text>
    </svg>
  );
}

function Dashboard({ forecastData, supplierData, pieData, scenario, setScenario, runOptimization }) {
  const totalEmissions = forecastData.reduce((sum, d) => sum + d.emissions, 0);
  const avgEmissions = forecastData.length > 0 ? Math.round(totalEmissions / forecastData.length) : 0;
  const highRiskSuppliers = supplierData.filter(s => s.risk >= 70).length;
  const uniqueCountries = new Set(supplierData.map(s => s.country)).size;

  return (
    <div className="space-y-6">
      <MetricsCards 
        avgEmissions={avgEmissions}
        highRiskSuppliers={highRiskSuppliers}
        supplierData={supplierData}
        uniqueCountries={uniqueCountries}
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ForecastChart data={forecastData} />
        <SourceBreakdownChart data={pieData} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SupplierHotspotsTable suppliers={supplierData} />
        <ScenarioPlanner 
          scenario={scenario}
          setScenario={setScenario}
          runOptimization={runOptimization}
          supplierData={supplierData}
          forecastData={forecastData}
        />
      </section>
    </div>
  )
}

const MODULES_DATA = [
  { 
    id: 1, 
    icon: '📥',
    title: 'Data Integration & Preprocessing', 
    desc: 'Ingest operational, logistics, supplier ESG and regulatory data with ETL, validation, and storage.',
    tech: 'Pandas, Data Quality Validators'
  },
  { 
    id: 2, 
    icon: '📈',
    title: 'Emission Forecasting Engine', 
    desc: 'MindSpore-optimized LSTM-Attention time-series model for multi-horizon forecasts with uncertainty quantification.',
    tech: 'MindSpore LSTM, Probabilistic Modeling'
  },
  { 
    id: 3, 
    icon: '📜',
    title: 'Regulatory NLP Engine', 
    desc: 'Transformer-based NER and relation extraction for automated compliance requirements analysis.',
    tech: 'BERT, Named Entity Recognition'
  },
  { 
    id: 4, 
    icon: '⚠️',
    title: 'Supplier Risk Scoring', 
    desc: 'Composite risk model using environmental (40%), compliance (30%), operational (20%), and reputational (10%) signals.',
    tech: 'MindSpore Dense Networks'
  },
  { 
    id: 5, 
    icon: '⚡',
    title: 'Optimization & Scenario Planning', 
    desc: 'Multi-objective optimizer for cost-emission trade-offs with Pareto front generation and scenario evaluation.',
    tech: 'Genetic Algorithms, Multi-Objective Optimization'
  },
  { 
    id: 6, 
    icon: '📄',
    title: 'Reporting & Compliance', 
    desc: 'Template-based report generation for CSRD, GRI, TCFD, CDP and SEC Climate Rules with automated validation.',
    tech: 'Document Generation, API Integration'
  }
];

function ModulesExplorer() {
  return (
    <div className="space-y-4">
      <ModulesHeader />
      <ModulesGrid modules={MODULES_DATA} />
    </div>
  )
}

function ModulesHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">SSCA Technical Modules</h2>
      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
        Powered by MindSpore 2.7.1
      </span>
    </div>
  )
}

function ModulesGrid({ modules }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </div>
  )
}

function ModuleCard({ module }) {
  return (
    <article className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-slate-900">{module.title}</h3>
        <span className="text-xl">{module.icon}</span>
      </div>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{module.desc}</p>
      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          <span className="font-medium">Tech Stack:</span> {module.tech}
        </div>
      </div>
    </article>
  )
}

function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    emissions: '',
    risk: '',
    renewable_pct: '',
    tier: 'Tier-1',
    category: 'Manufacturing',
    status: 'Active'
  });
  
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    loadSuppliers();
  }, []);
  
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSuppliers();
      if (response.success) {
        setSuppliers(response.suppliers || []);
      }
      
      const analyticsResponse = await apiService.getSupplierAnalytics();
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.analytics);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.addSupplier(formData);
      if (response.success) {
        await loadSuppliers();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };
  
  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.updateSupplier(editingSupplier.id, formData);
      if (response.success) {
        await loadSuppliers();
        setShowAddModal(false);
        setEditingSupplier(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
    }
  };
  
  const handleDeleteSupplier = async (supplierId) => {
    try {
      const response = await apiService.deleteSupplier(supplierId);
      if (response.success) {
        await loadSuppliers();
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileUploading(true);
    try {
      const response = await apiService.uploadSupplierFile(file, file.name.split('.').pop());
      if (response.success) {
        await loadSuppliers();
        setShowUploadModal(false);
        alert(`Successfully uploaded ${response.uploaded_count} suppliers`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please check the file format.');
    } finally {
      setFileUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      country: supplier.country || '',
      emissions: supplier.emissions || '',
      risk: supplier.risk || '',
      renewable_pct: supplier.renewable_pct || '',
      tier: supplier.tier || 'Tier-1',
      category: supplier.category || 'Manufacturing',
      status: supplier.status || 'Active'
    });
    setShowAddModal(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      emissions: '',
      risk: '',
      renewable_pct: '',
      tier: 'Tier-1',
      category: 'Manufacturing',
      status: 'Active'
    });
    setEditingSupplier(null);
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleBulkSelect = (supplierId) => {
    setBulkSelected(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };
  
  const handleBulkSelectAll = () => {
    if (bulkSelected.length === filteredSuppliers.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredSuppliers.map(s => s.id));
    }
  };
  
  const handleBulkDelete = () => {
    if (bulkSelected.length === 0) return;
    
    bulkSelected.forEach(async (id) => {
        await apiService.deleteSupplier(id);
      });
      setBulkSelected([]);
      setTimeout(() => loadSuppliers(), 1000);
  };
  
  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = 
        supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || supplier.category === selectedCategory;
      const matchesTier = selectedTier === 'All' || supplier.tier === selectedTier;
      
      return matchesSearch && matchesCategory && matchesTier;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  
  const categories = ['All', ...new Set(suppliers.map(s => s.category).filter(Boolean))];
  const tiers = ['All', ...new Set(suppliers.map(s => s.tier).filter(Boolean))];
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Supplier Management</h2>
          <p className="text-sm text-slate-600">Manage your supplier database, upload files, and track performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Upload size={16} />
            Upload File
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
          >
            + Add Supplier
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'list' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Supplier List ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'analytics' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Analytics Dashboard
        </button>
      </div>
      
      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <SupplierAnalytics analytics={analytics} />
      )}
      
      {/* Supplier List Tab */}
      {activeTab === 'list' && (
        <>
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-slate-600 block mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search suppliers..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 block mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 block mb-1">Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                >
                  {tiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600 block mb-1">Sort By</label>
                <select
                  value={sortField}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="name">Name</option>
                  <option value="emissions">Emissions</option>
                  <option value="risk">Risk</option>
                  <option value="renewable_pct">Renewable %</option>
                  <option value="country">Country</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {bulkSelected.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {bulkSelected.length} supplier(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setBulkSelected([])}
                  className="px-3 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          
          {/* Suppliers Table */}
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={bulkSelected.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                        onChange={handleBulkSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left font-medium">Supplier</th>
                    <th className="p-3 text-left font-medium">Country</th>
                    <th className="p-3 text-left font-medium">Category</th>
                    <th className="p-3 text-left font-medium">Tier</th>
                    <th className="p-3 text-left font-medium">Emissions (kg)</th>
                    <th className="p-3 text-left font-medium">Risk</th>
                    <th className="p-3 text-left font-medium">Renewable %</th>
                    <th className="p-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr 
                      key={supplier.id} 
                      className="border-t border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={bulkSelected.includes(supplier.id)}
                          onChange={() => handleBulkSelect(supplier.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 font-medium">{supplier.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                          {supplier.country}
                        </span>
                      </td>
                      <td className="p-3">{supplier.category}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${getTierColor(supplier.tier)}`}>
                          {supplier.tier}
                        </span>
                      </td>
                      <td className="p-3">{supplier.emissions?.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${getRiskColor(supplier.risk)}`}>
                          {supplier.risk}%
                        </span>
                      </td>
                      <td className="p-3">{supplier.renewable_pct}%</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          supplier.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredSuppliers.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No suppliers found. Try adjusting your filters or add a new supplier.
              </div>
            )}
            
            <div className="p-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
              <span>Showing {filteredSuppliers.length} of {suppliers.length} suppliers</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">
                  ← Previous
                </button>
                <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Add/Edit Supplier Modal */}
      {showAddModal && (
        <SupplierModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingSupplier(null);
            resetForm();
          }}
          onSubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier}
          formData={formData}
          setFormData={setFormData}
          isEditing={!!editingSupplier}
          title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        />
      )}
      
      {/* File Upload Modal */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFileSelect={handleFileUpload}
          fileInputRef={fileInputRef}
          uploading={fileUploading}
        />
      )}
    </div>
  );
}

function SupplierAnalytics({ analytics }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
          <div className="text-sm text-slate-600">Total Suppliers</div>
          <div className="text-2xl font-bold text-slate-900">{analytics.total_suppliers}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
          <div className="text-sm text-slate-600">Total Emissions</div>
          <div className="text-2xl font-bold text-slate-900">
            {analytics.total_emissions.toLocaleString()} kg
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
          <div className="text-sm text-slate-600">Avg Risk</div>
          <div className="text-2xl font-bold text-slate-900">{analytics.avg_risk}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-slate-200">
          <div className="text-sm text-slate-600">Avg Renewable</div>
          <div className="text-2xl font-bold text-slate-900">{analytics.avg_renewable}%</div>
        </div>
      </div>
      
      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <h3 className="font-medium mb-4">Supplier Tier Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analytics.tier_distribution).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{tier}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getTierColor(tier)}`}
                      style={{ 
                        width: `${(count / analytics.total_suppliers) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
          <h3 className="font-medium mb-4">Risk Distribution</h3>
          <div className="space-y-2">
            {Object.entries(analytics.risk_distribution).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-sm text-slate-700 capitalize">{level} Risk</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getRiskColor(level)}`}
                      style={{ 
                        width: `${(count / analytics.total_suppliers) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Emitters */}
      <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <h3 className="font-medium mb-4">Top 5 Emitters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-2 text-left">Supplier</th>
                <th className="p-2 text-left">Country</th>
                <th className="p-2 text-left">Emissions (kg)</th>
                <th className="p-2 text-left">Risk</th>
                <th className="p-2 text-left">Renewable %</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_emitters.map((supplier) => (
                <tr key={supplier.id} className="border-t border-slate-100">
                  <td className="p-2 font-medium">{supplier.name}</td>
                  <td className="p-2">{supplier.country}</td>
                  <td className="p-2 font-bold">{supplier.emissions?.toLocaleString()}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getRiskColor(supplier.risk)}`}>
                      {supplier.risk}%
                    </span>
                  </td>
                  <td className="p-2">{supplier.renewable_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SupplierModal({ isOpen, onClose, onSubmit, formData, setFormData, isEditing, title }) {
  if (!isOpen) return null;
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="CN">China</option>
                  <option value="ID">Indonesia</option>
                  <option value="VN">Vietnam</option>
                  <option value="US">United States</option>
                  <option value="DE">Germany</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Energy">Energy</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Agriculture">Agriculture</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tier
                </label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                >
                  <option value="Tier-1">Tier-1</option>
                  <option value="Tier-2">Tier-2</option>
                  <option value="Tier-3">Tier-3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Emissions (kg) *
                </label>
                <input
                  type="number"
                  name="emissions"
                  value={formData.emissions}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Risk Score (0-100) *
                </label>
                <input
                  type="number"
                  name="risk"
                  value={formData.risk}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  required
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Renewable Energy %
                </label>
                <input
                  type="number"
                  name="renewable_pct"
                  value={formData.renewable_pct}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 rounded-lg"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="High Risk">High Risk</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                {isEditing ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FileUploadModal({ isOpen, onClose, onFileSelect, fileInputRef, uploading }) {
  if (!isOpen) return null;
  
  const supportedFormats = [
    { format: 'CSV', description: 'Comma-separated values', icon: '📄' },
    { format: 'Excel', description: '.xlsx or .xls format', icon: '📊' },
    { format: 'Spreadsheet', description: 'Google Sheets export', icon: '📈' }
  ];
  
  const sampleCSV = `Name,Country,Category,Tier,Emissions,Risk,Renewable_Pct,Status
Alpha Steel,CN,Manufacturing,Tier-1,125450,88,15,Active
Beta Logistics,ID,Logistics,Tier-1,52400,72,25,Active
Gamma Parts,VN,Manufacturing,Tier-2,35600,45,40,Active`;
  
  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Upload Supplier File</h3>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Supported Formats */}
            <div>
              <h4 className="font-medium text-slate-700 mb-3">Supported Formats</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {supportedFormats.map((format) => (
                  <div key={format.format} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="text-2xl mb-2">{format.icon}</div>
                    <div className="font-medium">{format.format}</div>
                    <div className="text-sm text-slate-500">{format.description}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelect}
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="supplier-file-upload"
              />
              
              <label
                htmlFor="supplier-file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <Upload size={24} className="text-teal-600" />
                </div>
                
                <div>
                  <div className="font-medium text-slate-900">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    CSV, XLSX up to 10MB
                  </div>
                </div>
                
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Select File
                </button>
              </label>
            </div>
            
            {/* CSV Template */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="text-blue-600">💡</div>
                <div>
                  <div className="font-medium text-blue-900">Need a template?</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Download our CSV template with the required columns and format.
                  </div>
                  <button
                    onClick={downloadSampleCSV}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download CSV Template
                  </button>
                </div>
              </div>
            </div>
            
            {/* Required Columns */}
            <div>
              <h4 className="font-medium text-slate-700 mb-2">Required Columns</h4>
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <code className="text-slate-700">
                  Name, Country, Category, Tier, Emissions, Risk, Renewable_Pct, Status
                </code>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTierColor(tier) {
  const colors = {
    'Tier-1': 'bg-purple-100 text-purple-700',
    'Tier-2': 'bg-blue-100 text-blue-700',
    'Tier-3': 'bg-slate-100 text-slate-700',
    'Tier-4': 'bg-gray-100 text-gray-700',
  };
  return colors[tier] || 'bg-gray-100 text-gray-700';
}

function SuppliersTableHeader() {
  const headers = ['ID', 'Supplier', 'Tier', 'Country', 'Emissions (kg)', 'Risk Score', 'Renewable %'];
  
  return (
    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
      <tr>
        {headers.map((header) => (
          <th key={header} className="p-3 text-left font-medium">{header}</th>
        ))}
      </tr>
    </thead>
  )
}

function SupplierRow({ supplier }) {
  const emissions = supplier.emissions || supplier.total_emissions_kg;
  const renewable = supplier.renewable_pct || supplier.renewable_energy_pct || 0;
  
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition">
      <td className="p-3 text-slate-500 font-mono text-xs">{supplier.id}</td>
      <td className="p-3 font-medium">{supplier.name || supplier.supplier_name}</td>
      <td className="p-3">
        <TierBadge tier={supplier.tier} />
      </td>
      <td className="p-3">{supplier.country}</td>
      <td className="p-3">{emissions?.toLocaleString() || 'N/A'}</td>
      <td className="p-3">
        <RiskBadge risk={supplier.risk} />
      </td>
      <td className="p-3">{renewable}%</td>
    </tr>
  )
}

function TierBadge({ tier }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${COLORS.tier[tier] || 'bg-slate-100 text-slate-700'}`}>
      {tier}
    </span>
  )
}

function RiskBadge({ risk }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(risk)}`}>
      {risk}%
    </span>
  )
}

function Optimization({ scenario, setScenario, optimizationData, runOptimization }) {
  return (
  <div className="grid grid-cols-12 gap-6">

    {/* LEFT: Scenario explorer / playbook */}
    <div className="col-span-12 lg:col-span-3">
      <ScenarioPlaybookSidebar
        onLoadScenario={(loaded) => {
          setScenario({
            modalShiftPct: loaded.modal_shift_pct,
            renewableIncreasePct: loaded.renewable_increase_pct,
            modalShiftTarget: loaded.modal_shift_pct,
            renewableTarget: loaded.renewable_increase_pct,
            name: loaded.name,
            description: loaded.description
          });
          runOptimization({
            modal_shift_pct: loaded.modal_shift_pct,
            renewable_increase_pct: loaded.renewable_increase_pct
          });
        }}
      />
    </div>

    {/* RIGHT: Controls + charts */}
    <div className="col-span-12 lg:col-span-9 space-y-6">

      <ScenarioControls
        scenario={scenario}
        setScenario={setScenario}
        onSimulate={async (partial) => {
          const full = {
            modal_shift_pct: partial.modalShiftPct ?? scenario.modalShiftPct,
            renewable_increase_pct: partial.renewableIncreasePct ?? scenario.renewableIncreasePct
          };
          await runOptimization(full);
        }}
        optimizationData={optimizationData}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <ParetoChart 
            paretoSolutions={optimizationData?.pareto_solutions} 
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <ScenarioDetailsPanel 
            optimizationData={optimizationData} 
          />
        </div>
      </div>

    </div>

  </div>
);
}

function OptimizationHeader() {
  return (
    <h2 className="text-lg font-semibold flex items-center gap-2">
      <span>⚡</span>
      Optimization & Scenario Planning
    </h2>
  )
}

function OptimizationChart({ scenario, optimizationData }) {
  const chartData = prepareOptimizationData(scenario, optimizationData);
  
  return (
    <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
      <h3 className="font-medium mb-3">Cost vs Emissions Trade-off</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="emissions" name="Emissions (Indexed)" fill="#ef4444" />
            <Bar dataKey="cost" name="Cost (Indexed)" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {optimizationData && (
        <OptimizationMetrics data={optimizationData} />
      )}

      <div className="mt-4 text-sm text-slate-600">
        <strong>Scenario:</strong> Modal shift {scenario.modalShiftPct}%, Renewable +{scenario.renewableIncreasePct}%
      </div>
    </div>
  )
}

function prepareOptimizationData(scenario, optimizationData) {
  if (optimizationData) {
    return [
      { name: 'Baseline', emissions: 100, cost: 100 },
      { 
        name: `Modal Shift ${scenario.modalShiftPct}%`, 
        emissions: Math.round(100 - (optimizationData.emission_reduction_pct || 0)), 
        cost: Math.round(100 + (optimizationData.cost_change_pct || 0))
      },
      { 
        name: `Renewables +${scenario.renewableIncreasePct}%`, 
        emissions: Math.round(optimizationData.optimized_emissions / optimizationData.baseline_emissions * 100),
        cost: Math.round(optimizationData.optimized_cost / 500000 * 100)
      }
    ];
  }
  
  return [
    { name: 'Baseline', emissions: 100, cost: 100 },
    { name: 'ModalShift 30%', emissions: 82, cost: 104 },
    { name: 'Renewables +50%', emissions: 70, cost: 107 }
  ];
}

function OptimizationMetrics({ data }) {
  const metrics = [
    {
      label: 'Emission Reduction',
      value: `${data.emission_reduction_pct}%`,
      gradient: 'bg-green-50',
      border: 'border-green-200',
      textColor: 'text-green-600',
      valueColor: 'text-green-900'
    },
    {
      label: 'Cost Impact',
      value: `+${data.cost_change_pct}%`,
      gradient: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-blue-600',
      valueColor: 'text-blue-900'
    },
    {
      label: 'Optimized Emissions',
      value: `${Math.round(data.optimized_emissions).toLocaleString()} kg`,
      gradient: 'bg-purple-50',
      border: 'border-purple-200',
      textColor: 'text-purple-600',
      valueColor: 'text-purple-900'
    }
  ];

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      {metrics.map((metric, idx) => (
        <div key={idx} className={`p-3 ${metric.gradient} rounded-lg border ${metric.border}`}>
          <div className={`text-xs ${metric.textColor} font-medium`}>{metric.label}</div>
          <div className={`text-xl font-bold ${metric.valueColor} mt-1`}>{metric.value}</div>
        </div>
      ))}
    </div>
  )
}

function Reporting() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
  {
    id: `initial-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
    role: 'assistant',
    content: 'Hello! I\'m your Reporting Assistant. I can help you generate PDF reports, export data to Excel, create DOCX documents, and analyze uploaded files. How can I assist you today?',
    timestamp: new Date().toISOString(),
    type: 'text'
  }
]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([
  {
    id: `template-1-${Math.random().toString(36).substr(2, 9)}`,
    name: 'CSRD Compliance Report',
    description: 'EU Corporate Sustainability Reporting Directive compliant report',
    icon: '🇪🇺',
    format: 'PDF',
    lastUsed: '2024-01-15'
  },
  {
    id: `template-2-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Supplier Emissions Dashboard',
    description: 'Comprehensive supplier emissions and risk analysis',
    icon: '📊',
    format: 'Excel',
    lastUsed: '2024-01-10'
  },
  {
    id: `template-3-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Sustainability Performance',
    description: 'Annual sustainability performance with Scope 1,2,3 breakdown',
    icon: '🌱',
    format: 'PDF',
    lastUsed: '2024-01-05'
  },
  {
    id: `template-4-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Regulatory Compliance',
    description: 'Multi-jurisdiction compliance status report',
    icon: '⚖️',
    format: 'DOCX',
    lastUsed: '2024-01-12'
  }
]);
  
  const fileInputRef = useRef(null);
  
  const addMessage = (role, content, type = 'text', metadata = {}) => {
  // Use a combination of timestamp, random number, and counter for unique keys
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${messages.length}`;
  const newMessage = {
    id: uniqueId,
    role,
    content,
    timestamp: new Date().toISOString(),
    type,
    metadata
  };
  setMessages(prev => [...prev, newMessage]);
  return newMessage;
};
  
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = addMessage('user', inputText, 'text');
    setInputText('');
    
    // Show typing indicator
    const typingMessage = addMessage('assistant', 'Thinking...', 'typing');
    
    setIsLoading(true);
    
    try {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
      
      const response = await apiService.chatWithReportingAssistant(userMessage.content);
      
      if (response.success) {
        addMessage('assistant', response.answer, 'text', {
          action: response.action,
          parameters: response.parameters,
          confidence: response.confidence
        });
        
        // If response suggests a report generation action
        if (response.action && response.action.includes('generate')) {
          // Auto-suggest generation
          setTimeout(() => {
            handleGenerateAction(response.action);
          }, 1000);
        }
      } else {
        addMessage('assistant', 'Sorry, I encountered an error. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
      addMessage('assistant', 'I\'m having trouble connecting to the server. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateAction = async (actionType, parameters = {}) => {
  let reportType = 'pdf';
  let reportParams = parameters;
  
  if (actionType.includes('pdf')) {
    reportType = 'pdf';
    reportParams = { ...reportParams, framework: 'CSRD', period: '2024' };
  } else if (actionType.includes('excel')) {
    reportType = 'xlsx';
    reportParams = { ...reportParams, data_type: 'supplier_emissions' };
  } else if (actionType.includes('docx')) {
    reportType = 'docx';
    reportParams = { ...reportParams, framework: 'GRI', period: 'Q4 2024' };
  }
  
  setIsLoading(true);
  
  try {
    const response = await apiService.generateReport(reportType, reportParams);
    
    if (response.success) {
      // Create a unique ID for the report message
      const reportMessageId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const reportMessage = addMessage('assistant', 
        `✅ I've started generating your ${reportType.toUpperCase()} report.\n\n` +
        `**Report ID:** ${response.report_id}\n` +
        `**Format:** ${reportType.toUpperCase()}\n` +
        `**Estimated time:** ${response.estimated_time_seconds} seconds\n` +
        `**Size:** ${response.file_info?.size_mb || '2.5'} MB\n\n` +
        `I'll notify you when it's ready to download.`,
        'report_generation',
        { 
          report_details: response,
          report_type: reportType,
          can_download: false
        }
      );
      
      // Store the message ID to update it later
      const messageIdToUpdate = reportMessage.id;
      
      // Simulate report generation completion
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageIdToUpdate 
            ? { 
                ...msg, 
                content: `✅ Your ${reportType.toUpperCase()} report is ready!\n\n` +
                        `**Report ID:** ${response.report_id}\n` +
                        `**Format:** ${reportType.toUpperCase()}\n` +
                        `**Size:** ${response.file_info?.size_mb || '2.5'} MB\n` +
                        `**Generated:** ${new Date().toLocaleTimeString()}\n\n` +
                        `Click the download button below to save it to your device.`,
                metadata: { 
                  ...msg.metadata, 
                  can_download: true,
                  download_url: response.download_url
                }
              }
            : msg
        ));
      }, (response.estimated_time_seconds || 15) * 1000);
      
      // Update templates with recent usage
      setReportTemplates(prev => 
        prev.map(template => 
          template.format.toLowerCase() === reportType 
            ? { ...template, lastUsed: new Date().toISOString().split('T')[0] }
            : template
        )
      );
    }
  } catch (error) {
    addMessage('assistant', 'Failed to generate report. Please try again.', 'error');
  } finally {
    setIsLoading(false);
  }
};
  
  const handleDownloadReport = async (reportId, reportType) => {
    try {
      addMessage('user', `Download report: ${reportId}`, 'download_request');
      
      const typingMessage = addMessage('assistant', 'Preparing download...', 'typing');
      
      await apiService.downloadReport(reportId, reportType);
      
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
      
      addMessage('assistant', 
        `📥 Download completed!\n\n` +
        `Your report "${reportId}" has been downloaded.\n` +
        `You can find it in your downloads folder.`,
        'download_complete'
      );
      
    } catch (error) {
      addMessage('assistant', 'Failed to download the report. Please try again.', 'error');
    }
  };
  
  const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);
  
  files.forEach((file, index) => {
    const uniqueFileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const fileContent = event.target.result;
      const fileInfo = {
        id: uniqueFileId, 
        name: file.name,
        type: file.type,
        size: file.size,
        content: fileContent.substring(0, 500) + '...',
        uploadedAt: new Date().toISOString()
      };
      
      setUploadedFiles(prev => [...prev, fileInfo]);
      
      analyzeUploadedFile(fileInfo);
    };
    
    if (file.type.includes('text') || file.type.includes('pdf')) {
      reader.readAsText(file);
    } else {
      // For binary files, just show the file info
      const fileInfo = {
        id: uniqueFileId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      setUploadedFiles(prev => [...prev, fileInfo]);
      analyzeUploadedFile(fileInfo);
    }
  });

  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
  
  const analyzeUploadedFile = async (fileInfo) => {
  // Use the fileInfo's unique ID
  addMessage('user', `Uploaded file: ${fileInfo.name}`, 'file_upload', { fileInfo });
  
  const typingMessage = addMessage('assistant', 'Analyzing uploaded file...', 'typing');
  
  try {
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
      
      const analysis = generateFileAnalysis(fileInfo);
      addMessage('assistant', analysis, 'file_analysis', { fileInfo });
    }, 2000);
  } catch (error) {
    setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id));
    addMessage('assistant', 'Failed to analyze the uploaded file.', 'error');
  }
};
  
  const generateFileAnalysis = (fileInfo) => {
    const fileTypes = {
      'pdf': 'PDF document',
      'docx': 'Word document',
      'xlsx': 'Excel spreadsheet',
      'csv': 'CSV data file',
      'txt': 'Text file'
    };
    
    const type = Object.entries(fileTypes).find(([key]) => 
      fileInfo.type.includes(key) || fileInfo.name.toLowerCase().includes(key)
    )?.[1] || 'document';
    
    const analyses = [
      `I've analyzed the ${type} "${fileInfo.name}". It appears to contain sustainability data that can be used for reporting.`,
      `The uploaded ${type} "${fileInfo.name}" contains supplier emissions data that can be integrated into reports.`,
      `I found regulatory compliance information in "${fileInfo.name}". This data can be used for compliance reporting.`,
      `The ${type} "${fileInfo.name}" includes Scope 1, 2, and 3 emissions data that can be visualized in reports.`
    ];
    
    const actions = [
      'I can extract this data and include it in a PDF report.',
      'This data can be combined with existing supplier information for a comprehensive report.',
      'Shall I generate a report using this data along with our existing analytics?',
      'I can create a comparison report between this data and our previous year\'s metrics.'
    ];
    
    return `${analyses[Math.floor(Math.random() * analyses.length)]}\n\n${actions[Math.floor(Math.random() * actions.length)]}`;
  };
  
  const quickPrompts = [
    "Generate a PDF sustainability report for 2024",
    "Export supplier emissions data to Excel",
    "Create a compliance report for EU regulations",
    "Analyze uploaded ESG data and generate insights",
    "Compare this year's emissions with last year"
  ];
  
  const handleQuickPrompt = (prompt) => {
    setInputText(prompt);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="space-y-6">
      <ReportingHeader />
      
      {/* TAB NAVIGATION - ADD THIS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'chat' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          AI Assistant
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'templates' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Report Templates
        </button>
      </div>
      
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-white">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Reporting Assistant</h3>
                <p className="text-xs text-slate-500">Powered by MindSpore AI • Real-time data integration</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} handleDownloadReport={handleDownloadReport} />
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Prompts */}
          <div className="px-4 pt-2 pb-2 border-t border-slate-200 bg-white">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition whitespace-nowrap disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me to generate reports, analyze data, or upload files..."
                  className="w-full p-3 pr-10 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  rows="1"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    multiple
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                    title="Upload file"
                  >
                    <Upload size={18} />
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="bg-gradient-to-r from-teal-500 to-green-500 text-white px-5 py-3 rounded-xl font-medium hover:from-teal-600 hover:to-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-2 text-xs text-slate-500 flex justify-between">
              <span>Press Enter to send • Shift+Enter for new line</span>
              <span>{messages.length} messages</span>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'templates' && (
        <ReportTemplates 
          templates={reportTemplates} 
          onUseTemplate={(template) => {
            setActiveTab('chat');
            setInputText(`Generate a ${template.format} report for ${template.name}`);
            setTimeout(() => handleSendMessage(), 100);
          }}
        />
      )}
      
      {activeTab === 'files' && (
        <UploadedFilesList 
          files={uploadedFiles} 
          onAnalyzeFile={(file) => {
            setActiveTab('chat');
            setInputText(`Analyze the uploaded file: ${file.name}`);
            setTimeout(() => handleSendMessage(), 100);
          }}
        />
      )}
      
      {activeTab === 'downloads' && <DownloadManager />}
    </div>
  )
}

function ChatMessage({ message, handleDownloadReport }) {
  const isAssistant = message.role === 'assistant';
  
  if (message.type === 'typing') {
    return (
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (message.type === 'file_upload') {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm border border-slate-200 max-w-[80%]">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-teal-600" />
            <span className="text-sm font-medium text-slate-900">{message.metadata.fileInfo?.name || 'File'}</span>
          </div>
          <div className="text-xs text-slate-500">
            {message.metadata.fileInfo?.size || 0} bytes • {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <User size={16} />
        </div>
      </div>
    );
  }
  
  if (message.type === 'report_generation') {
    const canDownload = message.metadata?.can_download;
    const reportId = message.metadata?.report_details?.report_id;
    const reportType = message.metadata?.report_type || 'pdf';
    
    return (
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 max-w-[80%]">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1 rounded ${canDownload ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {canDownload ? <CheckCircle size={16} /> : <Loader className="animate-spin" size={16} />}
            </div>
            <span className="text-sm font-medium text-slate-900">
              {canDownload ? 'Report Ready' : 'Generating Report'}
            </span>
          </div>
          <div className="text-sm text-slate-700 whitespace-pre-line mb-3">
            {message.content}
          </div>
          <div className="flex gap-2">
            {canDownload ? (
              <>
                <button 
                  onClick={() => handleDownloadReport(reportId, reportType)}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-green-500 text-white hover:from-teal-600 hover:to-green-600 rounded-lg transition text-sm flex items-center gap-1"
                >
                  <Download size={14} />
                  Download {reportType.toUpperCase()}
                </button>
              </>
            ) : (
              <>
                <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg transition text-sm flex items-center gap-1">
                  <Loader className="animate-spin" size={14} />
                  Generating...
                </button>
                <button className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm">
                  Cancel
                </button>
              </>
            )}
          </div>
          
          {message.metadata?.report_details?.file_info && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 mb-1">File Details:</div>
              <div className="text-xs text-slate-700 space-y-0.5">
                <div>• Size: {message.metadata.report_details.file_info.size_mb || '2.5'} MB</div>
                <div>• Pages: {message.metadata.report_details.file_info.pages || 'N/A'}</div>
                <div>• Sections: {message.metadata.report_details.file_info.sections?.join(', ') || 'N/A'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (message.type === 'error') {
    return (
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-red-50 p-3 rounded-2xl rounded-tl-none shadow-sm border border-red-200 max-w-[80%]">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-900">Error</span>
          </div>
          <p className="text-sm text-red-700">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === 'download_success' || message.type === 'download_complete' || message.type === 'download_simulated') {
    return (
      <div className="flex items-start gap-3">
        <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="bg-green-50 p-3 rounded-2xl rounded-tl-none shadow-sm border border-green-200 max-w-[80%]">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-sm font-medium text-green-900">Download Complete</span>
          </div>
          <p className="text-sm text-green-700">{message.content}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'justify-end'}`}>
      {isAssistant ? (
        <>
          <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
            <Bot size={16} />
          </div>
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 max-w-[80%]">
            <div className="text-sm text-slate-700 whitespace-pre-line">{message.content}</div>
            {message.metadata?.confidence && (
              <div className="mt-2 text-xs text-slate-500">
                Confidence: {Math.round(message.metadata.confidence * 100)}%
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm border border-slate-200 max-w-[80%]">
            <div className="text-sm text-slate-700">{message.content}</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
        </>
      )}
    </div>
  );
}

function DownloadManager() {
  const [downloads, setDownloads] = useState([
    {
      id: `download-1-${Math.random().toString(36).substr(2, 9)}`,
      name: 'CSRD Compliance Report 2024',
      type: 'pdf',
      size: '2.5 MB',
      date: '2024-01-15',
      status: 'completed',
      downloaded: true
    },
    {
      id: `download-2-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Supplier Emissions Dashboard',
      type: 'xlsx',
      size: '1.8 MB',
      date: '2024-01-10',
      status: 'completed',
      downloaded: true
    },
    {
      id: `download-3-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Sustainability Performance Q4 2023',
      type: 'docx',
      size: '1.2 MB',
      date: '2024-01-05',
      status: 'completed',
      downloaded: true
    }
  ]);
}

function ReportTemplates({ templates, onUseTemplate }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 shadow border border-slate-200">
        <h3 className="font-semibold text-lg mb-2">📋 Report Templates</h3>
        <p className="text-sm text-slate-600 mb-4">Pre-configured templates for quick report generation</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="p-4 border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition cursor-pointer group"
              onClick={() => onUseTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{template.icon}</span>
                    <h4 className="font-medium text-slate-900">{template.name}</h4>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{template.description}</div>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                  {template.format}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Last used: {template.lastUsed}</span>
                <span className="text-teal-600 group-hover:text-teal-700 transition">Use template →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 How to use templates</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click any template to open it in the AI Assistant</li>
          <li>• Customize the report parameters with natural language</li>
          <li>• Upload additional files to enhance the report</li>
          <li>• Generate in PDF, Excel, or DOCX format</li>
        </ul>
      </div>
    </div>
  );
}

function ReportingHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        AI Reporting Assistant
      </h2>
      <p className="text-sm text-slate-600 mt-1">
        Chat with AI to generate reports, analyze uploaded files, and create compliance documents. Supports PDF, Excel, and DOCX formats.
      </p>
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AvailableReports />
        <ReportSettings />
      </div>
      <ReportGenerator />
      <ComplianceStatus />
    </div>
  )
}

function AvailableReports() {
  const reports = [
    { name: 'CSRD - Corporate Sustainability Reporting Directive (EU)', color: 'bg-green-500' },
    { name: 'GRI 305 - Emissions Standards', color: 'bg-blue-500' },
    { name: 'TCFD - Climate-related Financial Disclosures', color: 'bg-purple-500' },
    { name: 'CDP - Carbon Disclosure Project', color: 'bg-orange-500' },
    { name: 'SEC Climate Rules (US)', color: 'bg-red-500' }
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
      <h3 className="font-medium mb-2">📋 Available Reports</h3>
      <ul className="text-sm text-slate-600 space-y-2">
        {reports.map((report, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className={`w-2 h-2 ${report.color} rounded-full`}></span>
            {report.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReportSettings() {
  return (
    <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
      <h3 className="font-medium mb-2">⚙️ Report Settings</h3>
      <div className="space-y-3">
        <SelectInput 
          label="Reporting Period"
          options={['2024 - Full Year', '2024 - Q4', '2024 - Q3']}
        />
        <SelectInput 
          label="Framework"
          options={['CSRD (EU)', 'GRI Standards', 'TCFD', 'CDP']}
        />
      </div>
    </div>
  )
}

function SelectInput({ label, options }) {
  return (
    <div>
      <label className="text-sm text-slate-600">{label}</label>
      <select className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm">
        {options.map((option, idx) => (
          <option key={idx}>{option}</option>
        ))}
      </select>
    </div>
  )
}

function ReportingAssistant({ 
  question, 
  setQuestion, 
  response, 
  isChatting, 
  onChatSubmit, 
  onGenerateReport,
  sampleQueries,
  isGenerating 
}) {
  const quickActions = [
    {
      label: "📊 Generate PDF Report",
      description: "CSRD compliant sustainability report",
      action: () => onGenerateReport('pdf', { framework: 'CSRD', period: '2024' })
    },
    {
      label: "📈 Export to Excel",
      description: "Supplier emissions and risk data",
      action: () => onGenerateReport('excel', { data_type: 'supplier_emissions' })
    },
    {
      label: "📝 Generate DOCX",
      description: "Formal compliance documentation",
      action: () => onGenerateReport('docx', { framework: 'GRI', period: 'Q4 2024' })
    },
    {
      label: "🌍 Compliance Report",
      description: "EU regulatory compliance status",
      action: () => onGenerateReport('pdf', { type: 'compliance', jurisdiction: 'EU' })
    }
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Bot size={16} />
            Reporting Assistant
          </h3>
          
          <div className="mb-4">
            <label className="text-sm text-slate-600 font-medium mb-1 block">
              Ask about generating reports or exporting data
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onChatSubmit()}
                placeholder="e.g., Generate a PDF report for 2024 using CSRD framework"
                className="flex-1 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={onChatSubmit}
                disabled={isChatting || !question.trim()}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isChatting ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <>
                    <Bot size={16} />
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(query);
                    setTimeout(() => onChatSubmit(), 100);
                  }}
                  className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-left"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-3">⚡ Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                disabled={isGenerating}
                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left disabled:opacity-50"
              >
                <div className="font-medium text-slate-900">{action.label}</div>
                <div className="text-xs text-slate-500 mt-1">{action.description}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-2">💡 About the Reporting Assistant</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Generates PDF, Excel, and DOCX reports from live data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Exports supplier emissions, risk scores, and compliance data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Supports CSRD, GRI, TCFD, SEC Climate Rules frameworks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Automatic data binding from MindSpore forecasts and analysis</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div>
        {response ? (
          <ReportingAssistantResponse 
            response={response} 
            onGenerateReport={onGenerateReport}
            isGenerating={isGenerating}
          />
        ) : (
          <div className="bg-white rounded-xl p-8 shadow border border-slate-100 text-center">
            <Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-medium text-slate-700 mb-2">Reporting Assistant Ready</h3>
            <p className="text-sm text-slate-500">
              Ask me to generate reports, export data, or ask questions about reporting frameworks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportingAssistantResponse({ response, onGenerateReport, isGenerating }) {
  if (!response.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium">Chat Failed</p>
        <p className="text-sm text-red-600 mt-1">{response.error}</p>
      </div>
    );
  }
  
  const handleGenerateAction = () => {
    if (response.action === 'generate_pdf') {
      onGenerateReport('pdf', { framework: 'CSRD', period: '2024' });
    } else if (response.action === 'export_excel') {
      onGenerateReport('excel', { data_type: 'supplier_emissions' });
    } else if (response.action === 'generate_docx') {
      onGenerateReport('docx', { framework: 'GRI', period: 'Q4 2024' });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
        <div className="flex items-start gap-3">
          <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
            <Bot size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">Reporting Assistant</h3>
              {response.confidence > 0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  response.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                  response.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Confidence: {Math.round(response.confidence * 100)}%
                </span>
              )}
            </div>
            
            <p className="text-slate-700">{response.answer}</p>
            
            {response.action && (
              <button
                onClick={handleGenerateAction}
                disabled={isGenerating}
                className="mt-3 bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Generating...
                  </>
                ) : (
                  `Generate ${response.action.replace('generate_', '').toUpperCase()} Report`
                )}
              </button>
            )}
            
            {response.report_details && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-sm font-medium text-slate-700">Report Details</div>
                <div className="text-xs text-slate-500 mt-1">
                  ID: {response.report_details.report_id}
                </div>
                <div className="text-xs text-slate-500">
                  Type: {response.report_details.report_type.toUpperCase()}
                </div>
                <div className="text-xs text-slate-500">
                  Status: Generating ({response.report_details.estimated_time_seconds}s)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {response.suggested_queries && response.suggested_queries.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Suggested Actions</h4>
          <div className="space-y-2">
            {response.suggested_queries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => {
                  // This would set the question and trigger chat in parent
                  console.log('Suggested query:', query);
                }}
                className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 transition"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GeneratedReportsList({ reports }) {
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow border border-slate-100 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="font-medium text-slate-700 mb-2">No Reports Generated</h3>
        <p className="text-sm text-slate-500">
          Use the Reporting Assistant to generate your first report.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
        <h3 className="font-medium mb-3">📁 Generated Reports ({reports.length})</h3>
        <div className="space-y-3">
          {reports.map((report, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">
                    {report.report_type.toUpperCase()} Report - {report.report_id}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Generated: {new Date(report.generated_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition">
                    Download
                  </button>
                  <button className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition">
                    View Details
                  </button>
                </div>
              </div>
              
              {report.parameters && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">Parameters:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(report.parameters).map(([key, value]) => (
                      <span key={key} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComplianceStatus() {
  const metrics = [
    { label: 'Data Completeness', value: '95%' },
    { label: 'Quality Score', value: '88/100' },
    { label: 'Last Audit', value: 'Dec 2024' }
  ];

  return (
    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
      <h3 className="font-medium text-green-900 mb-2">✅ Compliance Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-green-800">{metric.label}</span>
            <span className="font-bold text-green-900">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Regulations() {
  const [activeTab, setActiveTab] = useState('analyze');
  
  return (
    <div className="space-y-6">
      <RegulationsHeader />
      
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'analyze' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Document Analysis
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'chat' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Regulatory Chatbot
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'samples' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sample Regulations
        </button>
      </div>
      
      {activeTab === 'analyze' && <DocumentAnalyzer />}
      {activeTab === 'chat' && <RegulatoryChatbot />}
      {activeTab === 'samples' && <SampleRegulations />}
    </div>
  )
}

function RegulationsHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold flex items-center gap-2">
        Regulatory Intelligence
      </h2>
      <p className="text-sm text-slate-600 mt-1">
        Analyze regulatory documents and ESG reports using BERT-based NLP. Extract compliance requirements, deadlines, and thresholds automatically.
      </p>
    </div>
  )
}

  function DocumentAnalyzer() {
  const { regulationText, setRegulationText, nlpResult, setNlpResult, isAnalyzing, handleAnalyzeRegulation } = useContext(RegulationContext);
  
  const sampleRegulations = [
    {
      title: 'CSRD Excerpt',
      text: 'Large undertakings shall disclose Scope 1, 2, and material Scope 3 GHG emissions in tonnes of CO2 equivalent. The disclosure shall include emissions from the reporting year and comparative figures for the previous two reporting periods. Undertakings with more than 750 employees or annual net turnover exceeding €100 million are subject to mandatory reporting starting fiscal year 2024.',
      type: 'regulation'
    },
    {
      title: 'Supplier ESG Report',
      text: 'Our global operations generated 125,450 metric tons of CO2 equivalent in 2023, comprising 45,200 tons from Scope 1 (direct emissions), 35,800 tons from Scope 2 (purchased electricity), and 44,450 tons from Scope 3 (supply chain and logistics). We achieved a 12% reduction compared to our 2022 baseline of 142,500 tons CO2e. Renewable energy accounted for 28% of total energy consumption, up from 18% in 2022.',
      type: 'supplier_esg'
    }
  ];
  
  const loadSample = (sample) => {
    setRegulationText(sample.text);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <FileText size={16} />
            Regulatory Document Analyzer
          </h3>
          
          <div className="mb-4">
            <label className="text-sm text-slate-600 font-medium mb-1 block">
              Paste regulatory text or ESG report
            </label>
            <textarea
              value={regulationText}
              onChange={(e) => setRegulationText(e.target.value)}
              placeholder="Paste regulatory text, sustainability reports, or compliance documents here..."
              className="w-full h-64 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAnalyzeRegulation}
              disabled={isAnalyzing || !regulationText.trim()}
              className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot size={16} />
                  Analyze Document
                </>
              )}
            </button>
            
            <button
              onClick={() => setRegulationText('')}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
            >
              Clear
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Try sample documents:</p>
            <div className="flex gap-2">
              {sampleRegulations.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => loadSample(sample)}
                  className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-2">📊 How It Works</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>BERT-based Named Entity Recognition extracts thresholds, deadlines, penalties</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Multi-language support for EU, US, APAC regulations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Automated compliance requirement extraction</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Supplier ESG document analysis for Scope 1/2/3 emissions</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div>
        {nlpResult ? (
          <NLPResults result={nlpResult} />
        ) : (
          <div className="bg-white rounded-xl p-8 shadow border border-slate-100 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-medium text-slate-700 mb-2">No Analysis Results</h3>
            <p className="text-sm text-slate-500">
              Paste a regulatory document or ESG report on the left and click "Analyze Document" to see extracted entities and compliance requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function NLPResults({ result }) {
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium">Analysis Failed</p>
        <p className="text-sm text-red-600 mt-1">{result.error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
        <h3 className="font-medium mb-3 flex items-center justify-between">
          <span>📋 Analysis Results</span>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
            {result.metadata?.language?.toUpperCase() || 'EN'}
          </span>
        </h3>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">{result.summary}</p>
        </div>
        
        {result.metadata && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Document Metadata</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Jurisdictions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.metadata.jurisdictions?.map((j, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                      {j}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Type:</span>
                <span className="ml-2 font-medium">{result.metadata.regulation_type}</span>
              </div>
              <div>
                <span className="text-slate-500">Word Count:</span>
                <span className="ml-2 font-medium">{result.metadata.word_count}</span>
              </div>
              <div>
                <span className="text-slate-500">Quality Score:</span>
                <span className="ml-2 font-medium">{result.metadata.data_quality_score || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
        
        {result.entities && (
          <div className="space-y-4">
            {Object.entries(result.entities).map(([key, values]) => (
              values.length > 0 && (
                <div key={key}>
                  <h4 className="text-sm font-medium text-slate-700 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value, idx) => (
                      <span key={idx} className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-lg text-sm">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
        
        {result.compliance_requirements && result.compliance_requirements.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Compliance Requirements</h4>
            <ul className="space-y-2">
              {result.compliance_requirements.slice(0, 5).map((req, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  <span>{req.length > 150 ? req.substring(0, 150) + '...' : req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {result.emission_data && (
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-3">🌱 Emission Data Extracted</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(result.emission_data).map(([scope, value]) => (
              value !== null && (
                <div key={scope} className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 capitalize">{scope.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="font-bold text-slate-900 mt-1">
                    {value.toLocaleString()} kg
                  </div>
                </div>
              )
            ))}
          </div>
          {result.renewable_energy_pct && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-700">Renewable Energy</span>
                <span className="font-bold text-green-600">{result.renewable_energy_pct}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RegulatoryChatbot() {
  const { chatQuestion, setChatQuestion, chatResponse, setChatResponse, isChatting, handleChatSubmit } = useContext(RegulationContext);
  
  const sampleQuestions = [
    "What are the CSRD reporting thresholds?",
    "How to calculate Scope 3 emissions?",
    "What are the penalties for non-compliance?",
    "When is the SEC climate disclosure effective?",
    "What is the EU renewable energy target for 2030?"
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare size={16} />
            Regulatory Compliance Assistant
          </h3>
          
          <div className="mb-4">
            <label className="text-sm text-slate-600 font-medium mb-1 block">
              Ask about regulations, compliance, or reporting
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="e.g., What are the CSRD reporting requirements?"
                className="flex-1 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleChatSubmit}
                disabled={isChatting || !chatQuestion.trim()}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isChatting ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <>
                    <Bot size={16} />
                    Ask
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatQuestion(question)}
                  className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
          <h3 className="font-medium mb-2">💡 About the Chatbot</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Powered by BERT-based NLP and regulatory knowledge base</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Covers CSRD, SEC, TCFD, GRI, ISO standards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Provides source citations for accuracy verification</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500">•</span>
              <span>Multi-language support for global regulations</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div>
        {chatResponse ? (
          <ChatResponse response={chatResponse} />
        ) : (
          <div className="bg-white rounded-xl p-8 shadow border border-slate-100 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-medium text-slate-700 mb-2">Regulatory Assistant Ready</h3>
            <p className="text-sm text-slate-500">
              Ask questions about sustainability regulations, compliance requirements, or reporting standards.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatResponse({ response }) {
  const { setChatQuestion, handleChatSubmit } = useContext(RegulationContext);

  if (!response.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-700 font-medium">Chat Failed</p>
        <p className="text-sm text-red-600 mt-1">{response.error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow border border-slate-100">
        <div className="flex items-start gap-3">
          <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
            <Bot size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">Regulatory Assistant</h3>
              {response.confidence > 0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  response.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                  response.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Confidence: {Math.round(response.confidence * 100)}%
                </span>
              )}
            </div>
            
            <p className="text-slate-700">{response.answer}</p>
            
            {response.source && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Source:</span> {response.source}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {response.suggested_queries && response.suggested_queries.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Suggested Questions</h4>
          <div className="space-y-2">
            {response.suggested_queries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setChatQuestion(query);
                  handleChatSubmit();
                }}
                className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 transition"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SampleRegulations() {
  const samples = [
    {
      title: "CSRD (EU) - Article 1",
      jurisdiction: "EU",
      content: "Large undertakings shall disclose Scope 1, 2, and material Scope 3 GHG emissions in tonnes of CO2 equivalent. The disclosure shall include emissions from the reporting year and comparative figures for the previous two reporting periods.",
      entities: ["Scope 1, 2, and 3", "tonnes CO2 equivalent", "reporting year"]
    },
    {
      title: "SEC Climate Rules (US)",
      jurisdiction: "US",
      content: "Registrants must disclose Scope 1 and Scope 2 greenhouse gas emissions, and material Scope 3 emissions if included in emissions reduction targets. Disclosure required for fiscal years ending after December 2024.",
      entities: ["Scope 1 and 2", "Scope 3 if material", "fiscal years after Dec 2024"]
    },
    {
      title: "Supplier ESG Report Example",
      jurisdiction: "Global",
      content: "In 2023, our operations emitted 125,450 metric tons of CO2 equivalent (Scope 1: 45,200 tons, Scope 2: 35,800 tons, Scope 3: 44,450 tons). Renewable energy accounted for 28% of our electricity consumption.",
      entities: ["125,450 tons CO2e", "45,200 tons Scope 1", "28% renewable"]
    }
  ];
  
  const { setRegulationText, handleAnalyzeRegulation } = useContext(RegulationContext);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {samples.map((sample, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 shadow border border-slate-100 hover:border-teal-300 transition">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-slate-900">{sample.title}</h3>
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                {sample.jurisdiction}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{sample.content}</p>
            
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-1">Key Entities:</div>
              <div className="flex flex-wrap gap-1">
                {sample.entities.map((entity, eIdx) => (
                  <span key={eIdx} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded">
                    {entity}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => {
                setRegulationText(sample.content);
                setTimeout(() => handleAnalyzeRegulation(), 100);
              }}
              className="w-full text-center text-sm text-teal-600 font-medium hover:text-teal-700 p-2 border border-teal-200 hover:bg-teal-50 rounded-lg transition"
            >
              Analyze this sample
            </button>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">📚 Supported Regulatory Frameworks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="font-medium text-blue-900">CSRD</div>
            <div className="text-xs text-blue-700">EU Sustainability Reporting</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="font-medium text-blue-900">SEC Climate</div>
            <div className="text-xs text-blue-700">US Disclosure Rules</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="font-medium text-blue-900">TCFD</div>
            <div className="text-xs text-blue-700">Climate Risk Framework</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="font-medium text-blue-900">GRI</div>
            <div className="text-xs text-blue-700">Global Standards</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportGenerator() {
  const buttons = [
    { 
      label: '📄 Generate PDF Report', 
      style: 'bg-slate-800 text-white hover:bg-slate-900',
      onClick: () => console.log('Generate PDF') 
    },
    { 
      label: '📊 Export to Excel', 
      style: 'border border-slate-300 hover:bg-slate-50',
      onClick: () => console.log('Export Excel') 
    },
    { 
      label: '📝 Generate DOCX', 
      style: 'border border-slate-300 hover:bg-slate-50',
      onClick: () => console.log('Generate DOCX') 
    }
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
      <h3 className="font-medium mb-3">📊 Generate Report</h3>
      <p className="text-sm text-slate-600 mb-4">
        Generate compliance reports by binding real-time data from MindSpore forecasts, supplier risk assessments, and operational logs. Reports include Scope 1/2/3 emissions, carbon intensity metrics, and regulatory validation.
      </p>

      <div className="flex gap-3 flex-wrap">
        {buttons.map((button, idx) => (
          <button 
            key={idx}
            onClick={button.onClick}
            className={`px-4 py-2 rounded-xl transition text-sm font-medium ${button.style}`}
          >
            {button.label}
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Use the Reporting Assistant tab for AI-powered report generation and custom data exports.
        </p>
      </div>
    </div>
  )
}
// SSCA Dashboard — Next.js / React single-file component
// Place this file as `app/page.jsx` (Next.js 13+ app router) or `pages/index.jsx` (Next.js pages router).
// Requirements (add to package.json):
// react, react-dom, next, tailwindcss, recharts, lucide-react, framer-motion
// Tailwind must be configured in the project.
"use client";
import React, { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { Sun, Cloud, Search, Menu } from 'lucide-react'

function Regulations() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Regulatory Intelligence</h2>
      <div className="bg-slate-50 rounded-xl p-4 border">
        <h3 className="font-medium mb-2">Sample Regulation Text</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          The Corporate Sustainability Reporting Directive (CSRD) requires companies to disclose environmental impact information including Scope 1, Scope 2, and Scope 3 emissions. Organizations must ensure data traceability, auditability, and adherence to ESRS standards. Reporting entities are accountable for validating supplier-level emissions data and ensuring alignment with EU taxonomy climate objectives.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          In addition, cross-border logistics emissions must comply with the Fit for 55 package, which mandates phased reductions in carbon intensity across freight operations. Companies using multi-modal transport must demonstrate clear justification for routing choices and emissions factors used.
        </p>
      </div>
    </div>
  )
}

export default function SSCAApp() {
  const [active, setActive] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [scenario, setScenario] = useState({ modalShiftPct: 30, renewableIncreasePct: 50 })

  // Mock data for charts and tables — replace with real API calls
  const forecastData = useMemo(() => {
    const days = 30
    const base = 62500
    return Array.from({ length: days }).map((_, i) => ({
      date: `D${i + 1}`,
      emissions: Math.round(base * (1 + Math.sin(i / 5) * 0.08 + i / 200))
    }))
  }, [])

  const supplierData = useMemo(() => [
    { id: 'S-001', name: 'Alpha Steel', country: 'CN', emissions: 12000, risk: 88, tier: 'Tier-1' },
    { id: 'S-002', name: 'Beta Logistics', country: 'ID', emissions: 5200, risk: 72, tier: 'Tier-1' },
    { id: 'S-003', name: 'Gamma Parts', country: 'VN', emissions: 2300, risk: 45, tier: 'Tier-2' },
    { id: 'S-004', name: 'Delta Energy', country: 'US', emissions: 54000, risk: 95, tier: 'Tier-1' }
  ], [])

  const pieData = useMemo(
    () => [
      { name: 'Operations', value: 72 },
      { name: 'Logistics', value: 28 }
    ],
    []
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <Header query={query} setQuery={setQuery} setActive={setActive} />

        <div className="grid grid-cols-12 gap-6 mt-6">
          <nav className="col-span-12 md:col-span-3 lg:col-span-2 bg-white rounded-2xl p-4 shadow">
            <Sidebar active={active} setActive={setActive} />
          </nav>

          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            <div className="bg-white rounded-2xl p-6 shadow">
              {active === 'dashboard' && (
                <Dashboard
                  forecastData={forecastData}
                  supplierData={supplierData}
                  pieData={pieData}
                  scenario={scenario}
                  setScenario={setScenario}
                />
              )}

              {active === 'modules' && <ModulesExplorer />}
              {active === 'optimization' && <Optimization scenario={scenario} setScenario={setScenario} />}
              {active === 'reporting' && <Reporting />}
              {active === 'suppliers' && <SuppliersTable suppliers={supplierData} />}
              {active === 'regulations' && <Regulations />}
            </div>
          </main>
        </div>

        <footer className="mt-6 text-sm text-slate-500">SSCA Dashboard — Demo UI · Built with Next.js & Tailwind</footer>
      </div>
    </div>
  )
}

function Header({ query, setQuery, setActive }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow">
          <Sun size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">SSCA</h1>
          <p className="text-sm text-slate-500">Emission forecasting · Supplier risk · Regulatory intelligence</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden md:inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow" onClick={() => setActive('modules')}>
          <Menu size={16} /> Modules
        </button>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl shadow">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search modules, suppliers, regs..." className="outline-none text-sm" />
        </div>

        <div className="bg-white px-3 py-2 rounded-2xl shadow flex items-center gap-2">
          <Cloud size={16} /> <span className="text-sm">Live</span>
        </div>
      </div>
    </header>
  )
}

function Sidebar({ active, setActive }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'modules', label: 'Modules' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'optimization', label: 'Optimization' },
    { key: 'reporting', label: 'Reporting' },
    { key: 'regulations', label: 'Regulations' }
  ]

  return (
    <div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.key}>
            <button
              onClick={() => setActive(i.key)}
              className={`w-full text-left px-3 py-2 rounded-xl ${active === i.key ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'}`}>
              {i.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-xs text-slate-500">Version: Demo · Data: Mock</div>
    </div>
  )
}

function Dashboard({ forecastData, supplierData, pieData, scenario, setScenario }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2">7–30 day Emission Forecast</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={forecastData}>
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="emissions" stroke="#0ea5a4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2">Source Breakdown</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" data={pieData} innerRadius={45} outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#06b6d4'} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-sm text-slate-600">Recommendation: Modal shift (air → sea) for non-urgent shipments to reduce logistics emissions.</div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2">Top Supplier Hotspots</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left">
                <tr>
                  <th className="p-2">Supplier</th>
                  <th>Country</th>
                  <th>Emissions (kg)</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {supplierData.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className="p-2">{s.country}</td>
                    <td className="p-2">{s.emissions.toLocaleString("en-us")}</td>
                    <td className="p-2">{s.risk}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <h3 className="font-semibold mb-2">Scenario Planner</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">Modal shift to sea (%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={scenario.modalShiftPct}
                onChange={(e) => setScenario((prev) => ({ ...prev, modalShiftPct: Number(e.target.value) }))}
              />
              <div className="text-sm">{scenario.modalShiftPct}%</div>
            </div>

            <div>
              <label className="text-xs text-slate-500">Renewable energy increase (%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={scenario.renewableIncreasePct}
                onChange={(e) => setScenario((prev) => ({ ...prev, renewableIncreasePct: Number(e.target.value) }))}
              />
              <div className="text-sm">{scenario.renewableIncreasePct}%</div>
            </div>

            <div>
              <button className="bg-teal-500 text-white px-4 py-2 rounded-xl">Simulate & Apply</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ModulesExplorer() {
  const modules = [
    { id: 1, title: 'Data Integration & Preprocessing', desc: 'Ingest operational, logistics, supplier ESG and regulatory data — ETL, validation, storage.' },
    { id: 2, title: 'Emission Forecasting Engine', desc: 'MindSpore-optimized LSTM-Attention time-series model for multi-horizon forecasts.' },
    { id: 3, title: 'Regulatory NLP Engine', desc: 'Transformer-based NER and relation extraction for compliance requirements.' },
    { id: 4, title: 'Supplier Risk Scoring', desc: 'Composite risk model using environmental, compliance, operational, reputational signals.' },
    { id: 5, title: 'Optimization & Scenario Planning', desc: 'Multi-objective optimizer for cost-emission trade-offs and scenario evaluation.' },
    { id: 6, title: 'Reporting & Compliance', desc: 'Template-based report generation for CSRD, GRI, TCFD, CDP and SEC rules.' }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">SSCA Technical Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <article key={m.id} className="p-4 bg-slate-50 rounded-xl border">
            <h3 className="font-semibold">{m.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{m.desc}</p>
            <details className="mt-2 text-xs text-slate-500">
              <summary className="cursor-pointer">View details</summary>
              <p className="mt-2">(Full technical content is available in the SSCA Technical Modules PDF — integrate OCR/extraction to import content programmatically.)</p>
            </details>
          </article>
        ))}
      </div>
    </div>
  )
}

function SuppliersTable({ suppliers }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Supplier Directory</h2>
      <div className="overflow-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3">ID</th>
              <th>Supplier</th>
              <th>Tier</th>
              <th>Emissions</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="p-2">{s.id}</td>
                <td className="p-2 font-medium">{s.name}</td>
                <td className="p-2">{s.tier}</td>
                <td className="p-2">{s.emissions.toLocaleString()}</td>
                <td className="p-2">{s.risk}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Optimization({ scenario, setScenario }) {
  // demo: simple bar chart showing cost vs emissions tradeoff for three candidate solutions
  const optData = [
    { name: 'Baseline', emissions: 100, cost: 100 },
    { name: 'ModalShift30%', emissions: 82, cost: 104 },
    { name: 'Renewables+50%', emissions: 70, cost: 107 }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Optimization & Scenario Planning</h2>

      <div className="bg-white rounded-xl p-4 shadow">
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={optData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="emissions" name="Emissions" fill="#FF2424" />
              <Bar dataKey="cost" name="Cost" fill="#249CFF" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-sm text-slate-600">Scenario: modal shift {scenario.modalShiftPct}%, renewable +{scenario.renewableIncreasePct}%</div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow">
        <h3 className="font-medium">Run Custom Scenario</h3>
        <p className="text-sm text-slate-500 mt-2">Use the planner on the dashboard to adjust modal shift and renewable adoption and then press Simulate.</p>
      </div>
    </div>
  )
}

function Reporting() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Automated Reporting</h2>
      <div className="bg-white p-4 rounded-xl shadow">
        <p className="text-sm text-slate-600">Generate CSRD / GRI / TCFD compatible reports by binding data from the pipelines. Demo exports: PDF, DOCX, XLSX (server-side rendering required).</p>

        <div className="mt-3 flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-slate-800 text-white">Generate PDF</button>
          <button className="px-4 py-2 rounded-xl border">Generate DOCX</button>
        </div>
      </div>
    </div>
  )
}
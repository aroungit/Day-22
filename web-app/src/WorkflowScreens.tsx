import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Boxes, Check, Copy, Download, FileJson, FileSpreadsheet, FlaskConical, Link, RefreshCw, TestTube2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import * as yaml from 'js-yaml';
import * as XLSX from 'xlsx';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api, type RunAggregate, type RunPlan, type RunReport } from './lib/api';
import { useAppStore } from './stores';

type SourceMode = 'document' | 'url';

function downloadText(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const workflowSteps = [
  { number: 1, label: 'Import specification', path: '/specs' },
  { number: 2, label: 'Connect environment', path: '/environments' },
  { number: 3, label: 'Plan and run', path: '/execution' },
  { number: 4, label: 'Review results', path: '/reports' },
  { number: 5, label: 'Generate test code', path: '/testgen' },
];

function WorkflowGuide({ currentStep, nextPath, nextLabel }: { currentStep: number; nextPath: string; nextLabel: string }) {
  const navigate = useNavigate();
  return <div className="workflow-guide" aria-label="Testing workflow">
    <div className="workflow-guide-header"><div><div className="eyebrow">WORKFLOW PATH</div><strong>Move through the five steps in order</strong></div><span className="step-count">Step {currentStep} of {workflowSteps.length}</span></div>
    <div className="workflow-steps">{workflowSteps.map((step) => <button key={step.path} className={`workflow-step ${step.number === currentStep ? 'active' : ''} ${step.number < currentStep ? 'done' : ''}`} onClick={() => navigate(step.path)} aria-current={step.number === currentStep ? 'step' : undefined}><span className="workflow-number">{step.number}</span><span>{step.label}</span></button>)}</div>
    <div className="workflow-next"><div><strong>Next: {nextLabel}</strong><p>Use the navigation above to jump anywhere in the workflow at any time.</p></div><button className="button primary" onClick={() => navigate(nextPath)}>Continue <ArrowRight size={16} /></button></div>
  </div>;
}

export function Specs() {
  const currentSpec = useAppStore((state) => state.currentSpec);
  const importSpec = useAppStore((state) => state.importSpec);
  const importSpecUrl = useAppStore((state) => state.importSpecUrl);
  const loading = useAppStore((state) => state.loading);
  const navigate = useNavigate();
  const [mode, setMode] = useState<SourceMode>('document');
  const [url, setUrl] = useState('');

  async function handleDocument(file: File): Promise<void> {
    try {
      const text = await file.text();
      const document = file.name.toLowerCase().endsWith('.json') ? JSON.parse(text) : yaml.load(text);
      await importSpec(document);
      toast.success(`${file.name} imported`);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? 'Choose a valid JSON or YAML OpenAPI document' : 'Unable to import specification');
    }
  }

  async function handleUrl(): Promise<void> {
    if (!url.trim()) return;
    try {
      await importSpecUrl(url.trim());
      toast.success('Specification imported from URL');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to import specification URL');
    }
  }

  return <div className="page">
    <div className="page-header"><div><div className="eyebrow">STEP 01 / 05</div><h1>Import your specification</h1><p>Provide an OpenAPI document or a public URL. The backend will validate and normalize it for planning.</p></div></div><WorkflowGuide currentStep={1} nextPath="/environments" nextLabel="Connect an environment" />
    <div className="instruction-layout">
      <div className="panel instruction-panel">
        <div className="large-icon blue"><FileJson size={24} /></div>
        <h2>{currentSpec ? 'Specification ready' : 'Choose an input source'}</h2>
        <div className="theme-options source-tabs"><button className={mode === 'document' ? 'selected' : ''} onClick={() => setMode('document')}><Upload size={15} />Document</button><button className={mode === 'url' ? 'selected' : ''} onClick={() => setMode('url')}><Link size={15} />URL</button></div>
        {mode === 'document' ? <label className="button primary upload-control"><Upload size={16} />{loading ? 'Importing...' : 'Choose JSON or YAML'}<input type="file" accept=".json,.yaml,.yml,application/json,text/yaml" hidden disabled={loading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void handleDocument(file); }} /></label> : <div className="source-url"><input aria-label="OpenAPI document URL" type="url" placeholder="https://example.com/openapi.json" value={url} onChange={(event) => setUrl(event.target.value)} /><button className="button primary" onClick={() => void handleUrl()} disabled={loading || !url.trim()}><Link size={16} />{loading ? 'Importing...' : 'Import URL'}</button></div>}
        {currentSpec && <div className="loaded-spec"><strong>{currentSpec.title}</strong><span>v{currentSpec.version} / {currentSpec.operations.length} operations</span></div>}
        {currentSpec && <button className="button ghost" onClick={() => navigate('/environments')}>Continue to environment <ArrowRight size={16} /></button>}
      </div>
      <div className="panel checklist"><h2>Workflow</h2><div className="checklist-items"><div><span><Check size={13} /></span>Validate and normalize the contract</div><div><span><Check size={13} /></span>Configure the target environment</div><div><span><Check size={13} /></span>Generate a plan, execute it, and report evidence</div></div></div>
    </div>
  </div>;
}

export function Environments() {
  const currentSpec = useAppStore((state) => state.currentSpec);
  const environments = useAppStore((state) => state.environments);
  const loadEnvironments = useAppStore((state) => state.loadEnvironments);
  const createEnvironment = useAppStore((state) => state.createEnvironment);
  const deleteEnvironment = useAppStore((state) => state.deleteEnvironment);
  const [name, setName] = useState('Development');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState('none');
  const [token, setToken] = useState('');
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([{ key: 'Accept', value: 'application/json' }]);
  const [creating, setCreating] = useState(false);
  const [connection, setConnection] = useState<'idle' | 'checking' | 'ready' | 'failed'>('idle');

  useEffect(() => {
    if (!currentSpec) return;
    void loadEnvironments(currentSpec.id);
    setBaseUrl((current) => current || currentSpec.servers[0]?.url || '');
  }, [currentSpec, loadEnvironments]);

  async function handleCreate(): Promise<void> {
    if (!currentSpec || !name.trim() || !baseUrl.trim()) return;
    try { const parsedUrl = new URL(baseUrl); if (parsedUrl.protocol !== 'https:') throw new Error('Base URL must use HTTPS'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Enter a valid HTTPS base URL'); return; }
    setCreating(true);
    try {
      const headerMap = Object.fromEntries(headers.filter((header) => header.key.trim()).map((header) => [header.key.trim(), header.value]));
      await createEnvironment({ name: name.trim(), baseUrl: baseUrl.trim(), headers: headerMap, specId: currentSpec.id, ...(authType !== 'none' ? { auth: { type: authType, credentials: { token } } } : {}) });
      toast.success('Environment connected');
    }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create environment'); }
    finally { setCreating(false); }
  }

  async function testConnection(): Promise<void> {
    try { setConnection('checking'); const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`); if (!response.ok) throw new Error('Health check failed'); setConnection('ready'); toast.success('Connection is healthy'); }
    catch { setConnection('failed'); toast.error('Unable to reach the environment health endpoint'); }
  }

  return <div className="page"><div className="page-header"><div><div className="eyebrow">STEP 02 / 05</div><h1>Connect an environment</h1><p>Choose the base URL that receives the generated requests.</p></div></div><WorkflowGuide currentStep={2} nextPath="/execution" nextLabel="Plan and run tests" /><div className="execution-layout"><div className="panel form-panel"><div className="eyebrow">ENVIRONMENT CONFIGURATION</div><label className="field-label">NAME<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label className="field-label">BASE URL<input required type="url" placeholder="https://api.example.com" value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setConnection('idle'); }} /></label><div className="inline-actions"><button className="button ghost" disabled={!baseUrl.trim() || connection === 'checking'} onClick={() => void testConnection()}>{connection === 'checking' ? 'Checking...' : 'Test connection'}</button>{connection !== 'idle' && <span className={`status ${connection === 'ready' ? 'passed' : 'failed'}`}>{connection}</span>}</div><label className="field-label">AUTHENTICATION<select value={authType} onChange={(event) => setAuthType(event.target.value)}><option value="none">None</option><option value="bearer">Bearer token</option><option value="basic">Basic credentials</option><option value="apiKey">API key</option></select></label>{authType !== 'none' && <label className="field-label">TOKEN / VALUE<input type="password" value={token} onChange={(event) => setToken(event.target.value)} /></label>}<div className="field-label">DEFAULT HEADERS{headers.map((header, index) => <div className="header-row" key={`${index}-${header.key}`}><input aria-label={`Header ${index + 1} name`} placeholder="Header name" value={header.key} onChange={(event) => setHeaders((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value } : item))} /><input aria-label={`Header ${index + 1} value`} placeholder="Value" value={header.value} onChange={(event) => setHeaders((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} /><button className="icon-button" aria-label="Remove header" disabled={headers.length === 1} onClick={() => setHeaders((current) => current.filter((_, itemIndex) => itemIndex !== index))}>-</button></div>)}<button className="text-button" onClick={() => setHeaders((current) => [...current, { key: '', value: '' }])}>+ Add header</button></div><button className="button primary full" disabled={!currentSpec || creating || !baseUrl.trim()} onClick={() => void handleCreate()}><Boxes size={16} />{creating ? 'Connecting...' : 'Connect environment'}</button></div><div className="panel checklist"><h2>{currentSpec ? 'Configured environments' : 'Import a specification first'}</h2>{environments.length ? environments.map((environment) => <div className="environment-card" key={environment.id ?? environment.name}><div className="env-badge blue">{environment.name[0]}</div><div className="env-info"><h2>{environment.name}</h2><p>{environment.baseUrl}</p></div><span className="status passed">Ready</span>{environment.id && <button className="icon-button" aria-label={`Delete ${environment.name}`} onClick={() => { if (window.confirm(`Delete ${environment.name}?`)) void deleteEnvironment(environment.id!); }}>×</button>}</div>) : <p className="muted-copy">No environment is linked to this specification yet.</p>}</div></div></div>;
}

export function Execution() {
  const currentSpec = useAppStore((state) => state.currentSpec);
  const environments = useAppStore((state) => state.environments);
  const setActiveRun = useAppStore((state) => state.setActiveRun);
  const navigate = useNavigate();
  const [scope, setScope] = useState<'all' | 'tag'>('all');
  const [tag, setTag] = useState('');
  const [framework, setFramework] = useState<'axios' | 'playwright'>('axios');
  const [plan, setPlan] = useState<RunPlan | null>(null);
  const [working, setWorking] = useState(false);
  const tags = [...new Set(currentSpec?.operations.flatMap((operation) => operation.tags) ?? [])];
  const environment = environments[0];

  async function createPlanAndRun(): Promise<void> {
    if (!currentSpec || !environment) return;
    setWorking(true);
    try {
      await api.generateTests({ specId: currentSpec.id, all: scope === 'all', ...(scope === 'tag' ? { tag } : {}), includePositive: true, includeNegative: true });
      const nextPlan = await api.createPlan({ specId: currentSpec.id, envName: environment.name, ...(scope === 'all' ? { all: true } : { tag }) });
      setPlan(nextPlan);
      const report = await api.executeRun({ runId: nextPlan.runId, async: true, framework });
      setActiveRun(report);
      toast.success('Run started. Results will update live.');
      navigate('/reports');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to plan or execute tests'); }
    finally { setWorking(false); }
  }

  return <div className="page"><div className="page-header"><div><div className="eyebrow">STEP 03 / 05</div><h1>Plan and run tests</h1><p>Review the selected scope before the backend creates and executes the test plan.</p></div></div><WorkflowGuide currentStep={3} nextPath="/reports" nextLabel="Review results" /><div className="execution-layout"><div className="panel form-panel"><div className="eyebrow">RUN PLAN</div><div className="read-only-field"><FileJson size={16} />{currentSpec?.title ?? 'Import a specification first'}</div><div className="read-only-field"><Boxes size={16} />{environment?.name ?? 'Connect an environment first'}</div><label className="field-label">COVERAGE<select value={scope} onChange={(event) => setScope(event.target.value as 'all' | 'tag')}><option value="all">All operations</option><option value="tag">By tag</option></select></label>{scope === 'tag' && <select aria-label="Operation tag" value={tag} onChange={(event) => setTag(event.target.value)}><option value="">Choose a tag</option>{tags.map((item) => <option key={item} value={item}>{item}</option>)}</select>}<label className="field-label">EXECUTION ENGINE<select value={framework} onChange={(event) => setFramework(event.target.value as 'axios' | 'playwright')}><option value="axios">Axios</option><option value="playwright">Playwright</option></select></label><button className="button primary full" disabled={working || !currentSpec || !environment || (scope === 'tag' && !tag)} onClick={() => void createPlanAndRun()}><FlaskConical size={16} />{working ? 'Planning and executing...' : `Create plan and execute with ${framework === 'axios' ? 'Axios' : 'Playwright'}`}</button></div><div className="panel plan-preview"><div className="panel-heading"><div><h2>{plan ? 'Plan created' : 'Execution preview'}</h2><p>{plan ? `${plan.testCaseDefinitions.length} test cases / ${plan.runId}` : `${currentSpec?.operations.length ?? 0} operations available`}</p></div></div>{plan ? <div className="checklist-items">{plan.testCaseDefinitions.slice(0, 8).map((testCase) => <div key={testCase.id}><span><Check size={13} /></span>{testCase.name}</div>)}</div> : <p className="muted-copy">The backend generates happy-path and applicable validation or authentication cases from the selected operations.</p>}</div></div></div>;
}

export function TestStudio() {
  const currentSpec = useAppStore((state) => state.currentSpec);
  const [code, setCode] = useState('');
  const [framework, setFramework] = useState<'axios' | 'playwright'>('axios');
  const [working, setWorking] = useState(false);
  async function generate(): Promise<void> {
    if (!currentSpec) return;
    setWorking(true);
    try { const response = framework === 'axios' ? await api.generateTests({ specId: currentSpec.id, all: true, includePositive: true, includeNegative: true }) : await api.generatePlaywrightTests({ specId: currentSpec.id, all: true, includePositive: true, includeNegative: true }); setCode(response.code); toast.success(`${framework === 'axios' ? 'Axios' : 'Playwright'} test suite generated`); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to generate test suite'); }
    finally { setWorking(false); }
  }
  async function copyCode(): Promise<void> {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  }
  return <div className="page"><div className="page-header"><div><div className="eyebrow">STEP 05 / 05</div><h1>Generate test suite</h1><p>Generate the suite, then execute the same cases with Axios or Playwright.</p></div><button className="button primary" disabled={working || !currentSpec} onClick={() => void generate()}><TestTube2 size={16} />{working ? 'Generating...' : `Generate ${framework === 'axios' ? 'Axios' : 'Playwright'} suite`}</button></div><WorkflowGuide currentStep={5} nextPath="/" nextLabel="Return to workspace" /><div className="panel code-panel"><div className="code-heading"><div className="theme-options code-tabs"><button className={framework === 'axios' ? 'selected' : ''} onClick={() => setFramework('axios')}>Jest + Axios</button><button className={framework === 'playwright' ? 'selected' : ''} onClick={() => setFramework('playwright')}><FileSpreadsheet size={14} />Playwright</button></div><div className="code-actions"><button className="text-button" disabled={!code} onClick={() => void copyCode()}><Copy size={14} />Copy</button><button className="text-button" disabled={!code} onClick={() => downloadText(code, `swagger-ai.${framework}.test.ts`, 'text/plain')}><Download size={14} />Download</button></div></div><pre>{code || 'Generated test code will appear here.'}</pre></div></div>;
}

export function Reports() {
  const activeRun = useAppStore((state) => state.activeRun);
  const setActiveRun = useAppStore((state) => state.setActiveRun);
  const navigate = useNavigate();
  const [aggregate, setAggregate] = useState<RunAggregate | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [history, setHistory] = useState<{ items: RunReport[]; page: number; pageSize: number; total: number; pages: number } | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  useEffect(() => { if (!activeRun || activeRun.status !== 'running') return; let timer: ReturnType<typeof setTimeout>; let cancelled = false; const poll = async () => { try { const report = await api.getRunStatus(activeRun.runId); if (!cancelled) { setActiveRun(report); if (report.status === 'running') timer = setTimeout(poll, 2000); } } catch { if (!cancelled) timer = setTimeout(poll, 3000); } }; timer = setTimeout(poll, 500); return () => { cancelled = true; clearTimeout(timer); }; }, [activeRun?.runId, activeRun?.status, setActiveRun]);
  useEffect(() => { if (activeRun?.status !== 'running' && activeRun) void api.getAggregate(activeRun.runId).then(setAggregate).catch(() => setAggregate(null)); }, [activeRun?.runId, activeRun?.status]);
  useEffect(() => { void api.listRuns(historyPage, 5).then(setHistory).catch(() => setHistory(null)); }, [historyPage, activeRun?.status]);
  if (!activeRun) return <div className="page"><div className="panel empty-state report-empty"><BarChart3 size={30} /><h2>No run results yet</h2><p>Complete planning and execution to create a report.</p><button className="button primary" onClick={() => navigate('/execution')}>Start a test run <ArrowRight size={16} /></button></div></div>;
  const run = activeRun;
  const passRate = run.summary.total ? Math.round((run.summary.passed / run.summary.total) * 100) : 0;
  const averageDuration = run.results.length ? Math.round(run.results.reduce((total, result) => total + (result.durationMs ?? 0), 0) / run.results.length) : 0;
  async function retry(): Promise<void> { setRetrying(true); try { const report = await api.retryFailed(run.runId); setActiveRun(report); toast.success('Failed cases retried'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to retry failed cases'); } finally { setRetrying(false); } }
  function exportExcel(): void { const workbook = XLSX.utils.book_new(); const rows = run.results.map((result) => ({ Operation: result.operationId, Status: result.status, Expected: result.expectedStatus, Actual: result.actualStatus ?? '', DurationMs: result.durationMs ?? '', Error: result.error ?? '' })); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Results'); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ ...run.summary, RunId: run.runId, Environment: run.environmentName }]), 'Summary'); XLSX.writeFile(workbook, `${run.runId}.xlsx`); toast.success('Excel report exported'); }
  function printPdf(): void { window.print(); }
  const methodData = aggregate?.byMethod ?? [];
  const tagData = aggregate?.byTag ?? [];
  const reportActions = <><div className="header-actions report-actions"><button className="button ghost" onClick={printPdf}>Print / PDF</button><button className="button ghost" onClick={exportExcel}><FileSpreadsheet size={15} />Excel</button></div>{history && <div className="panel history-panel"><div className="panel-heading"><div><h2>Run history</h2><p>{history.total} stored runs</p></div><div className="pagination"><button className="button ghost" disabled={history.page <= 1} onClick={() => setHistoryPage((page) => page - 1)}>Previous</button><span>Page {history.page} of {Math.max(1, history.pages)}</span><button className="button ghost" disabled={history.page >= history.pages} onClick={() => setHistoryPage((page) => page + 1)}>Next</button></div></div><div className="result-list">{history.items.map((item) => <div className="result-row" key={item.runId}><span className={`result-dot ${item.status}`} /><strong>{item.runId}</strong><span>{item.environmentName}</span><small>{item.status} / {item.summary.total} checks</small></div>)}</div></div>}</>;
  return <div className="page">{reportActions}<div className="page-header"><div><div className="eyebrow">STEP 04 / 05</div><h1>Review your results</h1><p>Inspect every test result, retry failures, and use the aggregate view to find patterns.</p></div><button className="button ghost" onClick={() => navigate('/testgen')}>Generate test code</button></div><WorkflowGuide currentStep={4} nextPath="/testgen" nextLabel="Generate test code" /><div className="stat-grid compact report-kpis"><div className="stat-card"><div><div className="stat-label">STATUS</div><div className="stat-value">{activeRun.status}</div><div className="stat-detail">{activeRun.environmentName}</div></div></div><div className="stat-card"><div><div className="stat-label">PASS RATE</div><div className="stat-value">{passRate}%</div><div className="stat-detail">{activeRun.summary.passed} of {activeRun.summary.total} checks</div></div></div><div className="stat-card"><div><div className="stat-label">FAILED</div><div className="stat-value">{activeRun.summary.failed}</div><div className="stat-detail">retryable cases</div></div></div><div className="stat-card"><div><div className="stat-label">AVG LATENCY</div><div className="stat-value">{averageDuration}<span className="stat-unit">ms</span></div><div className="stat-detail">across completed checks</div></div></div></div>{aggregate && <div className="report-chart-grid"><div className="panel chart-panel report-chart"><div className="panel-heading"><div><h2>Results by method</h2><p>Passed and failed cases from the server aggregate</p></div></div><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={methodData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="key" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, fontSize: 11 }} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="passed" name="Passed" fill="var(--green)" radius={[3, 3, 0, 0]} /><Bar dataKey="failed" name="Failed" fill="var(--red)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel chart-panel report-chart"><div className="panel-heading"><div><h2>Results by tag</h2><p>Coverage distribution across operation groups</p></div></div><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={tagData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="key" width={62} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, fontSize: 11 }} /><Bar dataKey="passed" name="Passed" stackId="results" fill="var(--green)" /><Bar dataKey="failed" name="Failed" stackId="results" fill="var(--red)" /></BarChart></ResponsiveContainer></div></div></div>}<div className="panel results-panel"><div className="panel-heading"><div><h2>Test results</h2><p>{activeRun.runId}</p></div><button className="button ghost" disabled={retrying || activeRun.summary.failed === 0} onClick={() => void retry()}><RefreshCw size={15} />{retrying ? 'Retrying...' : 'Retry failed'}</button></div><div className="result-list">{activeRun.results.map((result) => <div className="result-row" key={result.testCaseId}><span className={`result-dot ${result.status}`} /><strong>{result.operationId}</strong><span>{result.actualStatus ?? '-'} / expected {result.expectedStatus}</span><small>{result.error ?? `${result.durationMs ?? 0} ms`}</small></div>)}</div></div>{aggregate && <div className="panel results-panel aggregate-panel"><div className="panel-heading"><div><h2>Aggregate by path</h2><p>Server-calculated report grouping</p></div></div>{aggregate.byPath.map((item) => <div className="result-row" key={item.key}><strong>{item.key}</strong><span>{item.passed} passed / {item.failed} failed</span><small>{item.total} total</small></div>)}</div>}</div>;
}

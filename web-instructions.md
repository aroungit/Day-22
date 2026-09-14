# Swagger AI Agent - Web Application Instructions

## Project Overview

Build a **modern, business analyst-focused web application** that enables non-technical users to:
- Upload and manage Swagger/OpenAPI specifications
- Configure test environments with authentication
- Execute API tests via MCP integration
- View interactive reports and analytics dashboards
- Generate test code and export results

**Target Users**: Business Analysts, QA Managers, Product Owners, Non-technical stakeholders

**Design Philosophy**: Clean, intuitive, mobile-friendly, accessible (WCAG 2.1 AA)

---

## Technology Stack

### Core Framework
- **Build Tool**: Vite 5.x (fast, modern, optimized)
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight, TypeScript-first)

### UI/UX Libraries
- **Component Library**: Shadcn/ui (TailwindCSS-based, accessible, customizable)
- **Styling**: TailwindCSS 3.x (mobile-first, utility-first)
- **Icons**: Lucide React (clean, modern icon set)
- **Animations**: Framer Motion (smooth transitions)

### Data & API
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form + Zod validation
- **Charts**: Recharts (responsive, mobile-friendly)
- **Code Display**: react-syntax-highlighter (syntax highlighting for JSON/YAML/code)

### Developer Tools
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel (CI/CD, preview URLs)

---

## Project Structure

```
web-app/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Root component with router
│   ├── config/
│   │   └── api.config.ts             # API base URL, timeout, environment
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts             # Axios instance with interceptors
│   │   │   ├── spec.api.ts           # Spec API calls
│   │   │   ├── environment.api.ts    # Environment API calls
│   │   │   ├── execution.api.ts      # Execution API calls
│   │   │   ├── testgen.api.ts        # Test generation API calls
│   │   │   ├── llm.api.ts            # LLM API calls
│   │   │   └── mcp.api.ts            # MCP API calls
│   │   ├── stores/
│   │   │   ├── spec.store.ts         # Spec state management
│   │   │   ├── environment.store.ts  # Environment state
│   │   │   ├── execution.store.ts    # Execution state
│   │   │   └── ui.store.ts           # UI state (loading, notifications)
│   │   └── utils/
│   │       ├── formatters.ts         # Date, duration, status formatters
│   │       ├── validators.ts         # Client-side validation helpers
│   │       └── constants.ts          # App constants (status colors, etc.)
│   │
│   ├── hooks/
│   │   ├── use-specs.ts              # Custom hooks for spec operations
│   │   ├── use-environments.ts       # Environment operations hooks
│   │   ├── use-execution.ts          # Execution hooks with polling
│   │   ├── use-toast.ts              # Toast notification hook
│   │   └── use-mobile.ts             # Mobile detection hook
│   │
│   ├── components/
│   │   ├── ui/                       # Shadcn/ui primitives (button, input, etc.)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx         # Main app shell with sidebar
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── Header.tsx            # Top header with breadcrumbs
│   │   │   └── MobileNav.tsx         # Bottom nav for mobile
│   │   ├── common/
│   │   │   ├── PageHeader.tsx        # Reusable page header with actions
│   │   │   ├── EmptyState.tsx        # Empty state with illustration
│   │   │   ├── ErrorBoundary.tsx     # Error boundary wrapper
│   │   │   ├── LoadingSpinner.tsx    # Loading indicator
│   │   │   ├── StatusBadge.tsx       # Status badge (passed/failed/error)
│   │   │   ├── MethodBadge.tsx       # HTTP method badge (GET/POST/etc.)
│   │   │   └── ConfirmDialog.tsx     # Confirmation modal
│   │   └── features/
│   │       ├── specs/
│   │       │   ├── SpecCard.tsx
│   │       │   ├── SpecList.tsx
│   │       │   ├── SpecUploadModal.tsx
│   │       │   ├── SpecDetailTabs.tsx
│   │       │   ├── OperationList.tsx
│   │       │   └── OperationCard.tsx
│   │       ├── environments/
│   │       │   ├── EnvironmentCard.tsx
│   │       │   ├── EnvironmentList.tsx
│   │       │   ├── EnvironmentForm.tsx
│   │       │   ├── AuthConfigSection.tsx
│   │       │   └── HeadersBuilder.tsx
│   │       ├── execution/
│   │       │   ├── TestPlanWizard.tsx
│   │       │   ├── ExecutionPanel.tsx
│   │       │   ├── LiveLogViewer.tsx
│   │       │   ├── TestResultCard.tsx
│   │       │   ├── TestResultList.tsx
│   │       │   └── RequestResponseViewer.tsx
│   │       ├── reports/
│   │       │   ├── DashboardKPIs.tsx
│   │       │   ├── SuccessRateChart.tsx
│   │       │   ├── MethodDistributionChart.tsx
│   │       │   ├── SlowestEndpointsChart.tsx
│   │       │   ├── RunHistoryTable.tsx
│   │       │   └── AggregatesView.tsx
│   │       └── testgen/
│   │           ├── TestGenForm.tsx
│   │           ├── CodeViewer.tsx
│   │           └── PayloadBuilderModal.tsx
│   │
│   ├── pages/
│   │   ├── HomePage.tsx              # Dashboard with KPIs and charts
│   │   ├── SpecsPage.tsx             # Spec library (list view)
│   │   ├── SpecDetailPage.tsx        # Single spec detail with tabs
│   │   ├── EnvironmentsPage.tsx      # Environment management
│   │   ├── ExecutionPage.tsx         # Test execution workflow
│   │   ├── RunReportPage.tsx         # Detailed run report
│   │   ├── ReportsPage.tsx           # Run history and analytics
│   │   ├── TestGenPage.tsx           # Test generation interface
│   │   └── SettingsPage.tsx          # User settings and preferences
│   │
│   └── types/
│       ├── spec.types.ts             # Spec DTOs and interfaces
│       ├── environment.types.ts      # Environment DTOs
│       ├── execution.types.ts        # Execution DTOs
│       ├── report.types.ts           # Report DTOs
│       └── api.types.ts              # Common API types
│
├── .env.development                   # Dev environment variables
├── .env.production                    # Prod environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Development Phases

### Phase 1: Project Setup & Core Infrastructure (Week 1)

**Objective**: Bootstrap project with all dependencies and base configuration.

**Tasks**:
1. Initialize Vite + React + TypeScript project
2. Install and configure TailwindCSS + Shadcn/ui
3. Set up folder structure (as defined above)
4. Configure API client with Axios interceptors
5. Set up Zustand stores (skeleton files)
6. Create base layout components (AppLayout, Sidebar, Header)
7. Configure routing with React Router v6
8. Add environment variable handling (.env files)
9. Set up ESLint + Prettier
10. Initialize Git repository and first commit

**Commands**:
```bash
# Create project
npm create vite@latest web-app -- --template react-ts
cd web-app

# Install dependencies
npm install
npm install react-router-dom zustand axios
npm install react-hook-form zod @hookform/resolvers
npm install recharts react-syntax-highlighter
npm install lucide-react framer-motion
npm install react-hot-toast react-dropzone

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/react-syntax-highlighter
npm install -D eslint prettier eslint-config-prettier

# Initialize Tailwind
npx tailwindcss init -p

# Add Shadcn/ui
npx shadcn-ui@latest init
```

**Configuration Files**:

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

**tailwind.config.js**:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--foreground))",
        },
        success: "#10b981",
        error: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**.env.development**:
```
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Swagger AI Agent
VITE_ENABLE_MOCK=false
```

**.env.production**:
```
VITE_API_BASE_URL=https://api.swagger-agent.com
VITE_APP_NAME=Swagger AI Agent
VITE_ENABLE_MOCK=false
```

**Deliverables**:
- ✅ Running Vite dev server on port 5173
- ✅ Basic layout with sidebar and header
- ✅ Routing configured (empty pages)
- ✅ API client setup with interceptors
- ✅ Zustand store skeletons
- ✅ TailwindCSS working with Shadcn/ui components

---

### Phase 2: Spec Management Module (Week 2)

**Objective**: Enable users to upload, view, and manage Swagger/OpenAPI specifications.

**Components to Build**:

1. **SpecsPage.tsx**
   - Grid layout of spec cards (3 cols desktop, 2 tablet, 1 mobile)
   - Search bar with debounced input
   - Filter dropdown (by tags, date range)
   - Sort dropdown (date, name, endpoints)
   - "Upload Spec" button (opens modal)
   - Empty state with illustration

2. **SpecCard.tsx**
   - Display: Title, version badge, endpoint count, upload date
   - Quick actions: View | Delete (with confirmation)
   - Click to navigate to detail page
   - Hover effect with shadow

3. **SpecUploadModal.tsx**
   - Tabs: Upload File | Enter URL | Git Repository
   - **Upload File Tab**:
     - Drag-and-drop zone (react-dropzone)
     - Accepts .yaml, .yml, .json
     - Shows file size and preview
   - **Enter URL Tab**:
     - URL input with validation
     - "Fetch" button
     - Loading state with spinner
   - **Git Repository Tab** (future):
     - Repo URL, branch/tag, file path inputs
   - Success: Close modal, show toast, navigate to spec detail

4. **SpecDetailPage.tsx**
   - Header: Title, version, servers, description
   - Action buttons: Edit | Delete | Export
   - Tabs component with 4 tabs:

5. **SpecDetailTabs.tsx**
   - **Operations Tab**: OperationList component
   - **Tags Tab**: Tag cloud with counts
   - **Environments Tab**: List of linked environments
   - **Raw Spec Tab**: Syntax-highlighted JSON/YAML

6. **OperationList.tsx**
   - Searchable table (method, path, summary)
   - Filters: Method (GET/POST/etc.), Tags
   - Columns: Method badge | Path | Summary | Tags | Actions
   - Actions: Execute | Generate Test
   - Mobile: Card layout instead of table

7. **OperationCard.tsx**
   - Display: Method, path, summary, tags
   - Expandable: Shows parameters, request/response schemas
   - Actions: Execute | View Details

**API Integration**:
- `POST /api/spec/import` - Upload spec
- `GET /api/spec/:specId` - Get spec details
- `GET /api/spec/:specId/operations` - List operations
- `GET /api/spec/:specId/tags` - Get tags
- `DELETE /api/spec/:specId` - Delete spec (add this endpoint if missing)

**Zustand Store** (src/lib/stores/spec.store.ts):
```typescript
interface SpecState {
  specs: NormalizedSpec[];
  currentSpec: NormalizedSpec | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSpecs: () => Promise<void>;
  fetchSpec: (id: string) => Promise<void>;
  uploadSpec: (source: SpecSource) => Promise<NormalizedSpec>;
  deleteSpec: (id: string) => Promise<void>;
  setCurrentSpec: (spec: NormalizedSpec | null) => void;
}
```

**Custom Hooks** (src/hooks/use-specs.ts):
```typescript
export function useSpecs() {
  const store = useSpecStore();
  
  useEffect(() => {
    store.fetchSpecs();
  }, []);
  
  return {
    specs: store.specs,
    loading: store.loading,
    error: store.error,
    uploadSpec: store.uploadSpec,
    deleteSpec: store.deleteSpec,
  };
}

export function useSpec(specId: string) {
  const store = useSpecStore();
  
  useEffect(() => {
    if (specId) {
      store.fetchSpec(specId);
    }
  }, [specId]);
  
  return {
    spec: store.currentSpec,
    loading: store.loading,
    error: store.error,
  };
}
```

**Deliverables**:
- ✅ Spec upload working (file + URL)
- ✅ Spec list page with search/filter/sort
- ✅ Spec detail page with tabs
- ✅ Operation list with filters
- ✅ Delete spec with confirmation
- ✅ Mobile-responsive design

---

### Phase 3: Environment Configuration Module (Week 3)

**Objective**: Enable users to create and manage test environments with authentication.

**Components to Build**:

1. **EnvironmentsPage.tsx**
   - Header with "Create Environment" button
   - Spec selector dropdown (filter environments by spec)
   - Environment cards/table (desktop: table, mobile: cards)
   - Actions: Edit | Duplicate | Delete

2. **EnvironmentCard.tsx**
   - Display: Name (colored badge), Base URL, Auth type badge
   - Spec name link
   - Quick actions dropdown

3. **EnvironmentForm.tsx** (used in modal/dialog)
   - Form sections (React Hook Form + Zod validation):
   
   **Section 1: Basic Info**
   - Spec selector (dropdown with search)
   - Name input (text)
   - Description textarea

   **Section 2: Connection**
   - Base URL input (validation: https required)
   - Test Connection button (ping /health endpoint)
   - Connection status indicator

   **Section 3: Authentication** (AuthConfigSection.tsx)
   - Auth type selector (dropdown):
     - None
     - Basic (username + password)
     - Bearer (token input)
     - API Key (header name + value)
     - OAuth2 (future: client ID, secret, token URL)
   - Conditional inputs based on selection
   - Password fields with show/hide toggle

   **Section 4: Default Headers** (HeadersBuilder.tsx)
   - Key-value pair builder
   - +/- buttons to add/remove rows
   - Common header suggestions dropdown (Accept, Content-Type, User-Agent)

4. **AuthConfigSection.tsx**
   - Reusable component for auth configuration
   - Type selector with icons
   - Conditional form fields
   - Validation: required fields per type

5. **HeadersBuilder.tsx**
   - Dynamic form array (React Hook Form useFieldArray)
   - Add/Remove buttons
   - Validation: no duplicate keys

**API Integration**:
- `POST /api/environment` - Create environment
- `GET /api/spec/:specId/environments` - List environments
- `GET /api/environment/:envId` - Get environment
- `PUT /api/environment/:envId` - Update environment
- `DELETE /api/environment/:envId` - Delete environment

**Zustand Store** (src/lib/stores/environment.store.ts):
```typescript
interface EnvironmentState {
  environments: EnvironmentConfig[];
  currentEnvironment: EnvironmentConfig | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchEnvironments: (specId?: string) => Promise<void>;
  fetchEnvironment: (envId: string) => Promise<void>;
  createEnvironment: (data: CreateEnvironmentInput) => Promise<EnvironmentConfig>;
  updateEnvironment: (envId: string, data: UpdateEnvironmentInput) => Promise<void>;
  deleteEnvironment: (envId: string) => Promise<void>;
}
```

**Form Validation** (Zod schema):
```typescript
const environmentSchema = z.object({
  specId: z.string().min(1, "Spec is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  baseUrl: z.string().url("Must be a valid URL").startsWith("https://", "Must use HTTPS"),
  description: z.string().optional(),
  authConfig: z.object({
    type: z.enum(["none", "basic", "bearer", "apiKey", "oauth2"]),
    credentials: z.record(z.any()).optional(),
  }).optional(),
  defaultHeaders: z.record(z.string()).optional(),
});
```

**Deliverables**:
- ✅ Create/Edit environment form with validation
- ✅ Environment list with filtering
- ✅ Auth config with conditional inputs
- ✅ Headers builder with add/remove
- ✅ Test connection functionality
- ✅ CRUD operations working
- ✅ Mobile-friendly form layout

---

### Phase 4: Test Execution Workflow (Week 4-5)

**Objective**: Enable users to plan and execute API tests with real-time progress tracking.

**Components to Build**:

1. **ExecutionPage.tsx**
   - Two-panel layout (60/40 split on desktop, stacked on mobile)
   - Left panel: TestPlanWizard
   - Right panel: ExecutionPanel (shows current/recent runs)

2. **TestPlanWizard.tsx** (multi-step form)
   - Stepper component (5 steps)
   - Navigation: Previous/Next buttons, step indicators
   
   **Step 1: Select Spec**
   - Dropdown with search
   - Shows spec title + version + operation count
   
   **Step 2: Choose Environment**
   - Radio button cards (large, with icons)
   - Shows: Name, base URL, auth type
   - Color-coded badges (dev=blue, qa=yellow, prod=red)
   
   **Step 3: Pick Operations**
   - Tab switcher: By Tag | By Endpoint | Run All
   - **By Tag Tab**: Multi-select chips (e.g., "Users", "Orders")
   - **By Endpoint Tab**: Searchable checklist with "Select All"
   - **Run All Tab**: One-click (auto-selects all ops)
   - Selected count display: "5 operations selected"
   
   **Step 4: Configure Options** (expandable)
   - Timeout input (seconds, default 30)
   - Retry count (0-3, default 0)
   - Checkboxes:
     - Include negative tests
     - Include auth tests
     - Include boundary tests
   
   **Step 5: Review & Run**
   - Summary card:
     - Spec: {name}
     - Environment: {name}
     - Operations: {count}
     - Estimated duration: {calculated}
   - Large "Run Tests" button (primary color, loading state)

3. **ExecutionPanel.tsx**
   - Header: Run ID, status badge, timestamps
   - Real-time progress bar (animated)
   - Live log viewer (terminal-style, auto-scroll)
   - Test results list (updates as tests complete)
   - Summary cards: Total | Passed | Failed | Errors | Duration
   - Actions:
     - Abort Run button (shows while running)
     - View Full Report button (after completion)
     - Retry Failed button (if failures exist)
     - Export Report button (JSON/CSV)

4. **LiveLogViewer.tsx**
   - Terminal-style log display
   - Auto-scroll to bottom (with "pause auto-scroll" button)
   - Log entries with timestamps and colored icons:
     ```
     [12:45:01] ⏳ Executing POST /api/orders...
     [12:45:02] ✅ POST /api/orders - 201 Created (342ms)
     [12:45:03] ⏳ Executing GET /api/orders/123...
     [12:45:04] ❌ GET /api/orders/123 - 404 Not Found (156ms)
     ```
   - Copy log button

5. **TestResultList.tsx**
   - Filterable list (All | Passed | Failed | Errors)
   - Sortable by: Status | Duration | Operation
   - Each row: TestResultCard component

6. **TestResultCard.tsx**
   - Compact view: Operation ID | Method badge | Status badge | Duration
   - Expandable: Click to show request/response details
   - Expanded view:
     - Request section: URL, method, headers, params, body (formatted JSON)
     - Response section: Status, headers, body (formatted JSON)
     - Retry button (for failed tests)

7. **RequestResponseViewer.tsx**
   - Tabbed view: Request | Response
   - Syntax-highlighted JSON
   - Copy to clipboard button
   - Collapsible sections (headers, body)

**API Integration**:
- `POST /api/execution/plan` - Create run plan
- `POST /api/execution/run` - Execute run (plan+run or by runId)
- `GET /api/execution/status/:runId` - Get run status (polling)
- `POST /api/execution/retry-failed` - Retry failed tests

**Real-Time Updates** (polling strategy):
```typescript
// src/hooks/use-execution.ts
export function useExecution(runId: string | null) {
  const [status, setStatus] = useState<RunReport | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  useEffect(() => {
    if (!runId) return;
    
    let intervalId: NodeJS.Timeout;
    
    async function poll() {
      try {
        const report = await executionApi.getStatus(runId);
        setStatus(report);
        
        // Stop polling if run is complete
        if (report.finishedAt) {
          setIsPolling(false);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }
    
    setIsPolling(true);
    poll(); // Initial fetch
    intervalId = setInterval(poll, 2000); // Poll every 2 seconds
    
    return () => clearInterval(intervalId);
  }, [runId]);
  
  return { status, isPolling };
}
```

**Deliverables**:
- ✅ Multi-step wizard with validation
- ✅ Operation selection (tag/endpoint/all modes)
- ✅ Real-time execution progress
- ✅ Live log viewer with auto-scroll
- ✅ Test result cards with expand/collapse
- ✅ Request/response viewer with syntax highlighting
- ✅ Retry failed tests functionality
- ✅ Responsive design (wizard steps stack on mobile)

---

### Phase 5: Reports & Analytics Dashboard (Week 6)

**Objective**: Provide visual insights and analytics on test execution history.

**Components to Build**:

1. **HomePage.tsx** (Dashboard)
   - Header: Welcome message, date range selector
   - KPI row: 4 cards (DashboardKPIs.tsx)
   - Charts section: 3 charts in responsive grid
   - Recent runs section: RunHistoryTable (last 5 runs)

2. **DashboardKPIs.tsx**
   - 4 cards in responsive grid:
     - Total Specs (with icon)
     - Total Environments (with icon)
     - Total Runs (this month)
     - Average Success Rate % (with trend indicator)
   - Cards use color gradients and icons

3. **SuccessRateChart.tsx**
   - Line chart (Recharts)
   - X-axis: Date (last 7/30/90 days, user-selectable)
   - Y-axis: Success rate %
   - Two lines: Passed rate (green), Failed rate (red)
   - Responsive: Height adjusts on mobile
   - Tooltip with formatted data

4. **MethodDistributionChart.tsx**
   - Donut chart (Recharts PieChart)
   - Shows test distribution by HTTP method
   - Colors: GET=blue, POST=green, PUT=yellow, DELETE=red, PATCH=purple
   - Center text: Total count
   - Legend at bottom (horizontal on desktop, vertical on mobile)

5. **SlowestEndpointsChart.tsx**
   - Horizontal bar chart (Recharts BarChart)
   - Top 10 slowest endpoints by average duration
   - X-axis: Duration (ms)
   - Y-axis: Endpoint path (truncated if long)
   - Color gradient based on duration (green < 500ms, yellow < 2000ms, red > 2000ms)

6. **ReportsPage.tsx**
   - Header with "Export All" button
   - Filters panel: Date range, Spec, Environment, Status
   - RunHistoryTable with pagination

7. **RunHistoryTable.tsx**
   - Columns: Date | Spec | Environment | Total | Passed | Failed | Duration | Actions
   - Sortable columns
   - Status badges with colors
   - Actions dropdown: View Report | Retry | Export | Delete
   - Click row to navigate to RunReportPage
   - Mobile: Card layout instead of table

8. **RunReportPage.tsx**
   - Header: Run ID, spec, environment, timestamps, duration
   - Summary cards: Total | Passed | Failed | Errors | Success Rate
   - Tabs: Test Results | Aggregates | Timeline
   
   **Test Results Tab**:
   - TestResultList component (filterable, sortable, paginated)
   
   **Aggregates Tab**:
   - AggregatesView component
   
   **Timeline Tab**:
   - Visual timeline (Gantt-style) showing when each test executed
   - Interactive: Click test to see details

9. **AggregatesView.tsx**
   - Tabs: By Tag | By Method | By Path
   - Each tab shows a table:
     - Columns: Name | Total | Passed | Failed | Errors | Success Rate
     - Color-coded success rate (green > 90%, yellow > 70%, red ≤ 70%)
   - Export button for each view

**API Integration**:
- `GET /api/execution/status/:runId` - Get full run report
- Add new endpoint: `GET /api/execution/runs` - List all runs with filters (pagination, sort, filter by spec/env/status)

**Chart Configuration** (Recharts):
```typescript
// Example: SuccessRateChart
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="passRate" stroke="#10b981" name="Passed %" />
    <Line type="monotone" dataKey="failRate" stroke="#ef4444" name="Failed %" />
  </LineChart>
</ResponsiveContainer>
```

**Export Functionality**:
```typescript
// src/lib/utils/export.ts
export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

export function exportToCSV(data: any[], filename: string) {
  // Convert array of objects to CSV
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(',')),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
```

**Deliverables**:
- ✅ Dashboard with KPIs and charts
- ✅ Run history table with filters
- ✅ Detailed run report page
- ✅ Aggregates view (by tag/method/path)
- ✅ Export to JSON/CSV functionality
- ✅ Responsive charts (mobile-friendly)
- ✅ Interactive tooltips and legends

---

### Phase 6: Test Generation & AI Features (Week 7)

**Objective**: Enable AI-powered test code generation and smart payload building.

**Components to Build**:

1. **TestGenPage.tsx**
   - Two-panel layout (50/50 split)
   - Left panel: TestGenForm
   - Right panel: CodeViewer

2. **TestGenForm.tsx**
   - Form sections:
   
   **Section 1: Spec Selection**
   - Spec dropdown with search
   - Operation selection mode: By Tag | By Endpoint | All
   - Conditional inputs (tags or endpoints)
   
   **Section 2: Options**
   - Checkboxes:
     - Include negative tests
     - Include auth tests
     - Include boundary tests
     - Include validation tests
   - Framework selector (Jest+Axios is default, future: Mocha, etc.)
   
   **Section 3: Generate**
   - Large "Generate Tests" button
   - Loading state with progress message

3. **CodeViewer.tsx**
   - Tabbed interface (if multiple files generated)
   - Syntax highlighter (react-syntax-highlighter)
   - Language: JavaScript/TypeScript
   - Theme: VS Code Dark (or user-selected)
   - Toolbar:
     - Copy to clipboard button
     - Download as file button (.test.js)
     - Language selector (JS/TS toggle)
   - Line numbers
   - Collapsible sections (describe blocks)

4. **PayloadBuilderModal.tsx** (accessed from operation cards)
   - Triggered from "Generate Payload" button on operation
   - Form:
   
   **Section 1: Operation Info**
   - Display: Method, path, summary (read-only)
   
   **Section 2: Mode Selection**
   - Radio buttons:
     - Schema-only (use examples from spec)
     - Schema + LLM (AI-enhanced)
   
   **Section 3: Hints** (if LLM mode selected)
   - Locale input (e.g., "US", "IN", "FR")
   - Domain input (e.g., "banking", "e-commerce", "healthcare")
   - Additional context textarea
   
   **Section 4: Generated Payload**
   - JSON editor (editable)
   - Format/Validate buttons
   - "Use This Payload" button (injects into test override)

**API Integration**:
- `POST /api/testgen/generate-axios-tests` - Generate test code
- `POST /api/llm/build-payload` - Generate sample payload

**Syntax Highlighting**:
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

<SyntaxHighlighter 
  language="javascript" 
  style={vscDarkPlus}
  showLineNumbers
  customStyle={{ borderRadius: '8px', fontSize: '14px' }}
>
  {generatedCode}
</SyntaxHighlighter>
```

**Copy to Clipboard**:
```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch (err) {
    toast.error('Failed to copy');
  }
}
```

**Deliverables**:
- ✅ Test generation form with options
- ✅ Code viewer with syntax highlighting
- ✅ Copy to clipboard functionality
- ✅ Download generated code as file
- ✅ Payload builder modal with LLM integration
- ✅ JSON editor for payload editing
- ✅ Integration with execution workflow

---

### Phase 7: Mobile Optimization & Polish (Week 8)

**Objective**: Ensure excellent mobile UX and add final polish touches.

**Tasks**:

1. **Mobile Navigation**
   - Create MobileNav.tsx component (bottom tab bar)
   - Icons: Home | Specs | Execute | Reports | Settings
   - Active tab indicator (color + icon fill)
   - Fixed position at bottom (safe area aware)

2. **Responsive Layouts**
   - **Spec cards**: 1 column on mobile, 2 on tablet, 3 on desktop
   - **Tables**: Convert to card layout on mobile (< 768px)
   - **Forms**: Stack fields vertically on mobile, 2 columns on desktop
   - **Charts**: Adjust height and legend position for mobile
   - **Wizard**: Show current step only on mobile, hide stepper on small screens

3. **Touch Interactions**
   - Swipe gestures:
     - Swipe left on environment card → Show delete confirmation
     - Swipe right on run history row → Quick retry
   - Pull-to-refresh on list pages (specs, environments, runs)
   - Long-press on spec card → Show context menu

4. **Performance Optimizations**
   - Lazy load pages with React.lazy + Suspense
   - Virtualize long lists (react-window for 100+ items)
   - Debounce search inputs (500ms)
   - Memoize expensive computations (useMemo)
   - Optimize images (lazy loading, WebP format)
   - Code splitting (split chunks by route)

5. **Accessibility (WCAG 2.1 AA)**
   - Keyboard navigation: Tab order, focus indicators
   - ARIA labels on all interactive elements
   - Screen reader announcements (aria-live regions)
   - Color contrast ≥ 4.5:1 (use contrast checker)
   - Focus trap in modals
   - Skip to content link

6. **Loading States**
   - Skeleton loaders for cards, tables, charts
   - Spinner for button actions (with "Loading..." text)
   - Progress bars for long operations
   - Optimistic UI updates (show success immediately, rollback on error)

7. **Error Handling**
   - Toast notifications for errors (react-hot-toast)
   - Inline form validation errors
   - Error boundary with fallback UI
   - Retry buttons on failed API calls
   - Offline detection with banner

8. **Dark Mode**
   - Toggle in Settings page
   - Persist preference in localStorage
   - Use Tailwind dark: classes
   - Update charts color schemes for dark mode

9. **User Preferences** (SettingsPage.tsx)
   - Theme toggle (Light/Dark/System)
   - Timezone selector
   - Date format (MM/DD/YYYY or DD/MM/YYYY)
   - Default timeout value
   - Notifications preferences (email, in-app)

10. **Animations**
    - Page transitions (fade in/out)
    - Modal enter/exit animations
    - List item stagger (animate items on mount)
    - Skeleton shimmer effect
    - Button hover/active states
    - Progress bar animations

**Mobile-First CSS Example**:
```css
/* Start with mobile styles, then add desktop */
.spec-grid {
  @apply grid grid-cols-1 gap-4;
}

@media (min-width: 768px) {
  .spec-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .spec-grid {
    @apply grid-cols-3;
  }
}
```

**Lazy Loading**:
```typescript
const HomePage = lazy(() => import('./pages/HomePage'));
const SpecsPage = lazy(() => import('./pages/SpecsPage'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/specs" element={<SpecsPage />} />
  </Routes>
</Suspense>
```

**Deliverables**:
- ✅ Mobile bottom navigation
- ✅ Responsive layouts (all pages)
- ✅ Touch gestures (swipe, pull-to-refresh)
- ✅ Performance optimizations (lazy loading, memoization)
- ✅ Accessibility features (keyboard nav, ARIA labels)
- ✅ Loading states and skeleton loaders
- ✅ Error handling with toasts
- ✅ Dark mode implementation
- ✅ User preferences page
- ✅ Smooth animations and transitions

---

## Design System Guidelines

### Color Palette

**Primary Colors** (for actions, links):
- Primary: `#3b82f6` (blue)
- Primary Hover: `#2563eb`

**Status Colors**:
- Success: `#10b981` (green)
- Error: `#ef4444` (red)
- Warning: `#f59e0b` (amber)
- Info: `#3b82f6` (blue)

**Method Colors**:
- GET: `#10b981` (green)
- POST: `#3b82f6` (blue)
- PUT: `#f59e0b` (amber)
- DELETE: `#ef4444` (red)
- PATCH: `#8b5cf6` (purple)

**Environment Colors**:
- Dev: `#3b82f6` (blue)
- QA/Staging: `#f59e0b` (amber)
- Production: `#ef4444` (red)

### Typography

**Font Family**: `Inter` (modern, readable, web-safe)

**Font Sizes**:
- Heading 1: `text-4xl` (36px)
- Heading 2: `text-3xl` (30px)
- Heading 3: `text-2xl` (24px)
- Body: `text-base` (16px)
- Small: `text-sm` (14px)
- Extra Small: `text-xs` (12px)

**Font Weights**:
- Regular: `font-normal` (400)
- Medium: `font-medium` (500)
- Semibold: `font-semibold` (600)
- Bold: `font-bold` (700)

### Spacing

**Consistent spacing scale** (Tailwind):
- XS: `p-2` (8px)
- SM: `p-4` (16px)
- MD: `p-6` (24px)
- LG: `p-8` (32px)
- XL: `p-10` (40px)

### Component Guidelines

**Buttons**:
- Primary: Blue background, white text, hover state
- Secondary: Gray background, dark text, hover state
- Danger: Red background, white text, hover state
- Icon buttons: 44x44px minimum (touch-friendly)

**Cards**:
- Border: `border border-gray-200`
- Shadow: `shadow-sm hover:shadow-md` (lift on hover)
- Radius: `rounded-lg` (8px)
- Padding: `p-6` (24px)

**Badges**:
- Small: `px-2 py-1 text-xs`
- Medium: `px-3 py-1.5 text-sm`
- Rounded: `rounded-full`

**Modals**:
- Overlay: Semi-transparent dark background
- Content: White card, centered, max-width 600px
- Close button: Top-right corner
- Scrollable content if tall

---

## API Client Implementation

**src/lib/api/client.ts**:
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.error?.message || 'An error occurred';
      
      switch (status) {
        case 400:
          toast.error(`Validation error: ${message}`);
          break;
        case 401:
          toast.error('Unauthorized. Please log in.');
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 404:
          toast.error(`Not found: ${message}`);
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

**src/lib/api/spec.api.ts**:
```typescript
import apiClient from './client';
import { NormalizedSpec, SpecSource, Operation } from '@/types/spec.types';

export const specApi = {
  // Import spec
  async importSpec(source: SpecSource): Promise<NormalizedSpec> {
    const response = await apiClient.post('/spec/import', { source });
    return response.data;
  },
  
  // Get spec details
  async getSpec(specId: string): Promise<NormalizedSpec> {
    const response = await apiClient.get(`/spec/${specId}`);
    return response.data;
  },
  
  // List operations
  async getOperations(specId: string): Promise<Operation[]> {
    const response = await apiClient.get(`/spec/${specId}/operations`);
    return response.data;
  },
  
  // Get tags
  async getTags(specId: string): Promise<string[]> {
    const response = await apiClient.get(`/spec/${specId}/tags`);
    return response.data;
  },
  
  // Delete spec (add this endpoint to backend if missing)
  async deleteSpec(specId: string): Promise<void> {
    await apiClient.delete(`/spec/${specId}`);
  },
};
```

---

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Test files**: `ComponentName.test.tsx`

**Example test**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpecCard } from './SpecCard';

describe('SpecCard', () => {
  const mockSpec = {
    id: 'spec-123',
    title: 'Petstore API',
    version: '1.0.0',
    operations: [/* ... */],
    createdAt: '2025-01-01T00:00:00Z',
  };
  
  it('renders spec information', () => {
    render(<SpecCard spec={mockSpec} />);
    expect(screen.getByText('Petstore API')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });
  
  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<SpecCard spec={mockSpec} onDelete={onDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith(mockSpec.id);
  });
});
```

### E2E Tests (Playwright - optional)

**Test critical user flows**:
1. Upload spec → View operations → Create environment → Execute run → View report

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url"
  }
}
```

### Build Command:
```bash
npm run build
```

### Preview Build Locally:
```bash
npm run preview
```

---

## Final Checklist

Before considering the web app complete, verify:

- [ ] All pages render correctly on mobile (375px width)
- [ ] All forms have validation with clear error messages
- [ ] All API calls have loading states and error handling
- [ ] Toast notifications appear for all user actions
- [ ] Dark mode works on all pages
- [ ] Keyboard navigation works (tab order, focus states)
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Color contrast meets WCAG AA standards
- [ ] All charts are responsive and readable on mobile
- [ ] Search and filters work correctly
- [ ] Pagination works on long lists
- [ ] Export functionality (JSON/CSV) works
- [ ] Real-time polling updates execution status
- [ ] Code syntax highlighting works
- [ ] Copy to clipboard functionality works
- [ ] Performance: Page load < 2s, TTI < 3s
- [ ] No console errors in production build
- [ ] PWA manifest configured (optional)
- [ ] Favicon and meta tags set correctly

---

## Resources

### Documentation
- [React 18 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Hook Form](https://react-hook-form.com/get-started)
- [Recharts Examples](https://recharts.org/en-US/examples)

### Design Inspiration
- [Postman](https://postman.com) - API testing UX
- [Linear](https://linear.app) - Clean, modern UI
- [Vercel Dashboard](https://vercel.com) - Analytics and dashboards
- [Stripe Dashboard](https://stripe.com) - Data visualization

### Assets
- [Lucide Icons](https://lucide.dev/icons) - Icon library
- [Undraw](https://undraw.co) - Illustrations for empty states
- [Heroicons](https://heroicons.com) - Alternative icons

---

## Development Workflow

1. **Feature Branch**: Create branch from main (e.g., `feature/spec-management`)
2. **Implement**: Build components, add tests
3. **Test**: Run unit tests, test in browser (mobile + desktop)
4. **Review**: Self-review code, check accessibility
5. **Commit**: Descriptive commit messages (e.g., "feat: add spec upload modal")
6. **Push**: Push to remote, create pull request
7. **Deploy**: Merge to main, auto-deploy to Vercel

---

## Success Metrics

Track these metrics to measure success:

- **Performance**: Page load time < 2s, Lighthouse score > 90
- **Usability**: Task completion rate > 90%, Time to upload spec < 30s
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation works
- **Mobile**: 60%+ of users can complete flows on mobile
- **Adoption**: Business analysts use web app instead of Postman for API testing

---

**End of Web Instructions**

This document provides a complete blueprint for building the Swagger AI Agent web application. Follow the phases sequentially, and refer to the design system and API client examples for consistency across the codebase.

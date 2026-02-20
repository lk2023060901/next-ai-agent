# M3 W14: Dashboard + Usage Implementation Design

## Overview

Implement the organization dashboard (`/org/[slug]/dashboard`) and usage statistics page (`/org/[slug]/usage`) per the design spec in `docs/06-dashboard/dashboard.md`.

## Dashboard Page

### Layout

- Greeting header with user name + date
- 4 stat cards (4-col grid, equal width)
- Charts row: message trend area chart (8/12) + agent workload donut (4/12)
- Bottom row: activity timeline (8/12) + quick actions (4/12)

### Components

| Component          | File                                                     | Description                                                    |
| ------------------ | -------------------------------------------------------- | -------------------------------------------------------------- |
| StatCard           | `components/features/dashboard/stat-card.tsx`            | Icon, value, trend %, 7-day sparkline (40px)                   |
| MessageTrendChart  | `components/features/dashboard/message-trend-chart.tsx`  | 7-day area chart, inbound/outbound dual series, 280px          |
| AgentWorkloadChart | `components/features/dashboard/agent-workload-chart.tsx` | Donut chart with center label, agent role colors, 2-col legend |
| ActivityTimeline   | `components/features/dashboard/activity-timeline.tsx`    | Time-sorted activity list with type filter dropdown            |
| QuickActions       | `components/features/dashboard/quick-actions.tsx`        | 4 action cards linking to chat/knowledge/agents/members        |

### Stat Cards Data

| Card             | Icon          | Color                        | Sparkline |
| ---------------- | ------------- | ---------------------------- | --------- |
| Active Agents    | Bot           | agent-architecture (#006fee) | Line      |
| Today's Sessions | MessageSquare | primary-500 (#173f78)        | Bar       |
| Token Usage      | Zap           | warning (#f5a524)            | Area      |
| Completed Tasks  | CheckSquare   | success (#17c964)            | Line      |

## Usage Page

### Layout

- Filter bar: date range, workspace select, agent select, CSV export button
- 4 overview stat cards (same StatCard component)
- Charts: token trend stacked bar (8/12) + provider pie (4/12)
- Agent usage horizontal bar chart (full width)
- Detail table: 9 columns, sortable, 100/page pagination

### Components

| Component        | File                                               | Description                                          |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------- |
| UsageFilterBar   | `components/features/usage/usage-filter-bar.tsx`   | Date range + workspace + agent selects + CSV export  |
| TokenTrendChart  | `components/features/usage/token-trend-chart.tsx`  | Stacked bar chart (input/output tokens), 300px       |
| ProviderPieChart | `components/features/usage/provider-pie-chart.tsx` | Pie chart by provider with brand colors              |
| AgentUsageBar    | `components/features/usage/agent-usage-bar.tsx`    | Horizontal bar chart, agent role colors, auto height |
| UsageDetailTable | `components/features/usage/usage-detail-table.tsx` | Sortable table, 100/page, 9 columns                  |

## Data Layer

### Types (in `types/api.ts`)

- `DashboardStats`: activeAgents, todaySessions, tokenUsage, completedTasks (each with value, trend, sparkline[])
- `DailyMessageStats`: date, inbound, outbound
- `AgentWorkload`: agentId, agentName, role, taskCount
- `ActivityEvent`: id, type, title, description, timestamp, actorName, actorAvatar
- `UsageOverview`: totalTokens, apiCalls, avgResponseTime, estimatedCost (each with value, trend)
- `DailyTokenUsage`: date, inputTokens, outputTokens
- `ProviderUsage`: provider, tokens, percentage
- `AgentUsageRank`: agentId, agentName, role, tokens
- `UsageRecord`: id, timestamp, agentId, agentName, agentRole, provider, model, inputTokens, outputTokens, duration, cost, success

### API

- `dashboardApi.getStats(orgId)` → `DashboardStats`
- `dashboardApi.getMessageTrend(orgId)` → `DailyMessageStats[]`
- `dashboardApi.getWorkload(orgId)` → `AgentWorkload[]`
- `dashboardApi.getActivities(orgId)` → `ActivityEvent[]`
- `usageApi.getOverview(orgId, filters)` → `UsageOverview`
- `usageApi.getTokenTrend(orgId, filters)` → `DailyTokenUsage[]`
- `usageApi.getProviders(orgId, filters)` → `ProviderUsage[]`
- `usageApi.getAgentRanking(orgId, filters)` → `AgentUsageRank[]`
- `usageApi.getRecords(orgId, filters)` → `PaginatedResponse<UsageRecord>`

### Mock Factories

- `dashboard.factory.ts`: generates 7-day time series, activity events, agent workloads
- `usage.factory.ts`: generates 30-day token trends, provider distribution, agent rankings, 200+ usage records

### Hooks

- `use-dashboard.ts`: 4 TanStack Query hooks (stats, trend, workload, activities)
- `use-usage.ts`: 5 TanStack Query hooks (overview, tokenTrend, providers, agentRanking, records)

## Recharts Conventions

- Color constants in `lib/constants/chart.ts` — hex values matching CSS variables
- `ResponsiveContainer` wrapper on all charts
- Unified custom tooltip component
- Sparklines: no axes, no tooltip, height 40px
- Agent role colors from existing `--color-agent-*` tokens

## Navigation

- Sidebar: already has dashboard link at `/org/${orgSlug}/dashboard`
- Breadcrumb: already has `dashboard: '概览'` label
- Add `usage: '用量统计'` to breadcrumb labels

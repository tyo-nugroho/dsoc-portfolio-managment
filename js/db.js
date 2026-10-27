// =========================================================================
// MOCK DATABASE & BACKEND INTEGRATION CONFIG
// Sumber angka: ITSM_Operations_Dashboard.pdf & Portfolio Management docs
// =========================================================================

const CONFIG = {
    USE_MOCK: true,
    API_BASE_URL: '/api/v1'
};

// Data Simulasi (in-memory, direset saat full page reload)
const mockDatabase = {

    // ============== 1. EXECUTIVE DASHBOARD ==============
    dashboard: {
        lastUpdated: '31 Mei 2024 23:59 WIB',
        filters: { from: '2024-05-01', to: '2024-05-31', project: 'all' },
        projects: [
            { code: 'all', name: 'Semua Layanan' },
            { code: 'PRJ-01', name: 'INA Digital Health' },
            { code: 'PRJ-02', name: 'INAGov Central' },
            { code: 'PRJ-03', name: 'PERURI Core' }
        ],
        kpi: {
            uptime:   { label: 'Service Uptime', value: 99.92, decimals: 2, unit: '%', target: 'Target ≥ 99,90%', status: 'Sangat Baik', statusColor: 'success', delta: '▲ 0,12%', deltaGood: true, trend: [99.70, 99.75, 99.80, 99.85, 99.92] },
            sla:      { label: 'SLA Compliance', value: 97.45, decimals: 2, unit: '%', target: 'Target ≥ 95,00%', status: 'Sangat Baik', statusColor: 'success', delta: '▲ 1,35%', deltaGood: true, trend: [92.10, 93.20, 94.10, 96.30, 97.45] },
            openInc:  { label: 'Open Incident', value: 8, decimals: 0, unit: '', target: 'vs periode lalu', status: 'Perlu Perhatian', statusColor: 'warning', delta: '▼ 3', deltaGood: true, trend: [15, 13, 11, 10, 8] },
            mttr:     { label: 'Average MTTR', value: 1.45, decimals: 2, unit: ' jam', target: 'Target ≤ 2,00 jam', status: 'Sangat Baik', statusColor: 'success', delta: '▼ 0,35 jam', deltaGood: true, trend: [2.20, 2.05, 1.85, 1.60, 1.45] },
            csat:     { label: 'Customer Satisfaction', value: 94.10, decimals: 2, unit: '%', target: 'Target ≥ 90,00%', status: 'Sangat Baik', statusColor: 'success', delta: '▲ 2,10%', deltaGood: true, trend: [88.20, 89.10, 90.50, 92.00, 94.10] }
        },
        trendLabels: ['2 Mei', '7 Mei', '12 Mei', '22 Mei', '31 Mei'],
        trendSeries: {
            uptime: [99.70, 99.75, 99.80, 99.85, 99.92],
            sla: [92.10, 93.20, 94.10, 96.30, 97.45],
            csat: [88.20, 89.10, 90.50, 92.00, 94.10],
            openIncident: [15, 13, 11, 10, 8],
            mttr: [2.20, 2.05, 1.85, 1.60, 1.45]
        },
        incidentDistribution: [
            { label: 'Critical', value: 3, pct: 14.3, color: '#ef4444' },
            { label: 'High', value: 5, pct: 23.8, color: '#f59e0b' },
            { label: 'Medium', value: 7, pct: 33.3, color: '#eab308' },
            { label: 'Low', value: 4, pct: 19.0, color: '#3b82f6' },
            { label: 'Informational', value: 2, pct: 9.5, color: '#94a3b8' }
        ],
        incidentTotal: 21,
        activeProjects: [
            { id: 'PRJ-01', name: 'INA Digital Health', status: 'On Track', sla: 99.8 },
            { id: 'PRJ-02', name: 'INAGov Central', status: 'At Risk', sla: 94.2 },
            { id: 'PRJ-03', name: 'PERURI Core', status: 'On Track', sla: 99.6 }
        ]
    },

    // ============== 2. PERFORMANCE & AVAILABILITY (Service Uptime + SLA Compliance) ==============
    performance: {
        overallStatus: 'SANGAT BAIK',
        uptimeOverall: 99.82,
        uptimeDelta: 0.35,
        totalServices: 18,
        normalCount: 17, normalPct: 94.44,
        warningCount: 1, warningPct: 5.56,
        downCount: 0, downPct: 0,
        trend: { labels: ['13 Jun', '17 Jun', '21 Jun', '25 Jun', '29 Jun', '3 Jul', '7 Jul', '12 Jul'], data: [99.75, 99.80, 99.78, 99.85, 99.80, 99.83, 99.79, 99.82] },
        topInfra: [
            { name: 'Core Network', uptime: 100 },
            { name: 'Data Center Jakarta', uptime: 99.99 },
            { name: 'Internet Gateway', uptime: 99.95 },
            { name: 'DR Site', uptime: 99.92 },
            { name: 'VPN Gateway', uptime: 99.90 }
        ],
        criticalServices: [
            { name: 'VPN Corporate', category: 'Jaringan', status: 'Normal', uptime: 100, response: 15, updated: '12 Jul 2026 10:30:21' },
            { name: 'Aplikasi e-Meterai', category: 'Aplikasi', status: 'Normal', uptime: 99.96, response: 250, updated: '12 Jul 2026 10:30:18' },
            { name: 'API e-Meterai', category: 'Aplikasi', status: 'Normal', uptime: 99.93, response: 180, updated: '12 Jul 2026 10:30:16' },
            { name: 'Database Utama', category: 'Server', status: 'Normal', uptime: 99.99, response: 10, updated: '12 Jul 2026 10:30:10' },
            { name: 'Web Portal', category: 'Aplikasi', status: 'Peringatan', uptime: 99.45, response: 560, updated: '12 Jul 2026 10:30:05' },
            { name: 'Mail Server', category: 'Server', status: 'Normal', uptime: 99.97, response: 120, updated: '12 Jul 2026 10:29:58' }
        ],
        alerts: [
            { title: 'Web Portal - Response Time Tinggi', level: 'Peringatan', detail: 'Response time melebihi ambang batas (500ms)', time: '12 Jul 2026 10:28:15' }
        ],
        alertCounts: { kritis: 0, peringatan: 1, info: 0 }
    },

    sla: {
        period: '10 Agu 2025 - 10 Agu 2025',
        totalLayanan: 6,
        uptimeToday: 99.95, uptimeTarget: 99.90, uptimeMet: true,
        resolutionToday: 99.21, resolutionTarget: 99.90, resolutionMet: false,
        incidentToday: { total: 2, critical: 0, major: 2 },
        downtimeToday: '22 Menit 15 Detik',
        uptimeTrend: { labels: ['4 Agu', '5 Agu', '6 Agu', '7 Agu', '8 Agu', '9 Agu', '10 Agu'], data: [99.92, 99.94, 99.91, 99.96, 99.93, 99.95, 99.95] },
        resolutionTrend: { labels: ['4 Agu', '5 Agu', '6 Agu', '7 Agu', '8 Agu', '9 Agu', '10 Agu'], data: [99.32, 99.45, 99.38, 99.62, 99.29, 99.18, 99.21] },
        serviceSummary: [
            { name: 'Portal Pelanggan', uptime: 99.98, uptimeMet: true, resolution: 99.70, resolutionMet: false, downtime: '2m 15d' },
            { name: 'API Integration', uptime: 99.96, uptimeMet: true, resolution: 99.45, resolutionMet: false, downtime: '6m 40d' },
            { name: 'Aplikasi Mobile', uptime: 99.93, uptimeMet: true, resolution: 99.80, resolutionMet: false, downtime: '8m 10d' },
            { name: 'E-Document Service', uptime: 99.99, uptimeMet: true, resolution: 99.95, resolutionMet: true, downtime: '1m 05d' },
            { name: 'Payment Gateway', uptime: 99.90, uptimeMet: true, resolution: 98.75, resolutionMet: false, downtime: '15m 20d' },
            { name: 'Notification Service', uptime: 99.92, uptimeMet: true, resolution: 99.40, resolutionMet: false, downtime: '11m 45d' }
        ]
    },

    // ============== 3. INCIDENT & MTTR CONTROL ==============
    incidentMatrix: {
        total: 24, p1: 2, p2: 5, p3: 10, p4: 7,
        p1pct: 8.33, p2pct: 20.83, p3pct: 41.67, p4pct: 29.17,
        trend: {
            labels: ['6 Jul', '7 Jul', '8 Jul', '9 Jul', '10 Jul', '11 Jul', '12 Jul'],
            p1: [2, 2, 1, 2, 1, 2, 2], p2: [4, 5, 5, 6, 5, 6, 5], p3: [7, 8, 9, 9, 10, 11, 10], p4: [3, 3, 4, 5, 5, 6, 7]
        },
        resolution: { selesai: 15, selesaiPct: 62.5, dalamProses: 7, dalamProsesPct: 29.2, menungguVendor: 2, menungguVendorPct: 8.3 },
        avgMttrLabel: '1j 45m',
        list: [
            { id: 'INC-2026-0712-001', title: 'Gangguan akses VPN pengguna', priority: 'P1', service: 'VPN Corporate', status: 'Investigasi', created: '12 Jul 2026 10:15', mttrEst: '2j 30m', owner: 'Network Team' },
            { id: 'INC-2026-0712-002', title: 'Aplikasi e-Meterai tidak dapat diakses', priority: 'P1', service: 'e-Meterai', status: 'Identifikasi', created: '12 Jul 2026 09:50', mttrEst: '3j 00m', owner: 'Application Team' },
            { id: 'INC-2026-0712-003', title: 'Lambatnya response aplikasi core', priority: 'P2', service: 'Core Application', status: 'Dalam Proses', created: '12 Jul 2026 09:20', mttrEst: '4j 00m', owner: 'Application Team' },
            { id: 'INC-2026-0712-004', title: 'Koneksi internet DC Jakarta tidak stabil', priority: 'P2', service: 'Internet Gateway', status: 'Dalam Proses', created: '12 Jul 2026 08:45', mttrEst: '3j 30m', owner: 'Network Team' },
            { id: 'INC-2026-0712-005', title: 'Email beberapa pengguna tidak terkirim', priority: 'P2', service: 'Mail Service', status: 'Menunggu Vendor', created: '12 Jul 2026 08:10', mttrEst: '5j 00m', owner: 'Service Desk' }
        ],
        topAffected: [
            { name: 'Core Application', count: 6 }, { name: 'e-Meterai', count: 4 },
            { name: 'VPN Corporate', count: 3 }, { name: 'Internet Gateway', count: 2 }, { name: 'Mail Service', count: 2 }
        ],
        resourceAlloc: { totalEngineer: 28, handling: 18, utilization: 64 }
    },

    mttr: {
        avgLabel: '2j 35m', avgHrs: 2.58,
        totalResolved: 248, totalResolvedDeltaPct: 17.0,
        bestLabel: '45m', bestService: 'Pembayaran e-Meterai',
        worstLabel: '6j 42m', worstService: 'Integrasi API Eksternal',
        targetLabel: '≤ 4j 00m',
        trend: { labels: ['01 Jul', '06 Jul', '11 Jul', '16 Jul', '21 Jul', '26 Jul', '31 Jul', '05 Agu', '10 Agu'], data: [3.17, 2.75, 3.42, 2.33, 3.08, 2.47, 2.92, 2.33, 2.58], target: 4.0 },
        byService: [
            { name: 'Pembayaran e-Meterai', hrs: 0.75, label: '45m' },
            { name: 'Digital Signature', hrs: 1.33, label: '1j 20m' },
            { name: 'Biometric Authentication', hrs: 1.87, label: '1j 52m' },
            { name: 'e-Shield (Keamanan Data)', hrs: 2.58, label: '2j 35m' },
            { name: 'SPBE Services', hrs: 3.47, label: '3j 28m' },
            { name: 'Integrasi API Eksternal', hrs: 6.70, label: '6j 42m' }
        ],
        distribution: [
            { label: '≤ 1 jam', pct: 32, color: '#0057B8' }, { label: '> 1-2 jam', pct: 28, color: '#10b981' },
            { label: '> 2-4 jam', pct: 20, color: '#f59e0b' }, { label: '> 4-8 jam', pct: 12, color: '#ef4444' },
            { label: '> 8 jam', pct: 8, color: '#94a3b8' }
        ],
        byPriority: [
            { label: 'P1 - Critical', hrs: 2.17, text: '2j 10m', color: '#ef4444' }, { label: 'P2 - High', hrs: 2.80, text: '2j 48m', color: '#f59e0b' },
            { label: 'P3 - Medium', hrs: 3.08, text: '3j 05m', color: '#eab308' }, { label: 'P4 - Low', hrs: 1.25, text: '1j 15m', color: '#10b981' }
        ],
        comparison: { currentLabel: '2j 35m', currentPeriod: '01 Jul - 10 Agu 2025', previousLabel: '3j 10m', previousPeriod: '21 Mei - 30 Jun 2025', changePct: 18.6, better: true }
    },

    // ============== 4. TICKET & WORKLOAD ==============
    tickets: {
        total: 10039, totalDeltaPct: 7.8,
        statusBreakdown: [
            { label: 'New', value: 1245, pct: 12.4, deltaPct: 8.2, color: 'blue' },
            { label: 'Open', value: 2358, pct: 23.5, deltaPct: 5.1, color: 'amber' },
            { label: 'Pending', value: 1876, pct: 18.7, deltaPct: -3.4, color: 'orange' },
            { label: 'Resolved', value: 2945, pct: 29.4, deltaPct: 12.6, color: 'emerald' },
            { label: 'Closed', value: 1615, pct: 16.1, deltaPct: 7.3, color: 'slate' }
        ],
        dailyVolume: { labels: ['4 Agu', '5 Agu', '6 Agu', '7 Agu', '8 Agu', '9 Agu', '10 Agu'], data: [1234, 1356, 1498, 1345, 1612, 1289, 1705] },
        weeklyVolume: { labels: ['14-20 Jul', '21-27 Jul', '28 Jul-3 Agu', '4-10 Agu'], data: [7128, 7654, 8214, 10039] },
        monthlyVolume: { labels: ['Mar 2025', 'Apr 2025', 'Mei 2025', 'Jun 2025', 'Jul 2025', 'Agu 2025'], data: [28741, 31582, 33894, 36128, 38765, 10039] },
        categories: [
            { name: 'Enquiry', total: 4231, pct: 42.1 },
            { name: 'Service Request', total: 3287, pct: 32.7 },
            { name: 'Complaint', total: 2521, pct: 25.1 }
        ],
        backlog: {
            p1: 2, p2: 15, p3: 27, p4: 45, total: 89,
            tiers: [
                { tier: 'L1 (Service Desk)', p1: 0, p2: 5, p3: 15, p4: 40, total: 60 },
                { tier: 'L2 (Technical Support)', p1: 1, p2: 8, p3: 12, p4: 5, total: 26 },
                { tier: 'L3 (Engineering / SME)', p1: 1, p2: 2, p3: 0, p4: 0, total: 3 }
            ]
        }
    },

    // ============== CHANGE & RELEASE (unchanged, sudah dinamis) ==============
    changes: { success: 75.0, emergency: 15.0, failed: 10.0, unauthorized: 1 },

    // ============== 5. CUSTOMER EXPERIENCE (CX) ==============
    cx: {
        fcr: 86.4, nps: 68,
        productSat: { pct: 92.4, outOf5: 4.62, label: 'Sangat Puas', deltaPct: 3.2 },
        agentSat: { pct: 94.1, outOf5: 4.71, label: 'Sangat Puas', deltaPct: 2.8 },
        productFeedback: { positive: 78.6, positiveCount: 1964, neutral: 14.3, neutralCount: 358, negative: 7.1, negativeCount: 178 },
        agentFeedback: { positive: 82.2, positiveCount: 2056, neutral: 11.6, neutralCount: 290, negative: 6.2, negativeCount: 155 },
        suggestions: [
            { text: 'Aplikasi mudah digunakan dan sangat membantu pekerjaan kami. Mohon ditambahkan fitur notifikasi real-time.', user: 'Pelanggan #12458', date: '28 Mei 2024' },
            { text: 'Pelayanan agen sangat ramah dan responsif. Pertahankan kualitas layanan yang sudah sangat baik ini.', user: 'Pelanggan #98231', date: '27 Mei 2024' },
            { text: 'Sistem kadang mengalami loading lama saat jam sibuk. Semoga ke depannya lebih stabil.', user: 'Pelanggan #77621', date: '25 Mei 2024' },
            { text: 'Akan lebih baik jika tersedia panduan penggunaan yang lebih lengkap dan mudah dipahami.', user: 'Pelanggan #52890', date: '24 Mei 2024' },
            { text: 'Terima kasih atas solusi cepat dari agen. Semoga bisa dipertahankan dan semakin ditingkatkan.', user: 'Pelanggan #11477', date: '23 Mei 2024' }
        ]
    },

    // ============== 6. PORTFOLIO & HUMAN CAPITAL ==============
    productivityRules: [
        { id: 'RUL-01', emp_name: 'Sarah M.', task_name: 'Infrastructure Routing', count: 15, mins: 120 },
        { id: 'RUL-02', emp_name: 'Alex B.', task_name: 'UI/UX Adjustments', count: 40, mins: 45 },
        { id: 'RUL-03', emp_name: 'Budi Santoso', task_name: 'Backend API Development', count: 22, mins: 90 }
    ],
    grades: [
        { emp_name: 'Budi Santoso', role: 'BE Lead', tasks_done: 45, actual_hrs: 110, score: 92.5, grade: 'A' },
        { emp_name: 'Diana Putri', role: 'FE Lead', tasks_done: 55, actual_hrs: 160, score: 72.0, grade: 'C' },
        { emp_name: 'Sarah M.', role: 'Ops Lead', tasks_done: 38, actual_hrs: 95, score: 88.0, grade: 'B' }
    ],

    review360: {
        dimensions: [
            { id: 'technical', label: 'Technical Skill & Quality', weight: 25 },
            { id: 'delivery', label: 'Delivery Speed & Agility', weight: 25 },
            { id: 'communication', label: 'Communication & Teamwork', weight: 25 },
            { id: 'problem', label: 'Problem Solving & Initiative', weight: 25 }
        ],
        participants: [
            { id: 'PART-01', name: 'Sarah M.', role: 'Ops Lead', reviewer: 'Peer + Atasan', status: 'Selesai' },
            { id: 'PART-02', name: 'Alex B.', role: 'FE Engineer', reviewer: 'Peer + Atasan', status: 'Selesai' },
            { id: 'PART-03', name: 'Budi Santoso', role: 'BE Lead', reviewer: 'Atasan', status: 'Menunggu' },
            { id: 'PART-04', name: 'Diana Putri', role: 'FE Lead', reviewer: 'Peer', status: 'Proses' }
        ]
    },

    okr: [
        {
            id: 'O1', title: 'Achieve Zero Downtime Migration to Cloud', target: 'Q4 2026', weight: 40, progress: 85,
            raci: [
                { task: 'Cloud Provisioning', a: 'BE Lead', r: 'Ops Lead', c: 'PMO', i: 'Helpdesk' },
                { task: 'Database Setup', a: 'Data Lead', r: 'Ops Lead', c: 'BE Lead', i: 'PMO' }
            ]
        },
        {
            id: 'O2', title: 'Tingkatkan SLA Compliance ke atas 98%', target: 'Q3 2026', weight: 35, progress: 72,
            raci: [
                { task: 'SLA Monitoring Automation', a: 'Ops Manager', r: 'QA Lead', c: 'BPA', i: 'Executive' },
                { task: 'Incident Response Playbook', a: 'Incident Manager', r: 'L2 Team', c: 'RTFM', i: 'Service Desk' }
            ]
        },
        {
            id: 'O3', title: 'Implementasi Portfolio Management Terintegrasi (DSOC)', target: 'Q1 2027', weight: 25, progress: 48,
            raci: [
                { task: 'OKR Mapping Module', a: 'PMO', r: 'BE Lead', c: 'HR', i: 'All Employee' },
                { task: '360 Review Integration', a: 'HR Lead', r: 'BE Lead', c: 'Manager', i: 'PIC' }
            ]
        }
    ],

    // ============== 7. ADMINISTRATION & SECURITY ==============
    users: [
        { id: 'USR-01', name: 'Budi Santoso', username: 'admin', role: 'Super Admin', dept: 'IT Infrastructure', status: 'Active' },
        { id: 'USR-02', name: 'Sarah M.', username: 'manager', role: 'PMO / Setup', dept: 'PMO', status: 'Active' },
        { id: 'USR-03', name: 'Alex B.', username: 'viewer', role: 'Employee / PIC', dept: 'Frontend', status: 'Active' },
        { id: 'USR-04', name: 'Diana Putri', username: 'diana.putri', role: 'Employee / PIC', dept: 'Frontend', status: 'Inactive' }
    ],

    auditLogs: [
        { time: '18 Aug, 09:22', user: 'System Admin', module: 'Auth', detail: 'Logged in from IP 10.0.0.1', type: 'INFO', color: 'blue' },
        { time: '17 Aug, 16:40', user: 'Operation Manager', module: 'KPI Config', detail: 'Changed Grade A+ threshold to 96', type: 'UPDATE', color: 'warning' }
    ]
};

// =========================================================================
// API LAYER
// =========================================================================
const api = {
    async fetchData(endpoint, mockDataKey) {
        if (CONFIG.USE_MOCK) {
            return new Promise(resolve => setTimeout(() => resolve(mockDatabase[mockDataKey]), 200));
        } else {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`);
                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
            } catch (error) {
                console.error(`Gagal Fetch dari Backend ${endpoint}:`, error);
                throw error;
            }
        }
    },

    getDashboard: () => api.fetchData('/dashboard/summary', 'dashboard'),
    getPerformance: () => api.fetchData('/engine/performance', 'performance'),
    getSla: () => api.fetchData('/engine/sla', 'sla'),
    getIncidentMatrix: () => api.fetchData('/engine/incident-matrix', 'incidentMatrix'),
    getMttr: () => api.fetchData('/engine/mttr', 'mttr'),
    getTickets: () => api.fetchData('/engine/tickets', 'tickets'),
    getChanges: () => api.fetchData('/engine/changes', 'changes'),
    getCx: () => api.fetchData('/engine/cx', 'cx'),
    getProductivityRules: () => api.fetchData('/hc/productivity', 'productivityRules'),
    getGrades: () => api.fetchData('/hc/grades', 'grades'),
    getReview360: () => api.fetchData('/hc/review', 'review360'),
    getOkr: () => api.fetchData('/hc/okr', 'okr'),
    getUsers: () => api.fetchData('/admin/users', 'users'),
    getAuditLogs: () => api.fetchData('/admin/logs', 'auditLogs'),

    addLog: (module, detail, type, color = 'blue') => {
        const now = new Date();
        const timeStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) + ', ' + now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        mockDatabase.auditLogs.unshift({ time: timeStr, user: (typeof currUser !== 'undefined' && currUser) ? currUser.n : 'System', module: module, detail: detail, type: type, color: color });
    },

    // ---- Productivity Rules CRUD ----
    addProdRule: (rule) => {
        rule.id = 'RUL-' + Date.now().toString().slice(-6);
        mockDatabase.productivityRules.push(rule);
        return rule;
    },
    updateProdRule: (id, patch) => {
        const r = mockDatabase.productivityRules.find(x => x.id === id);
        if (r) Object.assign(r, patch);
        return r;
    },
    deleteProdRule: (id) => {
        mockDatabase.productivityRules = mockDatabase.productivityRules.filter(x => x.id !== id);
    },
    getProdRule: (id) => mockDatabase.productivityRules.find(x => x.id === id),

    // ---- Users CRUD ----
    addUser: (user) => {
        user.id = 'USR-' + Date.now().toString().slice(-6);
        mockDatabase.users.push(user);
        return user;
    },
    updateUser: (id, patch) => {
        const u = mockDatabase.users.find(x => x.id === id);
        if (u) Object.assign(u, patch);
        return u;
    },
    deleteUser: (id) => {
        mockDatabase.users = mockDatabase.users.filter(x => x.id !== id);
    },
    getUser: (id) => mockDatabase.users.find(x => x.id === id),

    // ---- 360 Review ----
    addReviewParticipant: (p) => {
        p.id = 'PART-' + Date.now().toString().slice(-6);
        mockDatabase.review360.participants.push(p);
        return p;
    },
    removeReviewParticipant: (id) => {
        mockDatabase.review360.participants = mockDatabase.review360.participants.filter(x => x.id !== id);
    },
    updateReviewWeights: (weights) => {
        mockDatabase.review360.dimensions.forEach(d => { if (weights[d.id] !== undefined) d.weight = weights[d.id]; });
    },

    // ---- OKR ----
    addOkr: (okrObj) => {
        okrObj.id = 'O' + (mockDatabase.okr.length + 1) + '-' + Date.now().toString().slice(-4);
        okrObj.raci = okrObj.raci || [];
        mockDatabase.okr.push(okrObj);
        return okrObj;
    },
    addRaciRow: (okrId, row) => {
        const o = mockDatabase.okr.find(x => x.id === okrId);
        if (o) o.raci.push(row);
        return o;
    }
};

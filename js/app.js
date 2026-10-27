// =========================================================================
// PERURI DSOC PORTAL - APPLICATION LOGIC
// =========================================================================

const titles = {
    'dashboard': ['Executive Dashboard', 'Live Scorecard (SLA, Uptime, CSAT, OKR)'],
    'engine-perf': ['Performance & Availability', 'Service Uptime & SLA Compliance'],
    'engine-sla': ['SLA Compliance', 'SLA Performance & Breach Analysis'],
    'engine-inc': ['Incident & MTTR Control', 'Active Incidents Matrix (P1-P4) & MTTR Dashboard'],
    'engine-ticket': ['Change Management', 'Volume Ticket Performance & Backlog Distribution'],
    'engine-change': ['Change & Release Management', 'Change Success Rate & Evaluation'],
    'engine-cx': ['Customer Experience (CX)', 'CSAT Feedback & NPS'],
    'hc-prod': ['Productivity & KPI Grading', 'Workload Calculation Config'],
    'hc-review': ['Direct Report Rating', 'Qualitative Evaluation Dimension'],
    'hc-okr': ['Strategic OKR & RACI Mapping', 'Objective Alignment Matrix'],
    'admin-role': ['Role & Access Management', 'RBAC Control Setup'],
    'admin-api': ['API & Integration Sync', 'Jira PULL & HRIS PUSH Hub'],
    'admin-log': ['Enterprise Audit Logs', 'System Security Trail']
};

const roles = {
    'admin': { n: 'Andika Yahya Siahaan', lbl: 'Super Admin', m: ['dashboard', 'engine-perf', 'engine-sla', 'engine-inc', 'engine-ticket', 'engine-change', 'engine-cx', 'hc-prod', 'hc-review', 'hc-okr', 'admin-role', 'admin-api', 'admin-log'], edit: true },
    'manager': { n: 'Manager', lbl: 'Manager', m: ['dashboard', 'engine-perf', 'engine-sla', 'engine-inc', 'engine-ticket', 'engine-change', 'engine-cx', 'hc-prod', 'hc-review', 'hc-okr'], edit: true },
    'viewer': { n: 'Viewer', lbl: 'Staff', m: ['dashboard', 'engine-perf', 'engine-sla', 'engine-inc', 'engine-ticket', 'engine-change', 'engine-cx'], edit: false }
};

let currUser = null;
let charts = {};           // Chart.js registry, keyed by canvas id
let confirmCallback = null;
let editingContext = null; // holds {type, id} while a modal is open in edit mode

document.addEventListener('DOMContentLoaded', () => {
    setInterval(() => {
        const now = new Date();
        const e = document.getElementById('clock');
        if (e) e.textContent = now.toLocaleTimeString('en-US', { hour12: false }) + ' WIB';
    }, 1000);

    const searchInput = document.getElementById('sidebarSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.nav-link').forEach(link => {
                const isMatch = link.textContent.toLowerCase().includes(q);
                link.style.display = isMatch ? 'flex' : 'none';
                if (isMatch && q) {
                    const parent = link.closest('.group-menu');
                    if (parent) {
                        const sub = parent.querySelector('[id^="drop-"]');
                        if (sub) { sub.classList.remove('hidden'); sub.classList.add('flex'); }
                    }
                }
            });
        });
    }

    const savedUser = sessionStorage.getItem('dsoc_user');
    if (savedUser && roles[savedUser]) {
        currUser = roles[savedUser];
        applyRBAC();
        document.getElementById('login-overlay').style.display = 'none';
        loadPage('dashboard');
    }
});

// =========================================================================
// AUTHENTICATION
// =========================================================================
function togglePasswordVisibility() {
    const pwd = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (pwd.type === 'password') { pwd.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { pwd.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function setLoginError(message) {
    const box = document.getElementById('login-error');
    const card = document.getElementById('login-card');
    const uField = document.getElementById('username');
    const pField = document.getElementById('password');
    if (box) { box.textContent = message; box.classList.remove('hidden'); }
    [uField, pField].forEach(f => f.classList.add('border-danger', 'ring-1', 'ring-red-200'));
    if (card) {
        card.classList.remove('shake');
        void card.offsetWidth; // restart animasi
        card.classList.add('shake');
    }
    showToast(message, 'danger');
}

function clearLoginError() {
    const box = document.getElementById('login-error');
    if (box) box.classList.add('hidden');
    ['username', 'password'].forEach(id => document.getElementById(id).classList.remove('border-danger', 'ring-1', 'ring-red-200'));
}

function doLogin(e) {
    e.preventDefault();
    clearLoginError();
    const uname = document.getElementById('username').value.toLowerCase().trim();
    const pwd = document.getElementById('password').value;

    if (!uname) { setLoginError('Username / User ID wajib diisi.'); return; }
    if (!roles[uname]) { setLoginError('Login gagal: User ID atau Password salah. (Gunakan: admin, manager, atau viewer)'); return; }
    if (pwd !== 'password123') { setLoginError('Login gagal: User ID atau Password salah.'); return; }

    currUser = roles[uname];
    sessionStorage.setItem('dsoc_user', uname);
    applyRBAC();

    api.addLog('Auth', 'Login Successful', 'INFO', 'blue');
    document.getElementById('login-overlay').style.opacity = '0';
    setTimeout(() => { document.getElementById('login-overlay').style.display = 'none'; navTo('dashboard'); }, 400);
    showToast('Login Berhasil (' + currUser.n + ')', 'success');
}

function askLogout() {
    openConfirm('Anda yakin ingin keluar dari sistem DSOC Portal? Sesi Anda akan diakhiri.', doLogout, { title: 'Konfirmasi Logout', okLabel: 'Ya, Logout', okColor: 'danger' });
}

function doLogout() {
    api.addLog('Auth', 'Logged out', 'INFO', 'blue');
    currUser = null;
    sessionStorage.removeItem('dsoc_user');
    document.getElementById('username').value = '';
    document.getElementById('password').value = 'password123';
    clearLoginError();
    document.getElementById('login-overlay').style.display = 'flex';
    setTimeout(() => document.getElementById('login-overlay').style.opacity = '1', 50);
    destroyCharts();
    document.getElementById('app-content').innerHTML = '';
    showToast('Anda telah keluar dari sistem', 'info');
}

function applyRBAC() {
    document.getElementById('user-initial').textContent = currUser.n.charAt(0);
    document.getElementById('user-name').textContent = currUser.n;
    document.getElementById('user-role').textContent = currUser.lbl;

    document.querySelectorAll('.nav-link').forEach(btn => {
        const p = btn.getAttribute('data-page');
        if (p) btn.style.display = currUser.m.includes(p) ? 'flex' : 'none';
    });

    document.querySelectorAll('.group-menu').forEach(grp => {
        const links = grp.querySelectorAll('.nav-link[data-page]');
        const anyVisible = Array.from(links).some(l => currUser.m.includes(l.getAttribute('data-page')));
        grp.style.display = anyVisible ? 'block' : 'none';
    });
}

// =========================================================================
// NAVIGATION
// =========================================================================
function toggleDropdown(dropId, btn) {
    const el = document.getElementById(dropId);
    btn.classList.toggle('menu-open');
    if (el.classList.contains('hidden')) { el.classList.remove('hidden'); el.classList.add('flex'); }
    else { el.classList.add('hidden'); el.classList.remove('flex'); }
}

async function navTo(pageId) {
    if (!currUser || !currUser.m.includes(pageId)) { showToast('Akses Ditolak untuk role ini', 'danger'); return; }
    await loadPage(pageId);
}

async function loadPage(pageId) {
    document.querySelectorAll('.nav-link').forEach(b => {
        b.classList.remove('bg-slate-800', 'text-white');
        b.classList.add(b.classList.contains('py-2.5') ? 'text-slate-300' : 'text-slate-400');
    });

    const btn = document.querySelector(`[data-page="${pageId}"]`);
    if (btn) {
        btn.classList.add(pageId === 'dashboard' ? 'bg-slate-800' : 'text-white');
        if (pageId === 'dashboard') btn.classList.add('text-white');
        const parentDrop = btn.closest('[id^="drop-"]');
        if (parentDrop) {
            parentDrop.classList.remove('hidden'); parentDrop.classList.add('flex');
            const parentBtn = parentDrop.previousElementSibling;
            if (parentBtn) parentBtn.classList.add('menu-open');
        }
    } else if (pageId === 'dashboard') {
        const dBtn = document.getElementById('nav-dashboard');
        if (dBtn) dBtn.classList.add('bg-slate-800', 'text-white');
    }

    document.getElementById('header-title').textContent = titles[pageId][0];
    document.getElementById('header-subtitle').textContent = titles[pageId][1];

    const contentDiv = document.getElementById('app-content');
    contentDiv.innerHTML = '<div class="flex items-center justify-center h-full"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-peruri-base"></i></div>';
    destroyCharts();

    try {
        const response = await fetch(`pages/${pageId}.html`);
        if (!response.ok) throw new Error('File HTML tidak ditemukan (Pastikan Local Server Berjalan)');
        contentDiv.innerHTML = await response.text();

        if (!currUser.edit) {
            contentDiv.querySelectorAll('input:not(.filter-input), select:not(.filter-select), textarea').forEach(el => {
                el.disabled = true; el.classList.add('opacity-50', 'cursor-not-allowed');
            });
            contentDiv.querySelectorAll('.crud-action, .sec-edit, .delete-btn, .edit-btn, .add-btn').forEach(el => el.style.display = 'none');
        }

        const binders = {
            'dashboard': bindDashboard,
            'engine-perf': bindPerformance,
            'engine-sla': bindSLA,
            'engine-inc': bindIncidentAndMttr,
            'engine-ticket': bindTicketWorkload,
            'engine-change': bindEngineChange,
            'engine-cx': bindEngineCX,
            'hc-prod': bindProd,
            'hc-review': bindReview,
            'hc-okr': bindOkr,
            'admin-role': bindUsers,
            'admin-log': renderLogs
        };
        if (binders[pageId]) await binders[pageId]();

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    entry.target.querySelectorAll('.cu').forEach(el => animateValue(el));
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    } catch (err) {
        contentDiv.innerHTML = `<div class="bg-red-50 text-danger p-8 rounded-2xl border border-red-200 text-center max-w-lg mx-auto mt-20 shadow-sm"><i class="fa-solid fa-triangle-exclamation text-5xl mb-4"></i><h3 class="font-bold text-xl mb-2">Gagal Memuat Halaman</h3><p class="text-sm">Pastikan Anda menggunakan Local Web Server (misal: Live Server).</p><p class="text-xs mt-4 text-red-400 bg-white p-2 rounded border border-red-100">Error: ${err.message}</p></div>`;
        console.error(err);
    }
}

// =========================================================================
// TOAST
// =========================================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const styles = {
        success: { color: '#10b981', bg: 'bg-emerald-50', text: 'text-success', icon: 'fa-check-circle' },
        warning: { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-warning', icon: 'fa-triangle-exclamation' },
        danger: { color: '#ef4444', bg: 'bg-red-50', text: 'text-danger', icon: 'fa-xmark-circle' },
        info: { color: '#0057B8', bg: 'bg-blue-50', text: 'text-peruri-base', icon: 'fa-info-circle' }
    };
    const s = styles[type] || styles.info;
    toast.className = `min-w-[300px] max-w-[380px] p-4 rounded-xl bg-white border border-slate-200 shadow-xl flex items-start gap-3 transform transition-all duration-300 translate-x-[120%] opacity-0 border-l-4 pointer-events-auto`;
    toast.style.borderLeftColor = s.color;
    toast.innerHTML = `<div class="w-8 h-8 rounded-full ${s.bg} ${s.text} flex items-center justify-center shrink-0"><i class="fa-solid ${s.icon}"></i></div><div class="flex-1 mt-1"><p class="font-bold text-[12.5px] text-slate-800 leading-snug">${message}</p></div><button onclick="this.closest('div.pointer-events-auto').remove()" class="text-slate-300 hover:text-slate-500 mt-0.5"><i class="fa-solid fa-xmark text-xs"></i></button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-x-[120%]', 'opacity-0'));
    setTimeout(() => { toast.classList.add('translate-x-[120%]', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 3800);
}

// =========================================================================
// GENERIC MODAL SYSTEM
// =========================================================================
function openModal(title, bodyHtml, opts = {}) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    const box = document.getElementById('modal-box');
    box.classList.remove('max-w-md', 'max-w-lg', 'max-w-2xl');
    box.classList.add(opts.size || 'max-w-lg');
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    box.classList.add('scale-95', 'opacity-0');
    requestAnimationFrame(() => box.classList.remove('scale-95', 'opacity-0'));
}
function closeModal() {
    const box = document.getElementById('modal-box');
    box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-overlay').classList.remove('flex');
        editingContext = null;
    }, 150);
}

function openConfirm(message, onYes, opts = {}) {
    document.getElementById('confirm-title').textContent = opts.title || 'Konfirmasi Tindakan';
    document.getElementById('confirm-message').textContent = message;
    const okBtn = document.getElementById('confirm-ok-btn');
    okBtn.textContent = opts.okLabel || 'Ya, Lanjutkan';
    okBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm ' + (opts.okColor === 'danger' ? 'bg-danger hover:bg-red-600' : 'bg-peruri-base hover:bg-peruri-dark');
    confirmCallback = onYes;
    const overlay = document.getElementById('confirm-overlay');
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    const box = document.getElementById('confirm-box');
    box.classList.add('scale-95', 'opacity-0');
    requestAnimationFrame(() => box.classList.remove('scale-95', 'opacity-0'));
}
function closeConfirm() {
    const box = document.getElementById('confirm-box');
    box.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        document.getElementById('confirm-overlay').classList.add('hidden');
        document.getElementById('confirm-overlay').classList.remove('flex');
        confirmCallback = null;
    }, 150);
}
function confirmYes() { const cb = confirmCallback; closeConfirm(); if (cb) cb(); }

// =========================================================================
// CHART HELPERS
// =========================================================================
function destroyCharts() {
    Object.values(charts).forEach(c => { if (c) c.destroy(); });
    charts = {};
}
function makeChart(canvasId, config) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx.getContext('2d'), config);
    return charts[canvasId];
}

// =========================================================================
// ANIMATION / MISC UTILS
// =========================================================================
function animateValue(el) {
    const tar = parseFloat(el.getAttribute('data-target'));
    const dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const dur = 1000, start = performance.now();
    function up(now) {
        const p = Math.min((now - start) / dur, 1);
        const cur = 0 + (tar - 0) * (1 - Math.pow(1 - p, 3));
        el.textContent = cur.toFixed(dec);
        if (p < 1) requestAnimationFrame(up);
        else el.textContent = tar.toFixed(dec);
    }
    requestAnimationFrame(up);
}

function toggleCard(el) {
    el.classList.toggle('open');
}

function toggleApi(btn) {
    const wrap = btn.closest('div').querySelector('input');
    const icon = btn.querySelector('i');
    if (!wrap) return;
    if (wrap.type === 'password') { wrap.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { wrap.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function actApi(btn, type) {
    if (!currUser.edit) return;
    const ot = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = ot; btn.disabled = false; showToast('Sinkronisasi ' + type + ' berhasil'); api.addLog('Integration API', 'Executed API ' + type, 'PUSH', 'success'); }, 1000);
}

function badgeStatus(met) {
    return met
        ? '<span class="bg-emerald-50 text-success text-[10px] font-bold px-2 py-1 rounded border border-emerald-200">✓ Memenuhi Target</span>'
        : '<span class="bg-amber-50 text-warning text-[10px] font-bold px-2 py-1 rounded border border-amber-200">⚠ Belum Memenuhi</span>';
}

// =========================================================================
// 1. EXECUTIVE DASHBOARD
// =========================================================================
async function bindDashboard() {
    const d = await api.getDashboard();

    // Filter bar init
    const fromEl = document.getElementById('filter-date-from');
    const toEl = document.getElementById('filter-date-to');
    const prjEl = document.getElementById('filter-project');
    if (fromEl) fromEl.value = d.filters.from;
    if (toEl) toEl.value = d.filters.to;
    if (prjEl) {
        prjEl.innerHTML = d.projects.map(p => `<option value="${p.code}" ${p.code === d.filters.project ? 'selected' : ''}>${p.name}</option>`).join('');
    }
    const lastUpdEl = document.getElementById('dash-last-updated');
    if (lastUpdEl) lastUpdEl.textContent = d.lastUpdated;

    renderKpiCards(d);
    renderKpiCards2(d);
    renderTrendChart(d);
    renderIncidentDonut(d);
    renderRingkasanPerforma(d);

    const prjContainer = document.getElementById('activeProjectsList');
    if (prjContainer) {
        let phtml = '';
        d.activeProjects.forEach((p, idx) => {
            const color = p.status === 'On Track' ? 'success' : (p.status === 'At Risk' ? 'danger' : 'warning');
            phtml += `<div class="p-3 border border-slate-200 rounded-xl bg-white hover:border-peruri-base transition-colors shadow-sm flex justify-between items-center"><div class="flex items-center gap-2"><span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-peruri-base">O${idx + 1}</span><h4 class="font-bold text-slate-800 text-xs">${p.name}</h4></div><p class="text-[9px] text-slate-500 uppercase tracking-widest">Status: <span class="text-${color} font-bold">${p.status}</span> &middot; SLA <b>${p.sla}%</b></p></div>`;
        });
        prjContainer.innerHTML = phtml;
    }
}

function renderKpiCards(d) {
    const grid = document.getElementById('kpi-card-grid');
    if (!grid) return;
    const order = ['uptime', 'sla'];
    const icons = { uptime: 'fa-satellite-dish', sla: 'fa-shield-halved'};
    let html = '';
    order.forEach(key => {
        const k = d.kpi[key];
        const max = Math.max(...k.trend, 1);
        const bars = k.trend.map(v => {
            const h = Math.max(8, (v / max) * 100);
            return `<div class="bar-col"><div class="bar bg-peruri-base/70" style="height:${h}%"></div></div>`;
        }).join('');
        const statusBg = { success: 'bg-emerald-50 border-emerald-200 text-success', warning: 'bg-amber-50 border-amber-200 text-warning', danger: 'bg-red-50 border-red-200 text-danger' }[k.statusColor] || 'bg-slate-50 border-slate-200 text-slate-500';
        html += `<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-peruri-base transition-colors">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">${k.label}</span>
                <i class="fa-solid ${icons[key]} text-peruri-base text-xs"></i>
            </div>
            <div class="font-extrabold text-2xl text-slate-800 leading-none mb-1"><span class="cu" data-target="${k.value}" data-decimals="${k.decimals}">0</span><span class="text-sm text-slate-400">${k.unit}</span></div>
            <span class="inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${statusBg} mb-2">${k.status}</span>
            <div class="bars-container !h-8 !gap-1 mb-1">${bars}</div>
            <p class="text-[9.5px] text-slate-500">${k.target} &middot; <b class="${k.deltaGood ? 'text-success' : 'text-danger'}">${k.delta}</b></p>
        </div>`;
    });
    grid.innerHTML = html;
}


function renderKpiCards2(d) {
    const grid = document.getElementById('kpi-card-grid2');
    if (!grid) return;
    const order = ['openInc', 'mttr', 'csat'];
    const icons = {openInc: 'fa-triangle-exclamation', mttr: 'fa-stopwatch', csat: 'fa-face-smile' };
    let html = '';
    order.forEach(key => {
        const k = d.kpi[key];
        const max = Math.max(...k.trend, 1);
        const bars = k.trend.map(v => {
            const h = Math.max(8, (v / max) * 100);
            return `<div class="bar-col"><div class="bar bg-peruri-base/70" style="height:${h}%"></div></div>`;
        }).join('');
        const statusBg = { success: 'bg-emerald-50 border-emerald-200 text-success', warning: 'bg-amber-50 border-amber-200 text-warning', danger: 'bg-red-50 border-red-200 text-danger' }[k.statusColor] || 'bg-slate-50 border-slate-200 text-slate-500';
        html += `<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-peruri-base transition-colors">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">${k.label}</span>
                <i class="fa-solid ${icons[key]} text-peruri-base text-xs"></i>
            </div>
            <div class="font-extrabold text-2xl text-slate-800 leading-none mb-1"><span class="cu" data-target="${k.value}" data-decimals="${k.decimals}">0</span><span class="text-sm text-slate-400">${k.unit}</span></div>
            <span class="inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${statusBg} mb-2">${k.status}</span>
            <div class="bars-container !h-8 !gap-1 mb-1">${bars}</div>
            <p class="text-[9.5px] text-slate-500">${k.target} &middot; <b class="${k.deltaGood ? 'text-success' : 'text-danger'}">${k.delta}</b></p>
        </div>`;
    });
    grid.innerHTML = html;
}

function renderTrendChart(d) {
    makeChart('trendChart', {
        type: 'line',
        data: {
            labels: d.trendLabels,
            datasets: [
                { label: 'Service Uptime (%)', data: d.trendSeries.uptime, borderColor: '#0057B8', backgroundColor: '#0057B8', tension: 0.35, yAxisID: 'y', pointRadius: 3 },
                { label: 'SLA Compliance (%)', data: d.trendSeries.sla, borderColor: '#10b981', backgroundColor: '#10b981', tension: 0.35, yAxisID: 'y', pointRadius: 3 },
                { label: 'CSAT (%)', data: d.trendSeries.csat, borderColor: '#d946ef', backgroundColor: '#d946ef', tension: 0.35, yAxisID: 'y', pointRadius: 3 },
                { label: 'Open Incident (count)', data: d.trendSeries.openIncident, borderColor: '#f59e0b', backgroundColor: '#f59e0b', tension: 0.35, yAxisID: 'y1', pointRadius: 3, borderDash: [4, 3] },
                { label: 'Avg MTTR (jam)', data: d.trendSeries.mttr, borderColor: '#ef4444', backgroundColor: '#ef4444', tension: 0.35, yAxisID: 'y1', pointRadius: 3, borderDash: [4, 3] }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
            scales: {
                y: { position: 'left', min: 0, max: 100, title: { display: true, text: '%', font: { size: 9 } }, ticks: { font: { size: 9 } } },
                y1: { position: 'right', min: 0, max: 16, grid: { drawOnChartArea: false }, title: { display: true, text: 'count / jam', font: { size: 9 } }, ticks: { font: { size: 9 } } }
            }
        }
    });
}

function renderIncidentDonut(d) {
    makeChart('incidentDonut', {
        type: 'doughnut',
        data: {
            labels: d.incidentDistribution.map(i => i.label),
            datasets: [{ data: d.incidentDistribution.map(i => i.value), backgroundColor: d.incidentDistribution.map(i => i.color), borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
        }
    });
    const totalEl = document.getElementById('incident-donut-total');
    if (totalEl) totalEl.textContent = d.incidentTotal;
}

function renderRingkasanPerforma(d) {
    const el = document.getElementById('ringkasan-performa');
    if (!el) return;
    const items = [
        { key: 'uptime', icon: 'fa-satellite-dish', desc: 'Ketersediaan layanan sangat stabil melebihi target yang ditetapkan.' },
        { key: 'sla', icon: 'fa-shield-halved', desc: 'Kepatuhan SLA berada di atas target dengan performa konsisten.' },
        { key: 'openInc', icon: 'fa-triangle-exclamation', desc: 'Jumlah insiden terbuka dalam kondisi terkendali dan terus membaik.' },
        { key: 'mttr', icon: 'fa-stopwatch', desc: 'Waktu pemulihan rata-rata tergolong sangat baik dan efisien.' },
        { key: 'csat', icon: 'fa-face-smile', desc: 'Kepuasan pelanggan sangat baik dan terus menunjukkan peningkatan.' }
    ];
    let h = '';
    items.forEach(it => {
        const k = d.kpi[it.key];
        const badge = { success: 'bg-emerald-50 text-success', warning: 'bg-amber-50 text-warning', danger: 'bg-red-50 text-danger' }[k.statusColor];
        h += `<div class="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-peruri-base flex items-center justify-center shrink-0"><i class="fa-solid ${it.icon} text-xs"></i></div>
                <div><h5 class="font-bold text-slate-800 text-[12px]">${k.label}</h5><p class="text-[10px] text-slate-500">${it.desc}</p></div>
            </div>
            <div class="text-right shrink-0 ml-3">
                <div class="font-extrabold text-slate-800 text-sm">${k.value}${k.unit}</div>
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${badge}">${k.status}</span>
            </div>
        </div>`;
    });
    el.innerHTML = h;
}

function applyFilters(btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Menerapkan...';
    btnElement.disabled = true;

    const from = document.getElementById('filter-date-from')?.value;
    const to = document.getElementById('filter-date-to')?.value;
    const prjCode = document.getElementById('filter-project')?.value;

    setTimeout(() => {
        const d = mockDatabase.dashboard;
        if (from) d.filters.from = from;
        if (to) d.filters.to = to;
        if (prjCode) d.filters.project = prjCode;

        // Simulasikan penyesuaian data terhadap layanan/proyek terpilih
        const prj = d.activeProjects.find(p => p.id === prjCode);
        if (prjCode && prjCode !== 'all' && prj) {
            d.kpi.sla.value = prj.sla;
            d.kpi.sla.trend[d.kpi.sla.trend.length - 1] = prj.sla;
        } else {
            d.kpi.sla.value = 97.45;
            d.kpi.sla.trend = [92.10, 93.20, 94.10, 96.30, 97.45];
        }
        d.lastUpdated = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';

        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
        renderKpiCards(d);
        renderTrendChart(d);
        document.getElementById('dash-last-updated').textContent = d.lastUpdated;

        const prjName = d.projects.find(p => p.code === prjCode)?.name || 'Semua Layanan';
        showToast(`Filter diterapkan: ${prjName} (${from || '-'} s/d ${to || '-'})`, 'success');
        api.addLog('Dashboard', `Applied filter project=${prjName}, range=${from} - ${to}`, 'INFO', 'blue');
    }, 700);
}

// =========================================================================
// 2. PERFORMANCE & AVAILABILITY  (Service Uptime + SLA Compliance)
// =========================================================================
async function bindPerformance() {
    const p = await api.getPerformance();
    const s = await api.getSla();

    // --- Service Uptime summary chips ---
    const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    setTxt('perf-uptime-overall', p.uptimeOverall.toFixed(2) + '%');
    setTxt('perf-uptime-delta', '▲ ' + p.uptimeDelta + '%');
    setTxt('perf-total-services', p.totalServices);
    setTxt('perf-normal-count', p.normalCount);
    setTxt('perf-normal-pct', p.normalPct + '%');
    setTxt('perf-warning-count', p.warningCount);
    setTxt('perf-warning-pct', p.warningPct + '%');
    setTxt('perf-down-count', p.downCount);
    setTxt('perf-down-pct', p.downPct + '%');
    setTxt('perf-overall-status', p.overallStatus);

    // --- Uptime trend line chart ---
    makeChart('uptimeTrendChart', {
        type: 'line',
        data: { labels: p.trend.labels, datasets: [{ label: 'Uptime (%)', data: p.trend.data, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.35, pointRadius: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 98.5, max: 100, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } } }
    });

    // --- Distribusi status layanan donut ---
    makeChart('statusDistDonut', {
        type: 'doughnut',
        data: { labels: ['Normal', 'Peringatan', 'Down'], datasets: [{ data: [p.normalCount, p.warningCount, p.downCount], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });

    // --- Top infrastruktur uptime (progress bars) ---
    const infraEl = document.getElementById('perf-top-infra');
    if (infraEl) {
        infraEl.innerHTML = p.topInfra.map(i => `<div class="mb-3 last:mb-0">
            <div class="flex justify-between text-[10.5px] mb-1"><span class="font-bold text-slate-700">${i.name}</span><span class="font-bold text-slate-800">${i.uptime}%</span></div>
            <div class="w-full bg-slate-100 rounded-full h-2"><div class="bg-peruri-base h-2 rounded-full" style="width:${i.uptime}%"></div></div>
        </div>`).join('');
    }

    // --- Status layanan kritis table ---
    const tbody = document.getElementById('perf-critical-table');
    if (tbody) {
        tbody.innerHTML = p.criticalServices.map(s2 => {
            const badge = s2.status === 'Normal' ? 'bg-emerald-50 text-success border-emerald-200' : 'bg-amber-50 text-warning border-amber-200';
            return `<tr class="hover:bg-slate-50"><td class="p-2.5 font-bold text-slate-800">${s2.name}</td><td class="p-2.5 text-slate-500">${s2.category}</td><td class="p-2.5 text-center"><span class="text-[9.5px] font-bold px-2 py-0.5 rounded border ${badge}">${s2.status}</span></td><td class="p-2.5 text-center font-bold">${s2.uptime}%</td><td class="p-2.5 text-center">${s2.response} ms</td><td class="p-2.5 text-center text-[10px] text-slate-400">${s2.updated}</td></tr>`;
        }).join('');
    }

    // --- Alert terbaru ---
    const alertEl = document.getElementById('perf-alerts');
    if (alertEl) {
        alertEl.innerHTML = p.alerts.map(a => `<div class="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2 last:mb-0">
            <div class="flex justify-between items-start"><h5 class="font-bold text-[11px] text-slate-800">${a.title}</h5><span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning text-white shrink-0 ml-2">${a.level}</span></div>
            <p class="text-[10px] text-slate-500 mt-1">${a.detail}</p><p class="text-[9px] text-slate-400 mt-1">${a.time}</p>
        </div>`).join('') || '<p class="text-[11px] text-slate-400 text-center py-4">Tidak ada alert aktif.</p>';
    }
    setTxt('perf-alert-kritis', p.alertCounts.kritis);
    setTxt('perf-alert-peringatan', p.alertCounts.peringatan);
    setTxt('perf-alert-info', p.alertCounts.info);

    // ====================== SLA COMPLIANCE ======================
    // setTxt('sla-period', s.period);
    // setTxt('sla-total-layanan', s.totalLayanan);
    // setTxt('sla-uptime-today', s.uptimeToday.toFixed(2) + '%');
    // setTxt('sla-resolution-today', s.resolutionToday.toFixed(2) + '%');
    // setTxt('sla-incident-total', s.incidentToday.total);
    // setTxt('sla-incident-critical', s.incidentToday.critical);
    // setTxt('sla-incident-major', s.incidentToday.major);
    // setTxt('sla-downtime-today', s.downtimeToday);

    // const uptimeStatusEl = document.getElementById('sla-uptime-status');
    // if (uptimeStatusEl) uptimeStatusEl.innerHTML = badgeStatus(s.uptimeMet);
    // const resStatusEl = document.getElementById('sla-resolution-status');
    // if (resStatusEl) resStatusEl.innerHTML = badgeStatus(s.resolutionMet);

    // makeChart('slaUptimeChart', {
    //     type: 'line',
    //     data: { labels: s.uptimeTrend.labels, datasets: [
    //         { label: 'Uptime (%)', data: s.uptimeTrend.data, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
    //         { label: 'Target', data: s.uptimeTrend.labels.map(() => s.uptimeTarget), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0 }
    //     ] },
    //     options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 99.5, max: 100 }, x: { ticks: { font: { size: 9 } } } } }
    // });

    // makeChart('slaResolutionChart', {
    //     type: 'line',
    //     data: { labels: s.resolutionTrend.labels, datasets: [
    //         { label: 'Resolution (%)', data: s.resolutionTrend.data, borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
    //         { label: 'Target', data: s.resolutionTrend.labels.map(() => s.resolutionTarget), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0 }
    //     ] },
    //     options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 98.5, max: 100 }, x: { ticks: { font: { size: 9 } } } } }
    // });

    // const summaryTbody = document.getElementById('sla-summary-table');
    // if (summaryTbody) {
    //     summaryTbody.innerHTML = s.serviceSummary.map(r => `<tr class="hover:bg-slate-50">
    //         <td class="p-2.5 font-bold text-slate-800">${r.name}</td>
    //         <td class="p-2.5 text-center">${r.uptime.toFixed(2)}%</td>
    //         <td class="p-2.5 text-center">${badgeStatus(r.uptimeMet)}</td>
    //         <td class="p-2.5 text-center">${r.resolution.toFixed(2)}%</td>
    //         <td class="p-2.5 text-center">${badgeStatus(r.resolutionMet)}</td>
    //         <td class="p-2.5 text-center text-slate-500">${r.downtime}</td>
    //     </tr>`).join('');
    // }
}

// =========================================================================
// 2. PERFORMANCE & AVAILABILITY  (Service Uptime + SLA Compliance)
// =========================================================================
async function bindSLA() {
    const p = await api.getPerformance();
    const s = await api.getSla();

    // --- Service Uptime summary chips ---
    const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    setTxt('perf-uptime-overall', p.uptimeOverall.toFixed(2) + '%');
    setTxt('perf-uptime-delta', '▲ ' + p.uptimeDelta + '%');
    setTxt('perf-total-services', p.totalServices);
    setTxt('perf-normal-count', p.normalCount);
    setTxt('perf-normal-pct', p.normalPct + '%');
    setTxt('perf-warning-count', p.warningCount);
    setTxt('perf-warning-pct', p.warningPct + '%');
    setTxt('perf-down-count', p.downCount);
    setTxt('perf-down-pct', p.downPct + '%');
    setTxt('perf-overall-status', p.overallStatus);

    // ====================== SLA COMPLIANCE ======================
    setTxt('sla-period', s.period);
    setTxt('sla-total-layanan', s.totalLayanan);
    setTxt('sla-uptime-today', s.uptimeToday.toFixed(2) + '%');
    setTxt('sla-resolution-today', s.resolutionToday.toFixed(2) + '%');
    setTxt('sla-incident-total', s.incidentToday.total);
    setTxt('sla-incident-critical', s.incidentToday.critical);
    setTxt('sla-incident-major', s.incidentToday.major);
    setTxt('sla-downtime-today', s.downtimeToday);

    const uptimeStatusEl = document.getElementById('sla-uptime-status');
    if (uptimeStatusEl) uptimeStatusEl.innerHTML = badgeStatus(s.uptimeMet);
    const resStatusEl = document.getElementById('sla-resolution-status');
    if (resStatusEl) resStatusEl.innerHTML = badgeStatus(s.resolutionMet);

    makeChart('slaUptimeChart', {
        type: 'line',
        data: { labels: s.uptimeTrend.labels, datasets: [
            { label: 'Uptime (%)', data: s.uptimeTrend.data, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
            { label: 'Target', data: s.uptimeTrend.labels.map(() => s.uptimeTarget), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0 }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 99.5, max: 100 }, x: { ticks: { font: { size: 9 } } } } }
    });

    makeChart('slaResolutionChart', {
        type: 'line',
        data: { labels: s.resolutionTrend.labels, datasets: [
            { label: 'Resolution (%)', data: s.resolutionTrend.data, borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', fill: true, tension: 0.3, pointRadius: 3 },
            { label: 'Target', data: s.resolutionTrend.labels.map(() => s.resolutionTarget), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0 }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 98.5, max: 100 }, x: { ticks: { font: { size: 9 } } } } }
    });

    const summaryTbody = document.getElementById('sla-summary-table');
    if (summaryTbody) {
        summaryTbody.innerHTML = s.serviceSummary.map(r => `<tr class="hover:bg-slate-50">
            <td class="p-2.5 font-bold text-slate-800">${r.name}</td>
            <td class="p-2.5 text-center">${r.uptime.toFixed(2)}%</td>
            <td class="p-2.5 text-center">${badgeStatus(r.uptimeMet)}</td>
            <td class="p-2.5 text-center">${r.resolution.toFixed(2)}%</td>
            <td class="p-2.5 text-center">${badgeStatus(r.resolutionMet)}</td>
            <td class="p-2.5 text-center text-slate-500">${r.downtime}</td>
        </tr>`).join('');
    }
}

// =========================================================================
// 3. INCIDENT & MTTR CONTROL  (Active Incident Matrix P1-P4 + MTTR)
// =========================================================================
async function bindIncidentAndMttr() {
    const im = await api.getIncidentMatrix();
    const mt = await api.getMttr();
    const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    // --- Active Incident Matrix summary ---
    setTxt('inc-total', im.total);
    setTxt('inc-p1', im.p1); setTxt('inc-p1-pct', im.p1pct + '%');
    setTxt('inc-p2', im.p2); setTxt('inc-p2-pct', im.p2pct + '%');
    setTxt('inc-p3', im.p3); setTxt('inc-p3-pct', im.p3pct + '%');
    setTxt('inc-p4', im.p4); setTxt('inc-p4-pct', im.p4pct + '%');
    setTxt('inc-avg-mttr', im.avgMttrLabel);

    makeChart('incPriorityDonut', {
        type: 'doughnut',
        data: { labels: ['P1-Kritis', 'P2-Tinggi', 'P3-Sedang', 'P4-Rendah'], datasets: [{ data: [im.p1, im.p2, im.p3, im.p4], backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#10b981'], borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } } }
    });

    makeChart('incTrendChart', {
        type: 'line',
        data: {
            labels: im.trend.labels,
            datasets: [
                { label: 'P1', data: im.trend.p1, borderColor: '#ef4444', tension: 0.3, pointRadius: 2 },
                { label: 'P2', data: im.trend.p2, borderColor: '#f59e0b', tension: 0.3, pointRadius: 2 },
                { label: 'P3', data: im.trend.p3, borderColor: '#eab308', tension: 0.3, pointRadius: 2 },
                { label: 'P4', data: im.trend.p4, borderColor: '#10b981', tension: 0.3, pointRadius: 2 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } } }
    });

    makeChart('incResolutionDonut', {
        type: 'doughnut',
        data: { labels: ['Selesai', 'Dalam Proses', 'Menunggu Vendor'], datasets: [{ data: [im.resolution.selesai, im.resolution.dalamProses, im.resolution.menungguVendor], backgroundColor: ['#0057B8', '#f59e0b', '#94a3b8'], borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } } }
    });
    setTxt('inc-resolution-pct', im.resolution.selesaiPct + '%');

    const listBody = document.getElementById('inc-list-table');
    if (listBody) {
        const prBg = { P1: 'bg-red-50 text-danger border-red-200', P2: 'bg-amber-50 text-warning border-amber-200' };
        listBody.innerHTML = im.list.map(r => `<tr class="hover:bg-slate-50">
            <td class="p-2 text-[10px] text-slate-400 font-mono">${r.id}</td>
            <td class="p-2 font-bold text-slate-800">${r.title}</td>
            <td class="p-2 text-center"><span class="text-[9.5px] font-bold px-2 py-0.5 rounded border ${prBg[r.priority] || 'bg-slate-50 text-slate-500 border-slate-200'}">${r.priority}</span></td>
            <td class="p-2 text-slate-500">${r.service}</td>
            <td class="p-2 text-center"><span class="text-[9.5px] font-bold px-2 py-0.5 rounded bg-blue-50 text-peruri-base border border-blue-200">${r.status}</span></td>
            <td class="p-2 text-center text-slate-500">${r.mttrEst}</td>
            <td class="p-2 text-slate-500">${r.owner}</td>
        </tr>`).join('');
    }

    const topAffEl = document.getElementById('inc-top-affected');
    if (topAffEl) topAffEl.innerHTML = im.topAffected.map(t => `<div class="flex justify-between text-[11px] py-1.5 border-b border-slate-100 last:border-0"><span class="text-slate-600">${t.name}</span><span class="font-bold text-slate-800 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center text-[10px]">${t.count}</span></div>`).join('');

    setTxt('inc-res-total-engineer', im.resourceAlloc.totalEngineer);
    setTxt('inc-res-handling', im.resourceAlloc.handling);
    setTxt('inc-res-utilization', im.resourceAlloc.utilization + '%');

    // ====================== MTTR ======================
    setTxt('mttr-avg', mt.avgLabel);
    setTxt('mttr-total-resolved', mt.totalResolved);
    setTxt('mttr-total-resolved-delta', '▲ ' + mt.totalResolvedDeltaPct + '%');
    setTxt('mttr-best', mt.bestLabel); setTxt('mttr-best-service', mt.bestService);
    setTxt('mttr-worst', mt.worstLabel); setTxt('mttr-worst-service', mt.worstService);
    setTxt('mttr-target', mt.targetLabel);

    makeChart('mttrTrendChart', {
        type: 'line',
        data: { labels: mt.trend.labels, datasets: [
            { label: 'MTTR (jam)', data: mt.trend.data, borderColor: '#0057B8', backgroundColor: 'rgba(0,87,184,0.08)', fill: true, tension: 0.35, pointRadius: 3 },
            { label: 'Target', data: mt.trend.labels.map(() => mt.trend.target), borderColor: '#ef4444', borderDash: [5, 4], pointRadius: 0 }
        ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } } }
    });

    makeChart('mttrByServiceChart', {
        type: 'bar',
        data: { labels: mt.byService.map(s => s.name), datasets: [{ label: 'MTTR (jam)', data: mt.byService.map(s => s.hrs), backgroundColor: '#0057B8', borderRadius: 4 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } } }
    });

    makeChart('mttrDistDonut', {
        type: 'doughnut',
        data: { labels: mt.distribution.map(d => d.label), datasets: [{ data: mt.distribution.map(d => d.pct), backgroundColor: mt.distribution.map(d => d.color), borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right', labels: { boxWidth: 8, font: { size: 9 } } } } }
    });

    const prioEl = document.getElementById('mttr-by-priority');
    if (prioEl) {
        const maxHrs = Math.max(...mt.byPriority.map(p => p.hrs));
        prioEl.innerHTML = mt.byPriority.map(p => `<div class="mb-3 last:mb-0">
            <div class="flex justify-between text-[10.5px] mb-1"><span class="font-bold text-slate-700">${p.label}</span><span class="font-bold text-slate-800">${p.text}</span></div>
            <div class="w-full bg-slate-100 rounded-full h-2"><div class="h-2 rounded-full" style="width:${(p.hrs / maxHrs * 100)}%;background:${p.color}"></div></div>
        </div>`).join('');
    }

    setTxt('mttr-cmp-current', mt.comparison.currentLabel);
    setTxt('mttr-cmp-current-period', mt.comparison.currentPeriod);
    setTxt('mttr-cmp-previous', mt.comparison.previousLabel);
    setTxt('mttr-cmp-previous-period', mt.comparison.previousPeriod);
    const cmpChangeEl = document.getElementById('mttr-cmp-change');
    if (cmpChangeEl) cmpChangeEl.innerHTML = `<i class="fa-solid fa-arrow-${mt.comparison.better ? 'down' : 'up'} mr-1"></i>${mt.comparison.changePct}% ${mt.comparison.better ? '(Lebih Baik)' : '(Memburuk)'}`;
    const cmpBar = document.getElementById('mttr-cmp-bar');
    if (cmpBar) cmpBar.style.width = Math.min(100, (mt.comparison.currentPeriod ? (mt.avgHrs / 5 * 100) : 50)) + '%';
}

// =========================================================================
// 4. TICKET & WORKLOAD  (Volume Ticket Performance + Backlog/Workload submenu)
// =========================================================================
let ticketVolumeView = 'daily'; // daily | weekly | monthly

async function bindTicketWorkload() {
    const t = await api.getTickets();
    const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    setTxt('tkt-total', t.total.toLocaleString('id-ID'));
    setTxt('tkt-total-delta', '▲ ' + t.totalDeltaPct + '%');

    const statusGrid = document.getElementById('tkt-status-grid');
    if (statusGrid) {
        const colorMap = { blue: 'text-peruri-base bg-blue-50 border-blue-200', amber: 'text-warning bg-amber-50 border-amber-200', orange: 'text-orange-500 bg-orange-50 border-orange-200', emerald: 'text-success bg-emerald-50 border-emerald-200', slate: 'text-slate-500 bg-slate-100 border-slate-200' };
        statusGrid.innerHTML = t.statusBreakdown.map(s => `<div class="border ${colorMap[s.color]} rounded-lg p-3 text-center">
            <div class="text-[9.5px] font-bold uppercase tracking-wide opacity-80 mb-1">${s.label}</div>
            <div class="text-xl font-extrabold">${s.value.toLocaleString('id-ID')}</div>
            <div class="text-[9px] mt-1">${s.pct}% &middot; ${s.deltaPct >= 0 ? '▲' : '▼'} ${Math.abs(s.deltaPct)}%</div>
        </div>`).join('');
    }

    renderTicketVolumeChart(t, ticketVolumeView);

    const catEl = document.getElementById('tkt-categories');
    if (catEl) {
        catEl.innerHTML = t.categories.map(c => `<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center flex-1">
            <div class="text-[9.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">${c.name}</div>
            <div class="text-lg font-extrabold text-slate-800">${c.total.toLocaleString('id-ID')}</div>
            <div class="text-[9.5px] text-peruri-base font-bold">${c.pct}% dari total</div>
        </div>`).join('');
    }

    // ---- Ticket Backlog & Workload Distribution (submenu tab) ----
    setTxt('backlog-p1', t.backlog.p1);
    setTxt('backlog-p2', t.backlog.p2);
    setTxt('backlog-p3', t.backlog.p3);
    setTxt('backlog-p4', t.backlog.p4);

    const tierBody = document.getElementById('backlog-tier-table');
    if (tierBody) {
        let h = '';
        t.backlog.tiers.forEach(r => {
            h += `<tr class="hover:bg-slate-50"><td class="p-3 font-bold text-slate-700">${r.tier}</td>
                  <td class="p-3 text-center text-danger font-bold">${r.p1}</td>
                  <td class="p-3 text-center text-warning font-bold">${r.p2}</td>
                  <td class="p-3 text-center text-blue-500 font-bold">${r.p3}</td>
                  <td class="p-3 text-center text-success font-bold">${r.p4}</td>
                  <td class="p-3 text-center font-extrabold text-slate-800 bg-slate-100 border-l border-slate-200">${r.total}</td></tr>`;
        });
        h += `<tr class="bg-slate-100 border-t border-slate-300"><td class="p-3 font-extrabold text-slate-800">Total Beban Kerja</td>
              <td class="p-3 text-center text-danger font-extrabold">${t.backlog.p1}</td>
              <td class="p-3 text-center text-warning font-extrabold">${t.backlog.p2}</td>
              <td class="p-3 text-center text-blue-500 font-extrabold">${t.backlog.p3}</td>
              <td class="p-3 text-center text-success font-extrabold">${t.backlog.p4}</td>
              <td class="p-3 text-center font-extrabold text-slate-800 bg-slate-200 border-l border-slate-300">${t.backlog.total}</td></tr>`;
        tierBody.innerHTML = h;
    }
}

function renderTicketVolumeChart(t, view) {
    ticketVolumeView = view;
    const dataSrc = { daily: t.dailyVolume, weekly: t.weeklyVolume, monthly: t.monthlyVolume }[view];
    makeChart('ticketChart', {
        type: 'bar',
        data: { labels: dataSrc.labels, datasets: [{ label: 'Volume Ticket', data: dataSrc.data, backgroundColor: '#0057B8', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } } }
    });
    document.querySelectorAll('.tkt-view-btn').forEach(b => {
        const active = b.getAttribute('data-view') === view;
        b.classList.toggle('bg-peruri-base', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('text-slate-500', !active);
        b.classList.toggle('bg-white', !active);
    });
}

function switchTicketView(view) {
    api.getTickets().then(t => renderTicketVolumeChart(t, view));
}

function switchTab(groupId, tabId, btn) {
    document.querySelectorAll(`#${groupId} .tab-panel`).forEach(p => p.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelectorAll(`#${groupId}-tabs .tab-btn`).forEach(b => {
        b.classList.remove('bg-peruri-base', 'text-white', 'shadow-sm');
        b.classList.add('text-slate-500');
    });
    btn.classList.add('bg-peruri-base', 'text-white', 'shadow-sm');
    btn.classList.remove('text-slate-500');
}

// =========================================================================
// CHANGE & RELEASE (existing, kept dynamic)
// =========================================================================
async function bindEngineChange() {
    const c = await api.getChanges();
    const circSuc = document.getElementById('donut-succ');
    if (circSuc) {
        circSuc.setAttribute('stroke-dasharray', `${c.success} 100`);
        document.getElementById('donut-emer').setAttribute('stroke-dasharray', `${c.emergency} 100`);
        document.getElementById('donut-emer').setAttribute('stroke-dashoffset', `-${c.success}`);
        document.getElementById('donut-fail').setAttribute('stroke-dasharray', `${c.failed} 100`);
        document.getElementById('donut-fail').setAttribute('stroke-dashoffset', `-${c.success + c.emergency}`);

        document.getElementById('donut-lbl-succ').textContent = `${c.success}%`;
        document.getElementById('donut-lbl-succ-t').textContent = `${c.success}%`;
        document.getElementById('donut-lbl-emer-t').textContent = `${c.emergency}%`;
        document.getElementById('donut-lbl-fail-t').textContent = `${c.failed}%`;
        document.getElementById('val-unauth').textContent = c.unauthorized;
    }
}

// =========================================================================
// 5. CUSTOMER EXPERIENCE (CX)
// =========================================================================
async function bindEngineCX() {
    const cx = await api.getCx();
    const setTxt = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    const fcrEl = document.getElementById('cx-fcr');
    if (fcrEl) {
        fcrEl.setAttribute('data-target', cx.fcr);
        document.getElementById('cx-nps').setAttribute('data-target', cx.nps);
    }

    // Product & Agent satisfaction rings
    setTxt('cx-prod-score', cx.productSat.pct + '%');
    setTxt('cx-prod-out5', cx.productSat.outOf5.toFixed(2) + ' / 5');
    setTxt('cx-prod-label', cx.productSat.label);
    setTxt('cx-prod-delta', '▲ ' + cx.productSat.deltaPct + '% dibanding periode sebelumnya');

    setTxt('cx-agent-score', cx.agentSat.pct + '%');
    setTxt('cx-agent-out5', cx.agentSat.outOf5.toFixed(2) + ' / 5');
    setTxt('cx-agent-label', cx.agentSat.label);
    setTxt('cx-agent-delta', '▲ ' + cx.agentSat.deltaPct + '% dibanding periode sebelumnya');

    const fillRing = (id, pct) => { const r = document.getElementById(id); if (r) { const circ = 2 * Math.PI * 15.9; r.style.strokeDasharray = `${pct} 100`; } };
    fillRing('cx-prod-ring', cx.productSat.pct);
    fillRing('cx-agent-ring', cx.agentSat.pct);

    // Feedback breakdown (product)
    setTxt('cx-prod-pos', cx.productFeedback.positive + '%'); setTxt('cx-prod-pos-n', cx.productFeedback.positiveCount + ' pelanggan');
    setTxt('cx-prod-neu', cx.productFeedback.neutral + '%'); setTxt('cx-prod-neu-n', cx.productFeedback.neutralCount + ' pelanggan');
    setTxt('cx-prod-neg', cx.productFeedback.negative + '%'); setTxt('cx-prod-neg-n', cx.productFeedback.negativeCount + ' pelanggan');

    // Feedback breakdown (agent)
    setTxt('cx-agent-pos', cx.agentFeedback.positive + '%'); setTxt('cx-agent-pos-n', cx.agentFeedback.positiveCount + ' pelanggan');
    setTxt('cx-agent-neu', cx.agentFeedback.neutral + '%'); setTxt('cx-agent-neu-n', cx.agentFeedback.neutralCount + ' pelanggan');
    setTxt('cx-agent-neg', cx.agentFeedback.negative + '%'); setTxt('cx-agent-neg-n', cx.agentFeedback.negativeCount + ' pelanggan');

    setTimeout(() => {
        document.getElementById('cx-pos').style.width = `${cx.productFeedback.positive}%`;
        document.getElementById('cx-neu').style.width = `${cx.productFeedback.neutral}%`;
        document.getElementById('cx-neg').style.width = `${cx.productFeedback.negative}%`;
        document.getElementById('cx-lbl-pos').textContent = `${cx.productFeedback.positive}%`;
        document.getElementById('cx-lbl-neu').textContent = `${cx.productFeedback.neutral}%`;
        document.getElementById('cx-lbl-neg').textContent = `${cx.productFeedback.negative}%`;
    }, 100);

    const sugEl = document.getElementById('cx-suggestions');
    if (sugEl) {
        sugEl.innerHTML = cx.suggestions.map(s => `<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 min-w-[240px] max-w-[260px] shrink-0">
            <p class="text-[11px] text-slate-600 italic leading-relaxed">"${s.text}"</p>
            <div class="flex items-center gap-1.5 mt-2 text-[9.5px] text-slate-400"><i class="fa-solid fa-user-circle"></i> ${s.user} &middot; ${s.date}</div>
        </div>`).join('');
    }
}

// =========================================================================
// 6. PRODUCTIVITY & KPI GRADING  (CRUD: Add Rule + Edit Rule + Delete)
// =========================================================================
async function bindProd() {
    const rules = await api.getProductivityRules();
    const grades = await api.getGrades();
    renderProdTable(rules);
    renderGradeTable(grades);
}

function renderProdTable(rules) {
    const tbody = document.getElementById('prod-table-body');
    if (!tbody) return;
    let h = '';
    rules.forEach(r => {
        const tot = r.count * r.mins;
        const hrs = ((tot / 60) / 22).toFixed(2);
        const w = hrs > 8 ? 'bg-red-50 text-danger border-red-200' : 'bg-slate-50 text-slate-500 border-transparent';
        h += `<tr class="hover:bg-slate-50">
            <td class="p-3 font-bold">${r.emp_name}</td>
            <td class="p-3">${r.task_name}</td>
            <td class="p-3 text-center font-bold">${r.count}</td>
            <td class="p-3 text-center font-bold text-peruri-base">${r.mins}</td>
            <td class="p-3 text-center font-bold text-slate-500">${tot}</td>
            <td class="p-3 text-center font-bold px-2 py-1 rounded border ${w}">${hrs}</td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="openEditProdRule('${r.id}')" class="crud-action edit-btn text-slate-400 hover:text-peruri-base transition-colors" title="Edit Rule"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="askDeleteProdRule('${r.id}')" class="crud-action delete-btn text-slate-400 hover:text-danger transition-colors" title="Hapus Rule"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = h || '<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">Belum ada rule produktivitas.</td></tr>';
    if (!currUser.edit) tbody.querySelectorAll('.crud-action').forEach(el => el.style.display = 'none');
}

function renderGradeTable(grades) {
    const gBody = document.getElementById('grade-table-body');
    if (!gBody) return;
    let h = '';
    grades.forEach(g => {
        const badgeColor = g.grade === 'A' ? 'success' : (g.grade === 'B' ? 'peruri-base' : 'warning');
        const badgeBg = g.grade === 'A' ? 'bg-emerald-50 border-emerald-200' : (g.grade === 'B' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200');
        h += `<tr class="hover:bg-slate-50 transition-colors"><td class="px-5 py-3 font-bold text-slate-800">${g.emp_name} <span class="text-[9px] font-normal text-slate-500 ml-2 border border-slate-200 px-1 rounded bg-white">${g.role}</span></td><td class="px-5 py-3 text-center">${g.tasks_done}</td><td class="px-5 py-3 text-center">${g.actual_hrs}h</td><td class="px-5 py-3 text-center font-bold text-slate-800 text-sm">${g.score}</td><td class="px-5 py-3 text-center"><span class="${badgeBg} text-${badgeColor} text-[10px] font-bold px-2 py-1 rounded border">Grade ${g.grade}</span></td></tr>`;
    });
    gBody.innerHTML = h;
}

function prodRuleFormHtml(rule) {
    rule = rule || { emp_name: '', task_name: '', count: '', mins: '' };
    return `<form id="prod-rule-form" onsubmit="submitProdRule(event)" class="space-y-4">
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Employee</label><input required type="text" id="f-emp-name" value="${rule.emp_name}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Sarah M."></div>
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Task Category</label><input required type="text" id="f-task-name" value="${rule.task_name}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Infrastructure Routing"></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Count</label><input required type="number" min="0" id="f-count" value="${rule.count}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mins / Task</label><input required type="number" min="0" id="f-mins" value="${rule.mins}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-500"><b>Rumus:</b> ((Monthly Count &times; Mins/Task) / 60) / 22 Hari Kerja. Indikator merah jika &gt; 8 jam/hari.</div>
        <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">Batal</button>
            <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold text-white bg-peruri-base hover:bg-peruri-dark shadow-sm"><i class="fa-solid fa-floppy-disk mr-1"></i> Simpan Rule</button>
        </div>
    </form>`;
}

function openAddProdRule() {
    if (!currUser.edit) return;
    editingContext = { type: 'prod-rule', id: null };
    openModal('Tambah Productivity Rule', prodRuleFormHtml(null));
}

function openEditProdRule(id) {
    if (!currUser.edit) return;
    const rule = api.getProdRule(id);
    if (!rule) return;
    editingContext = { type: 'prod-rule', id };
    openModal('Edit Productivity Rule', prodRuleFormHtml(rule));
}

function submitProdRule(e) {
    e.preventDefault();
    const payload = {
        emp_name: document.getElementById('f-emp-name').value.trim(),
        task_name: document.getElementById('f-task-name').value.trim(),
        count: parseFloat(document.getElementById('f-count').value) || 0,
        mins: parseFloat(document.getElementById('f-mins').value) || 0
    };
    if (!payload.emp_name || !payload.task_name) { showToast('Nama Employee dan Task Category wajib diisi', 'danger'); return; }

    if (editingContext && editingContext.id) {
        api.updateProdRule(editingContext.id, payload);
        api.addLog('Productivity Setup', `Updated rule ${editingContext.id} (${payload.emp_name})`, 'UPDATE', 'warning');
        showToast('Rule berhasil diperbarui', 'success');
    } else {
        const newRule = api.addProdRule(payload);
        api.addLog('Productivity Setup', `Added new rule ${newRule.id} (${payload.emp_name})`, 'CREATE', 'success');
        showToast('Rule baru berhasil ditambahkan', 'success');
    }
    closeModal();
    renderProdTable(mockDatabase.productivityRules);
}

function askDeleteProdRule(id) {
    if (!currUser.edit) return;
    const rule = api.getProdRule(id);
    openConfirm(`Hapus rule produktivitas untuk "${rule ? rule.emp_name : id}"? Tindakan ini tidak dapat dibatalkan.`, () => {
        api.deleteProdRule(id);
        api.addLog('Productivity Setup', `Deleted rule ${id}`, 'DELETE', 'warning');
        showToast('Rule berhasil dihapus', 'info');
        renderProdTable(mockDatabase.productivityRules);
    }, { title: 'Hapus Productivity Rule', okLabel: 'Ya, Hapus', okColor: 'danger' });
}

function recalcGrades(btn) {
    if (!currUser.edit) return;
    const ot = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = ot; btn.disabled = false;
        showToast('Nilai KPI berhasil dikalkulasi ulang', 'success');
        api.addLog('KPI Grading', 'Recalculated final grades for all employees', 'UPDATE', 'warning');
        renderGradeTable(mockDatabase.grades);
    }, 800);
}

// =========================================================================
// 7. DIRECT REPORT RATING
// =========================================================================
async function bindReview() {
    const rev = await api.getReview360();
    renderReviewDimensions(rev);
    renderReviewParticipants(rev);
}

function renderReviewDimensions(rev) {
    const el = document.getElementById('review-dimensions');
    if (!el) return;
    let h = '';
    rev.dimensions.forEach((d, idx) => {
        h += `<div class="mb-6 last:mb-0">
            <div class="flex justify-between items-center mb-2"><span class="text-xs font-bold text-slate-700">${idx + 1}. ${d.label}</span><span class="text-[10px] font-bold text-peruri-base bg-blue-50 px-2 py-1 rounded border border-blue-200 rev-weight-lbl" data-dim="${d.id}">${d.weight}%</span></div>
            <input type="range" min="0" max="100" value="${d.weight}" data-dim="${d.id}" class="w-full accent-peruri-base cursor-pointer rev-slider" oninput="updateReviewSliderLabel(this)">
        </div>`;
    });
    el.innerHTML = h;
    updateReviewTotal();
}

function updateReviewSliderLabel(slider) {
    const dim = slider.getAttribute('data-dim');
    document.querySelector(`.rev-weight-lbl[data-dim="${dim}"]`).textContent = slider.value + '%';
    updateReviewTotal();
}

function updateReviewTotal() {
    const totalEl = document.getElementById('review-total-weight');
    if (!totalEl) return;
    let sum = 0;
    document.querySelectorAll('.rev-slider').forEach(s => sum += parseFloat(s.value));
    totalEl.textContent = sum + '%';
    totalEl.classList.toggle('text-danger', sum !== 100);
    totalEl.classList.toggle('text-success', sum === 100);
}

function saveReviewWeights(btn) {
    if (!currUser.edit) return;
    let sum = 0;
    const weights = {};
    document.querySelectorAll('.rev-slider').forEach(s => { weights[s.getAttribute('data-dim')] = parseFloat(s.value); sum += parseFloat(s.value); });
    if (sum !== 100) { showToast(`Total bobot harus 100% (saat ini ${sum}%)`, 'danger'); return; }

    const ot = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    setTimeout(() => {
        api.updateReviewWeights(weights);
        btn.innerHTML = ot; btn.disabled = false;
        showToast('Bobot dimensi evaluasi berhasil disimpan', 'success');
        api.addLog('360 Review Config', 'Updated evaluation dimension weights', 'UPDATE', 'warning');
    }, 700);
}

function renderReviewParticipants(rev) {
    const tbody = document.getElementById('review-participant-table');
    if (!tbody) return;
    const statusBg = { 'Selesai': 'bg-emerald-50 text-success border-emerald-200', 'Proses': 'bg-amber-50 text-warning border-amber-200', 'Menunggu': 'bg-slate-100 text-slate-500 border-slate-200' };
    let h = '';
    rev.participants.forEach(p => {
        h += `<tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3 font-bold text-slate-800">${p.name}</td>
            <td class="p-3 text-slate-500">${p.role}</td>
            <td class="p-3 text-slate-500">${p.reviewer}</td>
            <td class="p-3 text-center"><span class="text-[9.5px] font-bold px-2 py-0.5 rounded border ${statusBg[p.status] || statusBg['Menunggu']}">${p.status}</span></td>
            <td class="p-3 text-center"><button onclick="askRemoveParticipant('${p.id}')" class="crud-action delete-btn text-slate-400 hover:text-danger transition-colors"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`;
    });
    tbody.innerHTML = h || '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-xs">Belum ada peserta review.</td></tr>';
    if (!currUser.edit) tbody.querySelectorAll('.crud-action').forEach(el => el.style.display = 'none');
}

function participantFormHtml() {
    return `<form id="participant-form" onsubmit="submitParticipant(event)" class="space-y-4">
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Employee</label><input required type="text" id="f-part-name" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Rizky Ananda"></div>
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role / Jabatan</label><input required type="text" id="f-part-role" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: QA Engineer"></div>
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reviewer</label>
            <select id="f-part-reviewer" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base bg-white">
                <option>Peer + Atasan</option><option>Atasan</option><option>Peer</option><option>Klien Internal</option>
            </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">Batal</button>
            <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold text-white bg-peruri-base hover:bg-peruri-dark shadow-sm"><i class="fa-solid fa-plus mr-1"></i> Tambah Peserta</button>
        </div>
    </form>`;
}

function openAddParticipant() {
    if (!currUser.edit) return;
    openModal('Tambah Peserta Review 360', participantFormHtml());
}

function submitParticipant(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('f-part-name').value.trim(),
        role: document.getElementById('f-part-role').value.trim(),
        reviewer: document.getElementById('f-part-reviewer').value,
        status: 'Menunggu'
    };
    if (!payload.name || !payload.role) { showToast('Nama dan Role wajib diisi', 'danger'); return; }
    const p = api.addReviewParticipant(payload);
    api.addLog('360 Review Config', `Added participant ${p.name}`, 'CREATE', 'success');
    showToast('Peserta review berhasil ditambahkan', 'success');
    closeModal();
    renderReviewParticipants(mockDatabase.review360);
}

function askRemoveParticipant(id) {
    if (!currUser.edit) return;
    openConfirm('Hapus peserta ini dari matriks review 360?', () => {
        api.removeReviewParticipant(id);
        api.addLog('360 Review Config', `Removed participant ${id}`, 'DELETE', 'warning');
        showToast('Peserta berhasil dihapus', 'info');
        renderReviewParticipants(mockDatabase.review360);
    }, { title: 'Hapus Peserta', okLabel: 'Ya, Hapus', okColor: 'danger' });
}

// =========================================================================
// 8. STRATEGIC OKR & RACI MAPPING
// =========================================================================
async function bindOkr() {
    const okrs = await api.getOkr();
    renderOkrList(okrs);
}

function renderOkrList(okrs) {
    const container = document.getElementById('okr-list-container');
    if (!container) return;
    if (!okrs.length) { container.innerHTML = '<p class="text-center text-slate-400 text-xs py-10">Belum ada Objective yang dibuat. Klik "New OKR" untuk memulai.</p>'; return; }

    let h = '';
    okrs.forEach((o, idx) => {
        const raciRows = o.raci.map(r => `<tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-800">${r.task}</td>
            <td class="p-3 text-center"><span class="bg-blue-50 text-peruri-base font-bold px-2 py-0.5 rounded border border-blue-200 text-[10px]">A: ${r.a}</span></td>
            <td class="p-3 text-center"><span class="bg-emerald-50 text-success font-bold px-2 py-0.5 rounded border border-emerald-200 text-[10px]">R: ${r.r}</span></td>
            <td class="p-3 text-center"><span class="bg-amber-50 text-warning font-bold px-2 py-0.5 rounded border border-amber-200 text-[10px]">C: ${r.c}</span></td>
            <td class="p-3 text-center"><span class="bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded text-[10px]">I: ${r.i}</span></td>
        </tr>`).join('');

        const progColor = o.progress >= 75 ? 'success' : (o.progress >= 40 ? 'warning' : 'danger');

        h += `<div class="border border-slate-200 rounded-xl p-5 bg-slate-50 mb-6 last:mb-0">
            <div class="flex justify-between items-start mb-5 flex-wrap gap-3">
                <div class="flex gap-4">
                    <div class="w-12 h-12 bg-white border border-slate-200 rounded-lg text-peruri-base font-bold text-xl flex items-center justify-center shadow-sm shrink-0">${o.id.split('-')[0]}</div>
                    <div>
                        <h4 class="font-bold text-slate-800 text-[14px]">${o.title}</h4>
                        <div class="flex items-center gap-2 mt-2 text-[10px] flex-wrap">
                            <span class="bg-white border border-slate-200 px-2 py-1 rounded text-slate-500"><i class="fa-regular fa-calendar mr-1"></i> Target ${o.target}</span>
                            <span class="bg-blue-50 border border-blue-200 text-peruri-base font-bold px-2 py-1 rounded">Weight: ${o.weight}%</span>
                        </div>
                    </div>
                </div>
                <div class="bg-white border border-slate-200 px-4 py-2 rounded-lg text-center shadow-sm">
                    <span class="block text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Progress</span><span class="font-extrabold text-2xl text-${progColor}">${o.progress}%</span>
                </div>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div class="p-3 border-b border-slate-200 flex justify-between items-center">
                    <h5 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RACI Breakdown Matrix</h5>
                    <button onclick="openAddRaci('${o.id}')" class="crud-action text-[10px] font-bold text-peruri-base hover:text-peruri-dark"><i class="fa-solid fa-plus mr-1"></i>Tambah Task</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-[11px]">
                        <thead class="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <tr><th class="p-3">Task / Module Scope</th><th class="p-3 text-center">Accountable</th><th class="p-3 text-center">Responsible</th><th class="p-3 text-center">Consulted</th><th class="p-3 text-center">Informed</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">${raciRows || '<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada task RACI.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = h;
    if (!currUser.edit) container.querySelectorAll('.crud-action').forEach(el => el.style.display = 'none');
}

function okrFormHtml() {
    return `<form id="okr-form" onsubmit="submitOkr(event)" class="space-y-4">
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Judul Objective</label><input required type="text" id="f-okr-title" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Tingkatkan Automation Rate ke atas 50%"></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Periode</label><input required type="text" id="f-okr-target" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Q4 2026"></div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Weight (%)</label><input required type="number" min="1" max="100" id="f-okr-weight" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="35"></div>
        </div>
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Progress Awal (%)</label><input type="number" min="0" max="100" id="f-okr-progress" value="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
        <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">Batal</button>
            <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold text-white bg-peruri-base hover:bg-peruri-dark shadow-sm"><i class="fa-solid fa-plus mr-1"></i> Buat OKR</button>
        </div>
    </form>`;
}

function openAddOkr() {
    if (!currUser.edit) return;
    openModal('Tambah Strategic OKR Baru', okrFormHtml());
}

function submitOkr(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('f-okr-title').value.trim(),
        target: document.getElementById('f-okr-target').value.trim(),
        weight: parseFloat(document.getElementById('f-okr-weight').value) || 0,
        progress: parseFloat(document.getElementById('f-okr-progress').value) || 0,
        raci: []
    };
    if (!payload.title || !payload.target) { showToast('Judul dan Target wajib diisi', 'danger'); return; }
    const o = api.addOkr(payload);
    api.addLog('OKR Mapping', `Created new OKR: ${o.title}`, 'CREATE', 'success');
    showToast('Strategic OKR baru berhasil dibuat', 'success');
    closeModal();
    renderOkrList(mockDatabase.okr);
}

function raciFormHtml(okrId) {
    return `<form id="raci-form" onsubmit="submitRaci(event, '${okrId}')" class="space-y-4">
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Task / Module Scope</label><input required type="text" id="f-raci-task" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Security Hardening"></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Accountable (A)</label><input required type="text" id="f-raci-a" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Responsible (R)</label><input required type="text" id="f-raci-r" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Consulted (C)</label><input required type="text" id="f-raci-c" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Informed (I)</label><input required type="text" id="f-raci-i" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base"></div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">Batal</button>
            <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold text-white bg-peruri-base hover:bg-peruri-dark shadow-sm"><i class="fa-solid fa-plus mr-1"></i> Tambah</button>
        </div>
    </form>`;
}

function openAddRaci(okrId) {
    if (!currUser.edit) return;
    openModal('Tambah RACI Task', raciFormHtml(okrId));
}

function submitRaci(e, okrId) {
    e.preventDefault();
    const row = {
        task: document.getElementById('f-raci-task').value.trim(),
        a: document.getElementById('f-raci-a').value.trim(),
        r: document.getElementById('f-raci-r').value.trim(),
        c: document.getElementById('f-raci-c').value.trim(),
        i: document.getElementById('f-raci-i').value.trim()
    };
    if (!row.task) { showToast('Task/Module Scope wajib diisi', 'danger'); return; }
    api.addRaciRow(okrId, row);
    api.addLog('OKR Mapping', `Added RACI task "${row.task}" to ${okrId}`, 'CREATE', 'success');
    showToast('Task RACI berhasil ditambahkan', 'success');
    closeModal();
    renderOkrList(mockDatabase.okr);
}

// =========================================================================
// 9. ROLE & ACCESS MANAGEMENT  (Users CRUD)
// =========================================================================
const roleOptions = ['Super Admin', 'PMO / Setup', 'Employee / PIC'];

async function bindUsers() {
    const users = await api.getUsers();
    renderUserTable(users);
}

function renderUserTable(users) {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    const roleIcon = { 'Super Admin': ['fa-user-shield', 'bg-blue-50 text-peruri-base'], 'PMO / Setup': ['fa-user-gear', 'bg-amber-50 text-warning'], 'Employee / PIC': ['fa-eye', 'bg-slate-100 text-slate-500'] };
    let h = '';
    users.forEach(u => {
        const ic = roleIcon[u.role] || roleIcon['Employee / PIC'];
        const statusBg = u.status === 'Active' ? 'bg-emerald-50 text-success border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200';
        h += `<tr class="hover:bg-slate-50 transition-colors">
            <td class="p-3">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg ${ic[1]} flex items-center justify-center shrink-0"><i class="fa-solid ${ic[0]} text-xs"></i></div>
                    <div><div class="font-bold text-slate-800 text-[12px]">${u.name}</div><div class="text-[10px] text-slate-400">@${u.username}</div></div>
                </div>
            </td>
            <td class="p-3 text-slate-600">${u.role}</td>
            <td class="p-3 text-slate-500">${u.dept}</td>
            <td class="p-3 text-center"><span class="text-[9.5px] font-bold px-2 py-0.5 rounded border ${statusBg}">${u.status.toUpperCase()}</span></td>
            <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="openEditUser('${u.id}')" class="crud-action edit-btn text-slate-400 hover:text-peruri-base transition-colors" title="Edit User"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="askDeleteUser('${u.id}')" class="crud-action delete-btn text-slate-400 hover:text-danger transition-colors" title="Hapus User"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = h || '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-xs">Belum ada user terdaftar.</td></tr>';
    if (!currUser.edit) tbody.querySelectorAll('.crud-action').forEach(el => el.style.display = 'none');
}

function userFormHtml(user) {
    user = user || { name: '', username: '', role: 'Employee / PIC', dept: '', status: 'Active' };
    const roleOpts = roleOptions.map(r => `<option value="${r}" ${user.role === r ? 'selected' : ''}>${r}</option>`).join('');
    return `<form id="user-form" onsubmit="submitUser(event)" class="space-y-4">
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label><input required type="text" id="f-user-name" value="${user.name}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: Rizky Ananda"></div>
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username</label><input required type="text" id="f-user-username" value="${user.username}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: rizky.ananda"></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label><select id="f-user-role" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base bg-white">${roleOpts}</select></div>
            <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label><select id="f-user-status" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base bg-white"><option ${user.status === 'Active' ? 'selected' : ''}>Active</option><option ${user.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></div>
        </div>
        <div><label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Departemen</label><input required type="text" id="f-user-dept" value="${user.dept}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-peruri-base" placeholder="Contoh: IT Infrastructure"></div>
        <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50">Batal</button>
            <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold text-white bg-peruri-base hover:bg-peruri-dark shadow-sm"><i class="fa-solid fa-floppy-disk mr-1"></i> Simpan User</button>
        </div>
    </form>`;
}

function openAddUser() {
    if (!currUser.edit) return;
    editingContext = { type: 'user', id: null };
    openModal('Tambah User Baru', userFormHtml(null));
}

function openEditUser(id) {
    if (!currUser.edit) return;
    const user = api.getUser(id);
    if (!user) return;
    editingContext = { type: 'user', id };
    openModal('Edit User', userFormHtml(user));
}

function submitUser(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('f-user-name').value.trim(),
        username: document.getElementById('f-user-username').value.trim().toLowerCase(),
        role: document.getElementById('f-user-role').value,
        status: document.getElementById('f-user-status').value,
        dept: document.getElementById('f-user-dept').value.trim()
    };
    if (!payload.name || !payload.username || !payload.dept) { showToast('Semua field wajib diisi', 'danger'); return; }

    if (editingContext && editingContext.id) {
        api.updateUser(editingContext.id, payload);
        api.addLog('User Management', `Updated user ${payload.username} (${payload.role})`, 'UPDATE', 'warning');
        showToast('Data user berhasil diperbarui', 'success');
    } else {
        const u = api.addUser(payload);
        api.addLog('User Management', `Added new user ${u.username} (${payload.role})`, 'CREATE', 'success');
        showToast('User baru berhasil ditambahkan', 'success');
    }
    closeModal();
    renderUserTable(mockDatabase.users);
}

function askDeleteUser(id) {
    if (!currUser.edit) return;
    const user = api.getUser(id);
    openConfirm(`Hapus user "${user ? user.name : id}" dari sistem? Akses login pengguna ini akan dicabut.`, () => {
        api.deleteUser(id);
        api.addLog('User Management', `Deleted user ${id}`, 'DELETE', 'warning');
        showToast('User berhasil dihapus', 'info');
        renderUserTable(mockDatabase.users);
    }, { title: 'Hapus User', okLabel: 'Ya, Hapus', okColor: 'danger' });
}

// =========================================================================
// 10. ENTERPRISE AUDIT LOGS  (dynamic table + real CSV export)
// =========================================================================
async function renderLogs() {
    const lg = await api.getAuditLogs();
    const tbody = document.getElementById('audit-table-body');
    if (tbody) {
        let h = '';
        lg.forEach(l => {
            const bg = l.color === 'warning' ? 'bg-amber-50 border-amber-200 text-warning' : (l.color === 'success' ? 'bg-emerald-50 border-emerald-200 text-success' : (l.color === 'danger' ? 'bg-red-50 border-red-200 text-danger' : 'bg-blue-50 border-blue-200 text-peruri-base'));
            h += `<tr class="hover:bg-slate-50"><td class="py-3 px-4 text-[10px] text-slate-500 whitespace-nowrap">${l.time}</td><td class="py-3 px-4 font-bold text-slate-800 text-[11px] whitespace-nowrap">${l.user}</td><td class="py-3 px-4"><span class="bg-white border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold shadow-sm whitespace-nowrap">${l.module}</span></td><td class="py-3 px-4 text-[11px] text-slate-600">${l.detail}</td><td class="py-3 px-4 text-center"><span class="text-[9px] font-bold px-2 py-0.5 rounded border ${bg}">${l.type}</span></td></tr>`;
        });
        tbody.innerHTML = h || '<tr><td colspan="5" class="p-6 text-center text-slate-400 text-xs">Belum ada aktivitas tercatat.</td></tr>';
    }
    const countEl = document.getElementById('audit-log-count');
    if (countEl) countEl.textContent = lg.length + ' entri';
}

function csvEscape(val) {
    const s = String(val === undefined || val === null ? '' : val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function exportData(type) {
    const logs = mockDatabase.auditLogs;
    if (type === 'CSV') {
        const headers = ['Waktu', 'User', 'Modul', 'Detail Log', 'Tipe'];
        const rows = logs.map(l => [l.time, l.user, l.module, l.detail, l.type].map(csvEscape).join(','));
        const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `DSOC_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`File ${fileName} berhasil diunduh (${logs.length} baris)`, 'success');
        api.addLog('Export', `Downloaded Audit Logs as CSV (${logs.length} entries)`, 'INFO', 'blue');
        renderLogs();
    } else {
        showToast(`Merender dokumen ${type}...`, 'info');
        setTimeout(() => {
            showToast(`Dokumen ${type} berhasil diunduh.`, 'success');
            api.addLog('Export', `Downloaded Audit Logs as ${type}`, 'INFO', 'blue');
            renderLogs();
        }, 1200);
    }
}

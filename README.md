# PERURI DSOC - Enterprise Portal SPA

Sistem DSOC Modular dengan desain Biru PERURI, 4 Menu Utama + Dropdown, dan Role-Based Access Control (RBAC).
Seluruh metrik bersumber dari `ITSM_Operations_Dashboard.pdf` dan dokumen Portfolio Management (DSOC & OKR).

## KREDENSIAL LOGIN & ROLE
Username bebas ketik salah satu dari daftar di bawah (case-insensitive), password untuk semua role adalah `password123`:
1. `admin` : Super Admin (Full Control, semua 12 halaman).
2. `manager` : PMO/Manager (Operations Engine + Portfolio & HC, tab Admin disembunyikan).
3. `viewer` : Employee/PIC (Read-Only — Operations Engine saja, semua form/tombol CRUD disembunyikan).

Salah memasukkan username/password akan menampilkan notifikasi toast + border merah + shake pada form login.

## CARA MENJALANKAN (WAJIB LOKAL SERVER)
Gunakan Terminal di VS Code:
```
npm install
npm run dev
```
*(PENTING: Jangan double-click file index.html — fungsi fetch() untuk memuat pages/*.html akan diblokir browser tanpa local server.)*

## STRUKTUR MENU
1. **Executive Dashboard** — Live Scorecard (5 KPI: Uptime, SLA, Open Incident, MTTR, CSAT) + filter tanggal & proyek + tren 30 hari + distribusi incident.
2. **Operations Engine**
   - Performance & Avail — Service Uptime + SLA Compliance
   - Incident & MTTR Control — Active Incident Matrix (P1-P4) + MTTR Dashboard
   - Ticket & Workload — Volume Ticket Performance (tab) + Ticket Backlog & Workload Distribution (tab)
   - Change & Release
   - Customer Experience (CX) — CSAT, FCR, NPS
3. **Portfolio & HC**
   - Productivity & KPI — CRUD Rule (Add/Edit/Delete) + KPI Grading
   - 360 Review Matrix — 4 dimensi bobot + CRUD peserta
   - Strategic OKR & RACI — multi-Objective + RACI breakdown per task
4. **Admin & Security**
   - Role Management — CRUD user (Add/Edit/Delete)
   - API & Integration Sync
   - Enterprise Audit Logs — dinamis, export CSV nyata (download file)

## CATATAN TEKNIS
- Data disimpan di `js/db.js` (`mockDatabase`, in-memory, reset saat full page reload / F5). Untuk terhubung ke backend nyata, set `CONFIG.USE_MOCK = false` dan sesuaikan `CONFIG.API_BASE_URL` di `js/db.js`.
- Setiap aksi CRUD, login/logout, filter, dan export otomatis tercatat ke Audit Log.
- Konfirmasi popup muncul untuk: Logout dan semua aksi Delete.

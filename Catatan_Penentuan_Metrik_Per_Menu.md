# Catatan Penentuan Metrik per Menu — DSOC Portal

Dokumen ini merangkum metrik apa saja yang tampil di tiap halaman, dari mana sumbernya
(PDF/dokumen mana), dan di mana data itu didefinisikan di kode (`js/db.js`) supaya mudah
diubah/di-maintain ke depannya. Menggantikan `Metrics_Definition_DSOC.txt` yang sudah usang.

Sumber dokumen yang dipakai:
- **[A]** `ITSM_Operations_Dashboard.pdf` — sumber utama, paling detail per-metrik
- **[B]** `MAKALAH_DSOC_Portfolio_Management_IAKA_2026.pdf` — konsep taksonomi KPI & modul
- **[C]** `Portfolio_Management_Project.pdf` — BRD/PRD, rumus Productivity & Load Balance
- **[D]** `Proposal_Bisnis_DSOC_Managed_Services.pdf` — struktur organisasi, target strategis

---

## 1. Executive Dashboard
**Sumber:** [A] slide "Executive Overview (Live Scorecard Dashboard)"
**File halaman:** `pages/dashboard.html` | **Binder:** `bindDashboard()` | **Data:** `mockDatabase.dashboard`

| Metrik | Kenapa di sini |
|---|---|
| Service Uptime, SLA Compliance, Open Incident, Avg MTTR, CSAT (5 KPI card) | Ini "ringkasan tingkat direksi" — 5 angka yang sama persis dipakai di scorecard PDF, jadi wajib satu layar tanpa scroll |
| Filter tanggal + filter proyek | Diminta eksplisit; proyek yang dipilih menimpa sementara nilai SLA card (simulasi data per-proyek) |
| Tren KPI 30 hari (dual-axis chart) | Uptime/SLA/CSAT beda skala (%) dari Open Incident/MTTR (count/jam) → dipisah jadi 2 sumbu Y biar tidak mendatar |
| Distribusi Incident (donut) | Diambil apa adanya dari PDF (Critical/High/Medium/Low/Informational) |
| Ringkasan Performa (list) | Duplikasi ringkas dari 5 KPI card dalam bentuk list — mempermudah screen-reader / mobile |
| Portfolio Health (proyek aktif) | Bukan dari PDF ITSM, tapi relevan untuk role Executive yang juga mengawasi Portfolio Management — dipertahankan dari template awal |

---

## 2. Performance & Availability
**Sumber:** [A] slide "Service Uptime" + slide "SLA Compliance"
**File halaman:** `pages/engine-perf.html` | **Binder:** `bindPerformance()` | **Data:** `mockDatabase.performance` + `mockDatabase.sla`

**Keputusan desain:** SLA Compliance digabung satu halaman dengan Service Uptime (bukan halaman
terpisah), karena dua-duanya sama-sama mengukur *ketersediaan layanan* — SLA Compliance secara
teknis adalah "Uptime + Resolution Time yang dibandingkan terhadap kontrak", jadi satu grup logis
dengan Performance & Availability, bukan dengan Change/Ticket/CX.

| Bagian | Metrik |
|---|---|
| Service Uptime (atas) | Uptime keseluruhan 30 hari, jumlah layanan Normal/Peringatan/Down, tren uptime harian, distribusi status (donut), top 5 infrastruktur, tabel status layanan kritis, alert terbaru |
| SLA Compliance (bawah, dipisah garis putus-putus) | Uptime hari ini vs target, Resolution Time hari ini vs target, jumlah insiden (Critical/Major), downtime, tren 7 hari (2 chart), tabel ringkasan performa per layanan |

---

## 3. Incident & MTTR Control
**Sumber:** [A] slide "Active Incidents Matrix (P1-P4)" + slide "Komponen Pantauan MTTR"
**File halaman:** `pages/engine-inc.html` | **Binder:** `bindIncidentAndMttr()` | **Data:** `mockDatabase.incidentMatrix` + `mockDatabase.mttr`

**Catatan koreksi penting:** Di draf awal, angka P1-P4 tercampur antara dua dataset PDF yang
berbeda (24 total vs 89 total). Sudah dipisah:
- **Active Incident Matrix** (P1=2, P2=5, P3=10, P4=7, **total 24**) → tetap di halaman ini
- **Ticket Backlog & Workload Distribution** (P1=2, P2=15, P3=27, P4=45, **total 89**) → dipindah ke menu Ticket & Workload sesuai instruksi eksplisit

| Bagian | Metrik |
|---|---|
| Active Incident Matrix | Total + breakdown P1-P4, distribusi (donut), tren 7 hari per prioritas, status penyelesaian (Selesai/Proses/Menunggu Vendor), daftar incident aktif, top 5 layanan terdampak, alokasi resource |
| MTTR | Average MTTR, total selesai, MTTR terbaik/terburuk, target, tren, MTTR per layanan (bar), distribusi rentang waktu (donut), MTTR per prioritas, perbandingan periode |

---

## 4. Ticket & Workload
**Sumber:** [A] slide "Volume Ticket Performance" + slide "Ticket Backlog & Workload Distribution"
**File halaman:** `pages/engine-ticket.html` | **Binder:** `bindTicketWorkload()` | **Data:** `mockDatabase.tickets`

Dibuat 2 tab dalam satu halaman (bukan 2 menu terpisah) sesuai instruksi eksplisit "jadikan
submenu bersama Volume Ticket Performance":

| Tab | Metrik |
|---|---|
| Volume Ticket Performance | Total ticket + breakdown status (New/Open/Pending/Resolved/Closed), volume harian/mingguan/bulanan (switchable chart), analitik per kategori (Enquiry/Service Request/Complaint) |
| Ticket Backlog & Workload Distribution | P1-P4 backlog count, tabel distribusi beban kerja per tier dukungan (L1 Service Desk / L2 Technical Support / L3 Engineering-SME) |

---

## 5. Change & Release Management
**Sumber:** [A] slide "Change & Release Management" (tidak diubah dari versi sebelumnya)
**File halaman:** `pages/engine-change.html` | **Binder:** `bindEngineChange()` | **Data:** `mockDatabase.changes`

Metrik: Total perubahan, Successful Standard & Normal Changes (%), Emergency Changes/Hotfixes
(%), Failed/Rolled Back Changes (%), jumlah Unauthorized Changes — donut distribusi 3 kategori.

---

## 6. Customer Experience (CX)
**Sumber:** [A] slide "Customer Satisfaction"
**File halaman:** `pages/engine-cx.html` | **Binder:** `bindEngineCX()` | **Data:** `mockDatabase.cx`

| Metrik | Catatan |
|---|---|
| Kepuasan Produk/Layanan (ring + skor /5) | Persis dari PDF: 92,4% / 4,62 dari 5 |
| Kepuasan Agen Layanan (ring + skor /5) | Persis dari PDF: 94,1% / 4,71 dari 5 |
| Feedback Positif/Netral/Negatif (produk & agen, terpisah) | 6 angka independen sesuai PDF, bukan digabung |
| Saran & Rekomendasi Pelanggan (scroll horizontal) | 5 quote asli dari PDF dengan ID pelanggan & tanggal |
| First Contact Resolution (FCR) & Net Promoter Score (NPS) | Dipertahankan dari template awal — tidak ada di slide CSAT PDF, tapi relevan sebagai pelengkap metrik CX dan sudah ada strukturnya |

---

## 7. Productivity & KPI Grading
**Sumber:** [C] BRD-01/PRD-03 (rumus Productivity), [B] modul 4.3 (Integrated KPI Scoring & Grading)
**File halaman:** `pages/hc-prod.html` | **Binder:** `bindProd()` | **Data:** `mockDatabase.productivityRules` + `mockDatabase.grades`

- **Rumus Load Balance:** `((Monthly Count × Mins/Task) / 60) / 22 Hari Kerja` → merah jika > 8 jam/hari (BRD-01)
- **CRUD Add/Edit Rule** ditambahkan via modal (`openAddProdRule`, `openEditProdRule`) — poin permintaan eksplisit
- Tabel KPI Grading terpisah di bawahnya (skor final → predikat A/B/C/D) sesuai modul 4.3.2

---

## 8. 360 Review Matrix
**Sumber:** [C] bagian 1.2.3 & 2.2.4 (bobot dimensi review), [B] modul 4.4.1
**File halaman:** `pages/hc-review.html` | **Binder:** `bindReview()` | **Data:** `mockDatabase.review360`

4 dimensi evaluasi (Technical, Delivery/Speed, Communication, Problem Solving) masing-masing
25% — total wajib 100% sesuai [C] "total akumulasi bobot 100%". Peserta review + tombol Add
Participant ditambahkan agar tabel tidak kosong dan sesuai instruksi.

---

## 9. Strategic OKR & RACI
**Sumber:** [C] bagian 1.3 & 2.2.5 (OKR Mapping Setup), [B] modul 4.4.2
**File halaman:** `pages/hc-okr.html` | **Binder:** `bindOkr()` | **Data:** `mockDatabase.okr`

3 contoh Objective (mis. "Achieve Zero Downtime Migration to Cloud") masing-masing dengan
breakdown RACI generik (Accountable/Responsible/Consulted/Informed) per task — sebelumnya
header tabel di-hardcode nama role tertentu, sekarang generik sesuai definisi RACI standar di [C].
Tombol "New OKR" dan "Tambah Task" RACI berfungsi lewat modal.

---

## 10. Role Management
**Sumber:** [C] PRD-02 (RBAC: Super Admin / Manager-Setup / Viewer)
**File halaman:** `pages/admin-role.html` | **Binder:** `bindUsers()` | **Data:** `mockDatabase.users`

Tabel user dengan 3 role sesuai RBAC di PRD (bukan sekadar 3 kredensial login demo, tapi daftar
user riil organisasi). CRUD Add/Edit/Delete lewat modal.

---

## 11. API & Integration Sync
**Sumber:** [C] BRD-03 (Interoperability — Pull dari Jira, Push ke HRIS)
**File halaman:** `pages/admin-api.html` (tidak diubah strukturnya, hanya perbaikan bug `toggleApi`)

---

## 12. Enterprise Audit Logs
**Sumber:** [C] BRD-04 (Auditability — waktu, user, fitur, aksi, IP Address)
**File halaman:** `pages/admin-log.html` | **Fungsi:** `renderLogs()` + `exportData('CSV')` | **Data:** `mockDatabase.auditLogs`

Log terisi otomatis dari `api.addLog()` yang dipanggil di setiap aksi penting (login/logout,
semua CRUD, apply filter, export). Export CSV memakai `Blob` + `URL.createObjectURL` — file
benar-benar terunduh, bukan simulasi.

---

## Ringkasan Keputusan yang Perlu Diketahui
1. **SLA Compliance** → digabung ke Performance & Availability (bukan halaman baru)
2. **Active Incident Matrix (total 24)** vs **Ticket Backlog (total 89)** → dua dataset PDF berbeda, sekarang sudah dipisah ke halaman yang tepat
3. **Ticket Backlog & Workload Distribution** → jadi tab, bukan menu sejajar, sesuai instruksi
4. Semua angka mengikuti PDF apa adanya kecuali disebutkan "dipertahankan dari template awal" — itu artinya bukan dari PDF sumber, melainkan bawaan starter project yang tetap relevan secara fungsional

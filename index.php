<?php
declare(strict_types=1);
require __DIR__ . '/app.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f5f7f4">
  <title>Emperor Street Coffee — POS</title>
  <link rel="stylesheet" href="assets/styles.css?v=2.0.0">
  <script src="assets/app.js?v=2.0.0" defer></script>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" class="svg-sprite" aria-hidden="true" focusable="false">
  <symbol id="ic-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></symbol>
  <symbol id="ic-coffee" viewBox="0 0 24 24"><path d="M5 8h13v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8Z"/><path d="M18 9h2a3 3 0 0 1 0 6h-2M8 2v3M12 2v3M16 2v3"/></symbol>
  <symbol id="ic-receipt" viewBox="0 0 24 24"><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></symbol>
  <symbol id="ic-wallet" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 9V5a2 2 0 0 1 2-2h13M16 14h5M16 14h.01"/></symbol>
  <symbol id="ic-chart" viewBox="0 0 24 24"><path d="M4 20V4M4 20h17M8 16v-5M13 16V7M18 16v-9"/></symbol>
  <symbol id="ic-book" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v18M12 8h5M12 12h5"/></symbol>
  <symbol id="ic-exit" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9"/></symbol>
  <symbol id="ic-bars" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
  <symbol id="ic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></symbol>
  <symbol id="ic-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="ic-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
  <symbol id="ic-x" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
  <symbol id="ic-check" viewBox="0 0 24 24"><path d="m4 12 5 5L20 6"/></symbol>
  <symbol id="ic-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/></symbol>
  <symbol id="ic-cart" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l3 14h13l2-10H5"/></symbol>
  <symbol id="ic-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></symbol>
  <symbol id="ic-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
  <symbol id="ic-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></symbol>
  <symbol id="ic-spark" viewBox="0 0 24 24"><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/></symbol>
</svg>

<section class="auth-page" id="authPage">
  <div class="auth-side">
    <div class="auth-brand"><span class="brand-mark"><svg><use href="#ic-coffee"/></svg></span><span>Emperor Street<br><strong>Coffee</strong></span></div>
    <div><span class="eyebrow light">EMPEROR POS</span><h1>Kelola kedai dengan lebih tenang.</h1><p>Penjualan, pengeluaran, dan laporan dalam satu tempat. Dibuat ringan agar nyaman dipakai setiap hari.</p></div>
    <small>Emperor Street Coffee · Point of Sale</small>
  </div>
  <div class="auth-main">
    <form id="authForm" class="auth-card">
      <span class="eyebrow">AKSES ADMIN</span>
      <h2 id="authTitle">Masuk ke kasir</h2>
      <p id="authSubtitle" class="subtext">Gunakan akun admin untuk membuka aplikasi.</p>
      <label>Username<input name="username" autocomplete="username" maxlength="50" required placeholder="Masukkan username"></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Minimal 8 karakter"></label>
      <button class="btn primary wide" id="authSubmit" type="submit">Lanjutkan <svg><use href="#ic-arrow"/></svg></button>
    </form>
  </div>
</section>

<div class="app-shell hidden" id="appShell">
  <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
  <aside class="sidebar" id="sidebar">
    <div class="brand"><span class="brand-mark"><svg><use href="#ic-coffee"/></svg></span><span><strong>Emperor Street</strong><small>Coffee · POS</small></span></div>
    <div class="nav-caption">MENU UTAMA</div>
    <nav aria-label="Menu utama" id="sidebarNav">
      <button type="button" class="nav-item" data-view="dashboard"><svg><use href="#ic-grid"/></svg>Dashboard</button>
      <button type="button" class="nav-item" data-view="pos"><svg><use href="#ic-coffee"/></svg>Kasir</button>
      <button type="button" class="nav-item" data-view="transactions"><svg><use href="#ic-receipt"/></svg>Transaksi</button>
      <button type="button" class="nav-item" data-view="expenses"><svg><use href="#ic-wallet"/></svg>Pengeluaran</button>
      <button type="button" class="nav-item" data-view="report"><svg><use href="#ic-chart"/></svg>Laporan</button>
      <button type="button" class="nav-item" data-view="menu"><svg><use href="#ic-book"/></svg>Daftar Menu</button>
    </nav>
    <div class="sidebar-foot">
      <div class="sidebar-note"><span class="note-dot"></span><div><strong>Siap berjualan</strong><small>Data tersimpan di database lokal</small></div></div>
      <button type="button" class="nav-item logout" id="logout"><svg><use href="#ic-exit"/></svg>Keluar</button>
    </div>
  </aside>

  <div class="workspace">
    <header class="topbar">
      <div class="top-left"><button type="button" class="icon-btn menu-toggle" id="openSidebar" aria-label="Buka menu"><svg><use href="#ic-bars"/></svg></button><div class="top-path"><span>Emperor Street Coffee</span><span class="path-slash">/</span><strong id="currentTitle">Dashboard</strong></div></div>
      <div class="top-right"><span class="today-label"><svg><use href="#ic-calendar"/></svg><span id="headerDate"></span></span><span class="avatar">ES</span><span class="user-tag"><strong>Admin</strong><small>Kasir</small></span></div>
    </header>

    <main class="page-content" id="mainContent">
      <section class="screen" id="dashboard">
        <div class="page-heading"><div><span class="eyebrow">RINGKASAN OPERASIONAL</span><h1>Dashboard</h1><p>Pantau aktivitas Emperor Street Coffee hari ini.</p></div><button class="btn primary" type="button" data-view="pos"><svg><use href="#ic-plus"/></svg>Transaksi baru</button></div>
        <div class="metric-grid" id="dashboardMetrics" aria-live="polite"></div>
        <div class="dashboard-columns">
          <div class="panel"><div class="panel-heading"><div><h2>Pemasukan & pengeluaran</h2><p>Aktivitas 7 hari terakhir</p></div><span class="soft-pill">7 hari</span></div><div class="legend"><span><i class="legend-dot income"></i>Pemasukan</span><span><i class="legend-dot expense"></i>Pengeluaran</span></div><div id="weekChart" class="week-chart" aria-label="Grafik pemasukan dan pengeluaran selama 7 hari"></div></div>
          <div class="panel"><div class="panel-heading"><div><h2>Ringkasan hari ini</h2><p>Arus uang berdasarkan metode pembayaran</p></div></div><div id="dashboardBreakdown"></div><button class="text-link" type="button" data-view="report">Buka laporan lengkap <svg><use href="#ic-arrow"/></svg></button></div>
        </div>
        <div class="panel"><div class="panel-heading"><div><h2>Transaksi terbaru</h2><p>Riwayat penjualan yang baru tercatat</p></div><button type="button" class="btn subtle" data-view="transactions">Lihat semua <svg><use href="#ic-arrow"/></svg></button></div><div id="recentSales"></div></div>
      </section>

      <section class="screen hidden" id="pos">
        <div class="page-heading"><div><span class="eyebrow">POINT OF SALE</span><h1>Kasir</h1><p>Pilih menu, atur pesanan, lalu simpan pembayaran.</p></div><span class="soft-pill"><svg><use href="#ic-coffee"/></svg>Siap menerima pesanan</span></div>
        <div class="pos-layout">
          <div class="panel catalog-panel"><div class="panel-heading"><div><h2>Daftar menu</h2><p>Ketuk item untuk menambahkan ke keranjang</p></div><div class="search-box"><svg><use href="#ic-search"/></svg><input id="search" placeholder="Cari nama menu..." autocomplete="off" aria-label="Cari nama menu"></div></div><div class="category-filters" id="filters"></div><div class="product-grid" id="products"></div></div>
          <div class="cart-backdrop" id="cartBackdrop"></div>
          <aside class="panel order-panel" id="cart" aria-label="Keranjang pesanan">
            <div class="sheet-handle"></div>
            <div class="order-header"><div><span class="eyebrow">PESANAN SAAT INI</span><h2>Keranjang <span id="cartBadge" class="count-badge">0</span></h2></div><div class="header-actions"><button type="button" class="btn-plain danger" id="clearCart">Hapus semua</button><button type="button" class="icon-btn sheet-close" id="closeCart" aria-label="Tutup keranjang"><svg><use href="#ic-x"/></svg></button></div></div>
            <div class="cart-lines" id="cartLines"></div>
            <div class="order-footer">
              <div class="order-total"><span>Total pembayaran</span><strong id="cartTotal">Rp0</strong></div>
              <div class="field-caption">Metode pembayaran</div><div class="payment-options"><label class="payment-choice"><input type="radio" name="payment" value="cash" checked><span>Cash</span></label><label class="payment-choice"><input type="radio" name="payment" value="qris"><span>QRIS</span></label></div>
              <label class="field" id="receivedWrap">Uang diterima (Rp)<input id="received" type="number" inputmode="numeric" min="0" placeholder="Masukkan uang diterima"></label>
              <button type="button" class="exact-btn" id="payExact">Uang pas</button>
              <div class="change-row" id="changeRow"><span>Kembalian</span><strong id="change">Rp0</strong></div>
              <button type="button" class="btn primary wide checkout-btn" id="checkout"><svg><use href="#ic-check"/></svg>Bayar & simpan</button>
            </div>
          </aside>
        </div>
      </section>

      <section class="screen hidden" id="transactions">
        <div class="page-heading"><div><span class="eyebrow">RIWAYAT PENJUALAN</span><h1>Transaksi</h1><p>Lihat transaksi berhasil dan pembatalannya.</p></div></div>
        <div class="panel"><div class="toolbar"><div class="date-controls"><label>Dari<input type="date" id="transactionFrom"></label><label>Sampai<input type="date" id="transactionTo"></label><button type="button" class="btn subtle" id="loadTransactions">Terapkan</button></div></div><div class="table-wrap"><table><thead><tr><th>No.</th><th>Waktu</th><th>Pembayaran</th><th>Jumlah</th><th>Status</th><th>Tindakan</th></tr></thead><tbody id="salesRows"></tbody></table></div><p class="table-info" id="transactionInfo"></p></div>
      </section>

      <section class="screen hidden" id="expenses">
        <div class="page-heading"><div><span class="eyebrow">BIAYA OPERASIONAL</span><h1>Pengeluaran</h1><p>Catat pengeluaran kedai agar laporan tetap akurat.</p></div></div>
        <div class="expense-layout"><div class="panel"><div class="panel-heading"><div><h2>Tambah pengeluaran</h2><p>Setiap catatan langsung masuk ke laporan</p></div></div><form id="expenseForm" class="form-stack"><label class="field">Keterangan<input name="description" required maxlength="150" placeholder="Contoh: galon air, bahan kopi"></label><label class="field">Nominal (Rp)<input name="amount" type="number" min="1" inputmode="numeric" required placeholder="0"></label><div class="field-caption">Dibayar menggunakan</div><div class="payment-options"><label class="payment-choice"><input type="radio" name="expenseMethod" value="cash" checked><span>Cash</span></label><label class="payment-choice"><input type="radio" name="expenseMethod" value="qris"><span>QRIS</span></label></div><button class="btn primary wide" id="expenseSubmit" type="submit"><svg><use href="#ic-check"/></svg>Simpan pengeluaran</button></form></div>
          <div class="panel"><div class="panel-heading"><div><h2>Pengeluaran hari ini</h2><p>Catatan terbaru dari kasir</p></div></div><div id="recentExpenses"></div></div>
        </div>
      </section>

      <section class="screen hidden" id="report">
        <div class="page-heading"><div><span class="eyebrow">KEUANGAN KEDAI</span><h1>Laporan</h1><p>Bandingkan pemasukan Cash dan QRIS dengan pengeluaran.</p></div><div class="heading-actions"><button class="btn subtle" type="button" id="exportReport">Unduh CSV</button><button class="btn primary" type="button" id="printReport">Cetak laporan</button></div></div>
        <div class="panel"><div class="toolbar"><div class="date-controls"><label>Dari<input type="date" id="from"></label><label>Sampai<input type="date" id="to"></label><button type="button" class="btn primary" id="loadReport">Terapkan</button></div><div class="preset-buttons"><button type="button" class="btn subtle" data-range="today">Hari ini</button><button type="button" class="btn subtle" data-range="week">7 hari</button><button type="button" class="btn subtle" data-range="month">Bulan ini</button></div></div><div id="summary" class="report-metrics"></div><p class="report-footnote">Selisih operasional = pemasukan − pengeluaran tercatat. Belum termasuk HPP, stok, atau pajak. Angka QRIS belum berarti dana telah masuk rekening.</p></div>
        <div class="report-columns"><div class="panel"><div class="panel-heading"><h2>Rincian pemasukan</h2></div><div id="reportSales"></div></div><div class="panel"><div class="panel-heading"><h2>Rincian pengeluaran</h2></div><div id="reportExpenses"></div></div></div>
      </section>

      <section class="screen hidden" id="menu">
        <div class="page-heading"><div><span class="eyebrow">KATALOG KEDAI</span><h1>Daftar menu</h1><p>Harga yang digunakan kasir untuk setiap transaksi.</p></div></div>
        <div class="panel"><div class="panel-heading"><div><h2>Menu Emperor Street Coffee</h2><p id="menuCount">Memuat menu...</p></div><button class="btn subtle" type="button" data-view="pos">Buka kasir <svg><use href="#ic-arrow"/></svg></button></div><div id="menuList"></div></div>
      </section>
    </main>
  </div>

  <button type="button" class="mobile-cart-button hidden" id="openCart"><svg><use href="#ic-cart"/></svg><span>Keranjang · <span id="mobileCount">0 item</span></span><strong id="mobileTotal">Rp0</strong></button>
  <nav class="bottom-nav" aria-label="Navigasi ponsel"><button type="button" data-view="dashboard"><svg><use href="#ic-grid"/></svg>Beranda</button><button type="button" data-view="pos"><svg><use href="#ic-coffee"/></svg>Kasir</button><button type="button" data-view="transactions"><svg><use href="#ic-receipt"/></svg>Transaksi</button><button type="button" data-view="report"><svg><use href="#ic-chart"/></svg>Laporan</button><button type="button" id="moreNav"><svg><use href="#ic-more"/></svg>Lainnya</button></nav>
</div>

<div class="dialog-backdrop hidden" id="dialogBackdrop">
  <section class="dialog" id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle" aria-describedby="dialogMessage">
    <button type="button" class="icon-btn dialog-close" id="dialogClose" aria-label="Tutup"><svg><use href="#ic-x"/></svg></button>
    <div class="dialog-icon" id="dialogIcon"><svg><use href="#ic-check"/></svg></div>
    <h2 id="dialogTitle">Berhasil</h2><p id="dialogMessage"></p><div class="dialog-actions" id="dialogActions"></div>
  </section>
</div>
<div class="toast-layer" id="toastLayer" aria-live="polite" aria-atomic="true"></div>
</body>
</html>
'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const money = (value) => 'Rp' + Number(value || 0).toLocaleString('id-ID');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const icon = (name) => '<svg aria-hidden="true"><use href="#ic-' + name + '"/></svg>';
const isoDate = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');
const today = () => isoDate(new Date());
const dateBefore = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
};
const shortDate = (date) => {
  if (!date) return '-';
  const parts = date.slice(0, 10).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};
const readableDate = (dateTime) => dateTime ? shortDate(dateTime) + ' · ' + dateTime.slice(11, 16) : '-';
const safeMethod = (method) => method === 'cash' ? 'Cash' : method === 'qris' ? 'QRIS' : '-';
const errorMessage = (err) => err instanceof Error ? err.message : 'Ada masalah saat memproses permintaan.';

let csrf = '';
let products = [];
let cart = new Map();
let activeCategory = 'Semua';
let authMode = 'login';
let currentView = '';
let activeReport = null;
let submitting = false;
let modalFinish = null;
let modalReturnFocus = null;
let toastId = 0;

function notify(message, type = 'success') {
  const id = ++toastId;
  const element = document.createElement('div');
  element.className = 'toast' + (type === 'error' ? ' error' : '');
  element.innerHTML = icon(type === 'error' ? 'x' : 'check') + '<span>' + escapeHtml(message) + '</span><button aria-label="Tutup notifikasi" type="button">×</button>';
  $('#toastLayer').appendChild(element);
  const remove = () => element.remove();
  element.querySelector('button').addEventListener('click', remove);
  setTimeout(remove, 4600);
}

async function api(action, payload, extra = '') {
  const options = {
    method: payload === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json', 'X-CSRF-Token': csrf }
  };
  if (payload !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }
  let response;
  try {
    response = await fetch('index.php?api=1&action=' + encodeURIComponent(action) + extra, options);
  } catch (_) {
    throw new Error('Tidak dapat terhubung ke server. Periksa Apache atau koneksi.');
  }
  const result = await response.json().catch(() => {
    throw new Error('Server tidak mengembalikan respons yang valid.');
  });
  if (!response.ok) throw new Error(result.error || 'Permintaan gagal.');
  return result;
}

function setBusy(button, busy, busyText) {
  if (!button) return;
  if (busy) {
    button.dataset.previousLabel = button.innerHTML;
    button.disabled = true;
    button.textContent = busyText || 'Menyimpan...';
  } else {
    button.disabled = false;
    if (button.dataset.previousLabel) button.innerHTML = button.dataset.previousLabel;
    delete button.dataset.previousLabel;
  }
}

function closeDialog(value = false) {
  if (!modalFinish) return;
  const done = modalFinish;
  modalFinish = null;
  $('#dialogBackdrop').classList.add('hidden');
  document.body.classList.remove('modal-open');
  done(value);
  if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
  modalReturnFocus = null;
}
function dialog(options) {
  if (modalFinish) closeDialog(false);
  modalReturnFocus = document.activeElement;
  const warning = options.variant === 'warning';
  $('#dialog').classList.toggle('warning', warning);
  $('#dialogIcon').innerHTML = icon(warning ? 'trash' : 'check');
  $('#dialogTitle').textContent = options.title;
  $('#dialogMessage').textContent = options.message;
  const buttons = $('#dialogActions');
  buttons.replaceChildren();

  if (options.confirm) {
    const cancel = document.createElement('button');
    cancel.className = 'btn subtle';
    cancel.textContent = 'Batal';
    cancel.type = 'button';
    cancel.addEventListener('click', () => closeDialog(false));
    buttons.appendChild(cancel);
  }

  const proceed = document.createElement('button');
  proceed.className = 'btn ' + (warning ? 'danger-btn' : 'primary');
  proceed.textContent = options.confirm ? (options.button || 'Hapus') : 'Oke, mengerti';
  proceed.type = 'button';
  proceed.addEventListener('click', () => closeDialog(true));
  buttons.appendChild(proceed);
  $('#dialogBackdrop').classList.remove('hidden');
  document.body.classList.add('modal-open');
  setTimeout(() => proceed.focus(), 0);
  return new Promise((resolve) => { modalFinish = resolve; });
}
const confirmAction = (title, message, button = 'Hapus') => dialog({ title, message, button, variant: 'warning', confirm: true });
const successDialog = (title, message) => dialog({ title, message });

$('#dialogClose').addEventListener('click', () => closeDialog(false));
$('#dialogBackdrop').addEventListener('click', (event) => {
  if (event.target === $('#dialogBackdrop')) closeDialog(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (modalFinish) closeDialog(false);
    else if ($('#cart').classList.contains('open')) closeCart();
    else closeSidebar();
  }
});

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#sidebarBackdrop').classList.remove('open');
}
function openSidebar() {
  $('#sidebar').classList.add('open');
  $('#sidebarBackdrop').classList.add('open');
}
$('#openSidebar').addEventListener('click', openSidebar);
$('#moreNav').addEventListener('click', openSidebar);
$('#sidebarBackdrop').addEventListener('click', closeSidebar);

function openCart() {
  $('#cart').classList.add('open');
  $('#cartBackdrop').classList.add('open');
}
function closeCart() {
  $('#cart').classList.remove('open');
  $('#cartBackdrop').classList.remove('open');
}
$('#openCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
$('#cartBackdrop').addEventListener('click', closeCart);

const titles = {
  dashboard: 'Dashboard', pos: 'Kasir', transactions: 'Transaksi',
  expenses: 'Pengeluaran', report: 'Laporan', menu: 'Daftar Menu'
};
function showAuth(setup) {
  authMode = setup ? 'setup' : 'login';
  currentView = '';
  $('#appShell').classList.add('hidden');
  $('#authPage').classList.remove('hidden');
  $('#authTitle').textContent = setup ? 'Buat akun admin' : 'Masuk ke kasir';
  $('#authSubtitle').textContent = setup
    ? 'Tentukan akun admin yang akan digunakan untuk mengelola kedai.'
    : 'Gunakan akun admin untuk membuka aplikasi.';
  $('#authForm').reset();
}

async function showView(view) {
  if (!(view in titles)) return;
  currentView = view;
  $$('.screen').forEach((screen) => screen.classList.toggle('hidden', screen.id !== view));
  $$('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (button.closest('nav')) {
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  });
  $('#currentTitle').textContent = titles[view];
  $('#openCart').classList.toggle('hidden', view !== 'pos' || cart.size === 0);
  closeSidebar();
  closeCart();
  window.scrollTo({ top: 0, behavior: 'instant' });
  try {
    if (view === 'dashboard') await loadDashboard();
    if (view === 'pos') await loadProducts();
    if (view === 'transactions') await loadTransactions();
    if (view === 'expenses') await loadExpenses();
    if (view === 'report') await loadReport();
    if (view === 'menu') await loadMenu();
  } catch (error) {
    notify(errorMessage(error), 'error');
  }
}
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (button) showView(button.dataset.view);
});

$('#authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitting) return;
  const button = $('#authSubmit');
  const values = new FormData(event.currentTarget);
  submitting = true;
  setBusy(button, true, 'Memproses...');
  try {
    await api(authMode, {
      username: String(values.get('username')).trim(),
      password: String(values.get('password'))
    });
    $('#authPage').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
    await showView('dashboard');
    notify('Berhasil masuk.');
  } catch (error) {
    notify(errorMessage(error), 'error');
  } finally {
    setBusy(button, false);
    submitting = false;
  }
});
$('#logout').addEventListener('click', async () => {
  if (!await confirmAction('Keluar dari aplikasi?', 'Sesi admin akan diakhiri. Data transaksi yang tersimpan tidak hilang.', 'Keluar')) return;
  try {
    await api('logout', {});
    cart.clear();
    showAuth(false);
    notify('Kamu sudah keluar.');
  } catch (error) { notify(errorMessage(error), 'error'); }
});

function noData(message) {
  return '<div class="empty-state">' + escapeHtml(message) + '</div>';
}
function metricCard(title, value, footer, selected, glyph) {
  return '<article class="metric-card' + (selected ? ' featured' : '') + '"><span class="metric-icon">' +
    icon(glyph) + '</span><small>' + escapeHtml(title) + '</small><strong>' + value +
    '</strong><span class="metric-foot">' + escapeHtml(footer) + '</span></article>';
}

async function loadDashboard() {
  const day = today();
  const [daily, week] = await Promise.all([
    api('report', undefined, '&from=' + day + '&to=' + day),
    api('report', undefined, '&from=' + dateBefore(6) + '&to=' + day)
  ]);
  const summary = daily.data.summary;
  $('#dashboardMetrics').innerHTML = [
    metricCard('Pemasukan hari ini', money(summary.income), 'Cash dan QRIS', true, 'chart'),
    metricCard('Cash masuk', money(summary.cash), 'Penjualan tunai', false, 'wallet'),
    metricCard('QRIS masuk', money(summary.qris), 'Pembayaran QRIS', false, 'grid'),
    metricCard('Pengeluaran', money(summary.outgoing), 'Biaya tercatat hari ini', false, 'receipt'),
    metricCard('Total transaksi', String(summary.count), 'Transaksi berhasil', false, 'coffee')
  ].join('');

  const items = [
    ['Cash masuk', summary.cash, 'income'],
    ['QRIS masuk', summary.qris, 'income'],
    ['Cash keluar', summary.expenses_cash, 'expense'],
    ['QRIS keluar', summary.expenses_qris, 'expense']
  ];
  const max = Math.max(summary.income, summary.outgoing, 1);
  $('#dashboardBreakdown').innerHTML = items.map(([label, value, kind]) =>
    '<div class="breakdown-item"><div class="breakdown-line"><span>' + label + '</span><strong>' + money(value) +
    '</strong></div><div class="progress' + (kind === 'expense' ? ' expense' : '') +
    '"><span style="width:' + Math.round(value / max * 100) + '%"></span></div></div>'
  ).join('');

  const series = [];
  for (let n = 6; n >= 0; n--) series.push({ date: dateBefore(n), income: 0, expense: 0 });
  const indexed = new Map(series.map((point) => [point.date, point]));
  for (const sale of week.data.sales) {
    const key = sale.created_at.slice(0, 10);
    if (sale.status === 'paid' && indexed.has(key)) indexed.get(key).income += Number(sale.total);
  }
  for (const expense of week.data.expenses) {
    const key = expense.created_at.slice(0, 10);
    if (!Number(expense.deleted) && indexed.has(key)) indexed.get(key).expense += Number(expense.amount);
  }
  const largest = Math.max(1, ...series.map((point) => Math.max(point.income, point.expense)));
  $('#weekChart').innerHTML = series.map((point) =>
    '<div class="chart-day"><div class="chart-bars"><span class="chart-bar" style="height:' +
    Math.max(1, Math.round(point.income / largest * 100)) + '%" title="' + escapeHtml(shortDate(point.date)) +
    ' pemasukan ' + escapeHtml(money(point.income)) + '"></span><span class="chart-bar expense" style="height:' +
    Math.max(1, Math.round(point.expense / largest * 100)) + '%" title="' + escapeHtml(shortDate(point.date)) +
    ' pengeluaran ' + escapeHtml(money(point.expense)) +
    '"></span></div><span class="chart-label">' + escapeHtml(shortDate(point.date)) + '</span></div>'
  ).join('');

  const recent = week.data.sales.slice(0, 5);
  $('#recentSales').innerHTML = recent.length ? recent.map((sale) =>
    '<div class="mini-row"><div><div class="row-title">Transaksi #' + sale.id +
    '</div><div class="row-sub">' + escapeHtml(readableDate(sale.created_at)) + ' · ' +
    safeMethod(sale.method) + '</div></div><div><div class="row-amount">' +
    money(sale.total) + '</div><span class="row-tag">' +
    (sale.status === 'paid' ? 'Berhasil' : 'Dibatalkan') + '</span></div></div>'
  ).join('') : noData('Belum ada transaksi dalam 7 hari terakhir.');
}

async function loadProducts() {
  products = (await api('products')).data;
  renderProducts();
  renderCart();
}
function productCategory(product) { return String(product.category || 'Lainnya'); }
function renderProducts() {
  const categories = ['Semua', ...new Set(products.map(productCategory))];
  if (!categories.includes(activeCategory)) activeCategory = 'Semua';
  $('#filters').innerHTML = categories.map((name) =>
    '<button type="button" data-category="' + escapeHtml(name) + '" class="' +
    (activeCategory === name ? 'active' : '') + '">' + escapeHtml(name) + '</button>'
  ).join('');
  const query = $('#search').value.trim().toLowerCase();
  const visible = products.filter((product) =>
    (activeCategory === 'Semua' || productCategory(product) === activeCategory) &&
    product.name.toLowerCase().includes(query)
  );
  $('#products').innerHTML = visible.length ? visible.map((product) =>
    '<button type="button" class="product-card" data-product="' + Number(product.id) +
    '" data-cat="' + escapeHtml(productCategory(product)) +
    '" aria-label="Tambah ' + escapeHtml(product.name) + ' ke keranjang"><span class="product-monogram">' +
    escapeHtml(product.name.slice(0, 2).toUpperCase()) + '</span><span class="product-name">' +
    escapeHtml(product.name) + '</span><span class="product-bottom"><strong>' +
    money(product.price) + '</strong><span class="plus-box">' + icon('plus') +
    '</span></span></button>'
  ).join('') : noData('Menu tidak ditemukan. Coba kata kunci atau kategori lain.');
}
$('#filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  renderProducts();
});
$('#search').addEventListener('input', renderProducts);
$('#products').addEventListener('click', (event) => {
  const button = event.target.closest('[data-product]');
  if (!button) return;
  const id = Number(button.dataset.product);
  const qty = cart.get(id) || 0;
  if (qty >= 99) { notify('Maksimal 99 per menu.', 'error'); return; }
  cart.set(id, qty + 1);
  renderCart();
});

function cartSum() {
  let total = 0, count = 0;
  for (const [id, qty] of cart) {
    const product = products.find((entry) => Number(entry.id) === id);
    if (!product) continue;
    total += Number(product.price) * qty;
    count += qty;
  }
  return { total, count };
}
function selectedPayment() {
  return $('input[name="payment"]:checked').value;
}
function renderCart() {
  const { total, count } = cartSum();
  $('#cartLines').innerHTML = count ? Array.from(cart.entries()).map(([id, qty]) => {
    const product = products.find((entry) => Number(entry.id) === id);
    if (!product) return '';
    return '<div class="cart-item"><div class="cart-item-main"><strong>' +
      escapeHtml(product.name) + '</strong><small>' + money(product.price) +
      ' per item</small></div><div class="cart-item-actions"><b>' + money(product.price * qty) +
      '</b><div class="qty-buttons"><button aria-label="Kurangi ' + escapeHtml(product.name) +
      '" data-qty="' + id + '" data-step="-1">' + icon('minus') +
      '</button><span>' + qty + '</span><button aria-label="Tambah ' +
      escapeHtml(product.name) + '" data-qty="' + id +
      '" data-step="1">' + icon('plus') + '</button><button class="remove" aria-label="Hapus ' +
      escapeHtml(product.name) + '" data-remove="' + id + '">' +
      icon('trash') + '</button></div></div></div>';
  }).join('') : noData('Keranjang masih kosong. Pilih menu untuk mulai berjualan.');

  $('#cartBadge').textContent = String(count);
  $('#cartTotal').textContent = money(total);
  $('#mobileCount').textContent = count + ' item';
  $('#mobileTotal').textContent = money(total);
  $('#openCart').classList.toggle('hidden', currentView !== 'pos' || count === 0);
  const cash = selectedPayment() === 'cash';
  $('#receivedWrap').classList.toggle('hidden', !cash);
  $('#payExact').classList.toggle('hidden', !cash);
  $('#changeRow').classList.toggle('hidden', !cash);
  $('#change').textContent = money(Math.max(0, Number($('#received').value || 0) - total));
  $('#checkout').disabled = count === 0 || submitting;
}
$('#cartLines').addEventListener('click', async (event) => {
  const remove = event.target.closest('[data-remove]');
  if (remove) {
    const id = Number(remove.dataset.remove);
    const item = products.find((product) => Number(product.id) === id);
    if (!item || !await confirmAction('Hapus dari keranjang?', 'Menu ' + item.name + ' akan dikeluarkan dari pesanan.', 'Hapus item')) return;
    cart.delete(id);
    renderCart();
    return;
  }
  const button = event.target.closest('[data-qty]');
  if (!button) return;
  const id = Number(button.dataset.qty);
  const next = (cart.get(id) || 0) + Number(button.dataset.step);
  if (next > 99) { notify('Maksimal 99 per menu.', 'error'); return; }
  if (next <= 0) cart.delete(id);
  else cart.set(id, next);
  renderCart();
});
$('#clearCart').addEventListener('click', async () => {
  if (!cart.size) return;
  if (!await confirmAction('Kosongkan keranjang?', 'Semua menu yang sudah dipilih akan dihapus dari keranjang.', 'Hapus semua')) return;
  cart.clear();
  renderCart();
});
$$('input[name="payment"]').forEach((radio) => radio.addEventListener('change', renderCart));
$('#received').addEventListener('input', renderCart);
$('#payExact').addEventListener('click', () => {
  $('#received').value = String(cartSum().total);
  renderCart();
});
$('#checkout').addEventListener('click', async () => {
  if (submitting || !cart.size) return;
  const method = selectedPayment();
  const received = method === 'cash' ? Number($('#received').value) : null;
  const total = cartSum().total;
  if (method === 'cash' && (!Number.isSafeInteger(received) || received < total)) {
    notify('Uang diterima belum cukup.', 'error');
    $('#received').focus();
    return;
  }
  const button = $('#checkout');
  const items = [...cart.entries()].map(([id, qty]) => ({ id, qty }));
  submitting = true;
  setBusy(button, true, 'Menyimpan transaksi...');
  try {
    const result = await api('checkout', { items, method, received });
    cart.clear();
    $('#received').value = '';
    closeCart();
    renderCart();
    notify('Transaksi berhasil disimpan.');
    await successDialog('Transaksi berhasil disimpan', 'No. transaksi #' + result.data.id +
      '\nTotal: ' + money(result.data.total) +
      (method === 'cash' ? '\nKembalian: ' + money(result.data.change) : '\nPembayaran: QRIS'));
  } catch (error) {
    notify(errorMessage(error), 'error');
  } finally {
    submitting = false;
    setBusy(button, false);
    renderCart();
  }
});

function initDates() {
  $('#headerDate').textContent = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  $('#from').value = today();
  $('#to').value = today();
  $('#transactionFrom').value = today();
  $('#transactionTo').value = today();
}
function queryRange(fromSelector, toSelector) {
  const from = $(fromSelector).value, to = $(toSelector).value;
  if (!from || !to || from > to) throw new Error('Rentang tanggal tidak valid.');
  return '&from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to);
}

async function loadTransactions() {
  const report = (await api('report', undefined, queryRange('#transactionFrom', '#transactionTo'))).data;
  $('#salesRows').innerHTML = report.sales.length ? report.sales.map((sale) =>
    '<tr><td>#' + sale.id + '</td><td>' + escapeHtml(readableDate(sale.created_at)) +
    '</td><td>' + safeMethod(sale.method) + '</td><td><strong>' + money(sale.total) +
    '</strong></td><td><span class="status-label' + (sale.status === 'paid' ? '' : ' void') +
    '">' + (sale.status === 'paid' ? 'Berhasil' : 'Dibatalkan') + '</span></td><td>' +
    (sale.status === 'paid' ? '<button type="button" class="btn subtle" data-void="' + sale.id +
    '">Batalkan</button>' : '—') + '</td></tr>'
  ).join('') : '<tr><td colspan="6">Belum ada transaksi pada periode ini.</td></tr>';
  $('#transactionInfo').textContent = report.sales.length + ' transaksi ditemukan · ' +
    report.summary.count + ' transaksi berhasil.';
}
$('#loadTransactions').addEventListener('click', () => loadTransactions().catch((err) => notify(errorMessage(err), 'error')));
$('#salesRows').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-void]');
  if (!button) return;
  const id = Number(button.dataset.void);
  if (!await confirmAction('Batalkan transaksi?', 'Transaksi #' + id +
    ' akan ditandai batal dan tidak dihitung sebagai pemasukan. Riwayatnya tetap tersimpan.', 'Batalkan transaksi')) return;
  setBusy(button, true, 'Memproses...');
  try {
    await api('sale-void', { id });
    notify('Transaksi #' + id + ' berhasil dibatalkan.');
    await loadTransactions();
  } catch (error) {
    notify(errorMessage(error), 'error');
    setBusy(button, false);
  }
});

async function loadExpenses() {
  const day = today();
  const report = (await api('report', undefined, '&from=' + day + '&to=' + day)).data;
  const items = report.expenses.filter((expense) => !Number(expense.deleted));
  $('#recentExpenses').innerHTML = items.length ? items.map((expense) =>
    '<div class="expense-row"><div><div class="row-title">' + escapeHtml(expense.description) +
    '</div><div class="row-sub">' + escapeHtml(readableDate(expense.created_at)) + ' · ' +
    safeMethod(expense.method) + '</div></div><div><div class="row-amount">' +
    money(expense.amount) + '</div><button type="button" class="btn-plain danger" data-delete-expense="' +
    expense.id + '">Hapus</button></div></div>'
  ).join('') : noData('Belum ada pengeluaran hari ini.');
}
$('#expenseForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitting) return;
  const form = event.currentTarget;
  const values = new FormData(form);
  const button = $('#expenseSubmit');
  const description = String(values.get('description') || '').trim();
  const amount = Number(values.get('amount'));
  const method = String(values.get('expenseMethod'));
  if (!description || !Number.isSafeInteger(amount) || amount < 1) {
    notify('Keterangan dan nominal pengeluaran harus diisi.', 'error');
    return;
  }
  submitting = true;
  setBusy(button, true, 'Menyimpan...');
  try {
    await api('expense-create', { description, amount, method });
    form.reset();
    notify('Pengeluaran berhasil dicatat.');
    await loadExpenses();
    await successDialog('Pengeluaran berhasil disimpan',
      description + '\n' + money(amount) + ' · ' + safeMethod(method));
  } catch (error) {
    notify(errorMessage(error), 'error');
  } finally {
    submitting = false;
    setBusy(button, false);
  }
});
$('#recentExpenses').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete-expense]');
  if (!button) return;
  const id = Number(button.dataset.deleteExpense);
  if (!await confirmAction('Hapus pengeluaran?', 'Catatan ini akan dikecualikan dari total pengeluaran, tetapi tetap ada dalam riwayat database.', 'Hapus pengeluaran')) return;
  try {
    await api('expense-delete', { id });
    notify('Pengeluaran telah dihapus.');
    await loadExpenses();
  } catch (error) { notify(errorMessage(error), 'error'); }
});

function reportMetric(label, value, unit = 'money') {
  return '<div class="report-stat"><small>' + escapeHtml(label) + '</small><strong>' +
    (unit === 'number' ? String(value) : money(value)) + '</strong></div>';
}
async function loadReport() {
  const report = (await api('report', undefined, queryRange('#from', '#to'))).data;
  activeReport = report;
  const s = report.summary;
  $('#summary').innerHTML = [
    reportMetric('Total pemasukan', s.income),
    reportMetric('Cash masuk', s.cash),
    reportMetric('QRIS masuk', s.qris),
    reportMetric('Total pengeluaran', s.outgoing),
    reportMetric('Cash keluar', s.expenses_cash),
    reportMetric('QRIS keluar', s.expenses_qris),
    reportMetric('Selisih operasional', s.net),
    reportMetric('Perubahan uang cash', s.cash_change),
    reportMetric('Transaksi berhasil', s.count, 'number')
  ].join('');
  $('#reportSales').innerHTML = report.sales.length ? report.sales.map((sale) =>
    '<div class="detail-row"><div><b>Transaksi #' + sale.id + '</b><small>' +
    escapeHtml(readableDate(sale.created_at)) + ' · ' + safeMethod(sale.method) +
    (sale.status === 'paid' ? '' : ' · Batal') + '</small></div><strong>' +
    (sale.status === 'paid' ? money(sale.total) : 'Dibatalkan') + '</strong></div>'
  ).join('') : noData('Belum ada penjualan pada periode ini.');
  $('#reportExpenses').innerHTML = report.expenses.length ? report.expenses.map((expense) =>
    '<div class="detail-row"><div><b>' + escapeHtml(expense.description) + '</b><small>' +
    escapeHtml(readableDate(expense.created_at)) + ' · ' + safeMethod(expense.method) +
    (Number(expense.deleted) ? ' · Dihapus' : '') + '</small></div><strong>' +
    (Number(expense.deleted) ? 'Dihapus' : money(expense.amount)) + '</strong></div>'
  ).join('') : noData('Belum ada pengeluaran pada periode ini.');
}
$('#loadReport').addEventListener('click', () => loadReport().catch((err) => notify(errorMessage(err), 'error')));
$$('[data-range]').forEach((button) => button.addEventListener('click', () => {
  const range = button.dataset.range;
  const date = new Date();
  if (range === 'today') $('#from').value = today();
  else if (range === 'week') $('#from').value = dateBefore(6);
  else {
    date.setDate(1);
    $('#from').value = isoDate(date);
  }
  $('#to').value = today();
  loadReport().catch((err) => notify(errorMessage(err), 'error'));
}));
$('#printReport').addEventListener('click', () => window.print());

function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
$('#exportReport').addEventListener('click', () => {
  if (!activeReport) { notify('Muat laporan terlebih dahulu.', 'error'); return; }
  const rows = [['Jenis', 'Tanggal', 'Keterangan', 'Metode', 'Nominal', 'Status']];
  for (const sale of activeReport.sales) rows.push([
    'Pemasukan', sale.created_at, 'Transaksi #' + sale.id, safeMethod(sale.method),
    sale.status === 'paid' ? sale.total : 0, sale.status === 'paid' ? 'Berhasil' : 'Batal'
  ]);
  for (const expense of activeReport.expenses) rows.push([
    'Pengeluaran', expense.created_at, expense.description, safeMethod(expense.method),
    Number(expense.deleted) ? 0 : expense.amount, Number(expense.deleted) ? 'Dihapus' : 'Aktif'
  ]);
  const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'emperor-laporan-' + $('#from').value + '-sd-' + $('#to').value + '.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Laporan CSV berhasil dibuat.');
});

async function loadMenu() {
  products = (await api('products')).data;
  $('#menuCount').textContent = products.length + ' menu tersedia.';
  const groups = [...new Set(products.map(productCategory))];
  $('#menuList').innerHTML = groups.map((category) => {
    const items = products.filter((product) => productCategory(product) === category);
    return '<section class="menu-section"><h3>' + escapeHtml(category) +
      '</h3><div class="menu-list">' + items.map((product) =>
        '<div class="menu-row"><span>' + escapeHtml(product.name) + '</span><strong>' +
        money(product.price) + '</strong></div>'
      ).join('') + '</div></section>';
  }).join('');
}

async function start() {
  initDates();
  try {
    const status = await api('status');
    csrf = status.csrf;
    if (status.loggedIn) {
      $('#authPage').classList.add('hidden');
      $('#appShell').classList.remove('hidden');
      await showView('dashboard');
    } else showAuth(status.setup);
  } catch (error) {
    notify(errorMessage(error), 'error');
    showAuth(false);
  }
}
start();

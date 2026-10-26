# Emperor Street Coffee POS

POS ringan berbasis **PHP native + SQLite + JavaScript vanilla**, responsif untuk mobile dan desktop, tanpa Composer atau Node. Tampilan kasir memperbarui keranjang tanpa reload.

## Menjalankan di XAMPP

1. Clone repo ke `C:\xampp\htdocs\emperor`.
2. Aktifkan Apache serta ekstensi `pdo_sqlite` di PHP 8.2+.
3. Buka `http://localhost/emperor/`.
4. Buat akun admin saat pertama kali masuk.

Aplikasi otomatis membuat database `storage/pos.sqlite`. Folder storage ditutup untuk akses HTTP oleh .htaccess; pada deployment, pastikan document root dan pengaturan akses aman. **Backup database sebelum deploy atau upgrade.**

## Fitur

Kasir 22 menu (Cash/QRIS), keranjang dan kembalian, riwayat transaksi dan pembatalan, pencatatan pengeluaran, laporan periode tanggal, ringkasan pemasukan/pengeluaran dan pencetakan. Nominal tersimpan sebagai bilangan bulat rupiah. Pembatalan tidak dihitung dalam pemasukan; pengeluaran yang dihapus tetap diaudit.

Laporan selisih operasional **bukan laba bersih akuntansi**; belum mencakup HPP, stok, atau pajak. QRIS dianggap pemasukan berdasarkan transaksi, bukan konfirmasi settlement bank.

## Troubleshooting

Jika error 500, periksa `storage/logs/error.log` atau `C:\xampp\apache\logs\error.log`. Driver SQLite yang dipakai Apache bisa berbeda dengan PHP CLI. Jangan publikasikan folder storage. Aplikasi disediakan sebagai versi awal yang memerlukan uji transaksi nyata pada instalasi XAMPP sebelum penggunaan operasional.

## Struktur

- `index.php` — antarmuka dan titik masuk
- `app.php` — autentikasi, validasi, skema SQLite, API, transaksi, laporan
- `assets/app.js` — interaksi tanpa reload
- `assets/styles.css` — layout mobile dan desktop
- `storage/` — berkas SQLite saat aplikasi berjalan (tidak di-commit)

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


## Antarmuka v2

Tampilan dibuat mobile-first dengan sidebar pada desktop dan navigasi bawah di ponsel. Tidak menggunakan foto produk, framework JavaScript, CDN, atau asset eksternal.

- **Dashboard**: pemasukan Cash/QRIS, pengeluaran, jumlah transaksi, tren 7 hari, dan transaksi terakhir; seluruh angka berasal dari database, bukan data contoh.
- **Kasir**: kategori, pencarian, kartu menu, keranjang sticky di desktop dan bottom sheet di ponsel, pilihan Cash/QRIS, uang diterima, kembalian.
- **Transaksi**: rentang tanggal, status, konfirmasi pembatalan yang mempertahankan rekam transaksi.
- **Pengeluaran**: form dengan sumber pembayaran serta daftar pengeluaran hari ini.
- **Laporan**: filter harian, 7 hari, bulanan, detail Cash/QRIS, ekspor CSV, dan cetak.
- **Daftar menu**: nama dan harga aktif yang digunakan di kasir.
- **Notifikasi**: toast sukses/error, dialog sukses setelah transaksi/pengeluaran benar-benar berhasil di server, dan dialog konfirmasi sebelum menghapus/membatalkan.

### Memperbarui instalasi lokal

Jalankan di direktori repositori:


    git pull origin main


Buka ulang `http://localhost/emperor/`. Aset sudah memakai versi query `v=2.0.0` supaya browser tidak mempertahankan CSS/JS lama.

Database `storage/pos.sqlite` tidak ikut di Git. Jangan hapus atau timpa folder `storage` ketika memperbarui aplikasi.

**Catatan:** pengujian sintaks JS dan konsistensi selector HTML dilakukan sebelum commit. Uji transaksi database end-to-end tetap harus dilakukan pada instalasi yang memiliki PDO SQLite aktif.

## Troubleshooting

Jika error 500, periksa `storage/logs/error.log` atau `C:\xampp\apache\logs\error.log`. Driver SQLite yang dipakai Apache bisa berbeda dengan PHP CLI. Jangan publikasikan folder storage. Aplikasi disediakan sebagai versi awal yang memerlukan uji transaksi nyata pada instalasi XAMPP sebelum penggunaan operasional.

## Struktur

- `index.php` — antarmuka dan titik masuk
- `app.php` — autentikasi, validasi, skema SQLite, API, transaksi, laporan
- `assets/app.js` — interaksi tanpa reload
- `assets/styles.css` — layout mobile dan desktop
- `storage/` — berkas SQLite saat aplikasi berjalan (tidak di-commit)

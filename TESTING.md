# Manual Test Checklist — Admin UI (post DS v2 migration)

Migrasi DS v1 → v2 (commit `feat(admin)`) hanya mengubah props/JSX, bukan logic.
`tsc --noEmit` clean + `npm run build` sukses, tapi berikut wajib dicek manual
di Strapi admin beneran sebelum rilis.

## Cara test
1. Install plugin build terbaru di project Strapi 5 (`npm run build` di repo plugin,
   lalu link/copy ke project test).
2. `npm run develop` → buka admin → menu plugin Elasticsearch.

## Checklist per halaman

### 1. Setup Information (home)
- [ ] Tabel info tampil benar (label kiri, value kanan), `colCount/rowCount` tidak bikin layout rusak
- [ ] Status **Connected: Yes/No** tampil dengan warna (hijau/merah)
- [ ] Tombol refresh (ikon ArrowClockwise) muncul, tooltip "Refresh" muncul saat hover, klik → reload info
- [ ] Tombol **Rebuild Index** & **Trigger Indexing** jalan, alert sukses/gagal muncul & auto-hilang 5 detik
- [ ] Alert warna sesuai: success=hijau, warning=kuning, danger=merah

### 2. Configure Collections (list)
- [ ] Tabel 4 kolom (Collection / Index / Do not Index / Actions) tampil rapi
- [ ] Ikon pensil → navigate ke halaman konfigurasi collection
- [ ] Ikon server → schedule indexing, alert muncul
- [ ] Tombol **Export** → file `strapi-plugin-elasticsearch-contentconfig.json` ke-download
  (catatan: `responseType:'blob'` dihapus — cek isi file JSON valid, bukan `[object Object]`)
- [ ] Tombol **Import** → modal terbuka
- [ ] Textarea di modal: label "Configuration Json" tampil (sekarang via `Field.Label`)
- [ ] Ketik JSON invalid → error "Invalid Json" muncul, tombol Import disabled
  (logic disabled berubah dari hack `(0 as any)` — cek: disabled saat JSON invalid ATAU kosong)
- [ ] Import JSON valid → sukses

### 3. Configure Collection (detail)
- [ ] Toggle **Index** per field: label "Index" tampil di samping toggle (bukan di atas),
  Yes/No switch berfungsi
- [ ] Input **Maps to search field**: label tampil, ketik → state update
- [ ] Dropdown **Transformer function** (kalau ada transformers): pilih → tersimpan
  (value sekarang `""` bukan `null` untuk empty state)
- [ ] Textarea **Dynamic zone/Component fields**: label tampil, JSON invalid →
  pesan error merah via `Field.Error`
- [ ] **Save Configuration Changes** → alert sukses/gagal muncul, scroll ke atas
- [ ] Link **Back** → kembali ke list

### 4. Navigasi
- [ ] Sub-nav kiri: 3 link (Setup Information / Configure Collections / Indexing Run Logs),
  link aktif ter-highlight sesuai halaman
- [ ] Section sub-nav berlabel "Navigation" (baru — DS v2 wajibkan `label`)
- [ ] Semua route admin masih resolve (`exact` dihapus — pastikan tidak ada route
  yang ke-match ganda)
- [ ] Judul tab browser di halaman detail: "Configure Collection <nama>"

### 5. Aksesibilitas cepat
- [ ] IconButton punya aria-label (inspect element) — wajib di DS v2
- [ ] Tidak ada console error React soal controlled/uncontrolled `Textarea`
  (sekarang pakai `value` bukan children)

## Known risks
- Posisi label form mungkin sedikit beda dari DS v1 (sekarang `Field.Label` manual)
- Export config: tanpa `responseType:'blob'` — verifikasi download masih benar

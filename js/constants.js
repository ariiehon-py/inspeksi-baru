// js/constants.js — Application Constants
export const SURVEYORS = [
    "Dr. Neffrety Nilamsari, S.Sos., M.Kes.",
    "Herman Bagus Dwicahyo, S.KM., M.KKK.",
    "Yunita Putri Linggarwati, S.KM.",
    "Hasan Sholeh",
    "Natasya Anggraheni Putri",
    "Nabila Eka Agustin",
    "Sahda Regita Cahyani",
    "Daninda Aisya Putri",
    "Suryan Nur Madjid",
    "Sam Ramdhani Purnama",
    "Maulana Rafa Ajie Zafira",
    "Faizah Nur Rahmannia",
    "Ngakan Komang Nadha Santika"
];

export const FAKULTAS_LIST = [
    "Fakultas Kedokteran",
    "Fakultas Kedokteran Gigi",
    "Fakultas Farmasi",
    "Fakultas Keperawatan",
    "Fakultas Kesehatan Masyarakat",
    "Fakultas Hukum",
    "Fakultas Ekonomi dan Bisnis",
    "Fakultas Ilmu Sosial dan Ilmu Politik",
    "Fakultas Psikologi",
    "Fakultas Ilmu Budaya",
    "Fakultas Sains dan Teknologi",
    "Fakultas Perikanan dan Kelautan",
    "Fakultas Vokasi",
    "Fakultas Teknologi Maju dan Multidisiplin",
    "Fakultas Kedokteran Hewan",
    "Sekolah Pascasarjana",
    "Rektorat / Kantor Pusat",
    "Perpustakaan Pusat",
    "Unit Lainnya"
];

export const APAR_CHECKLIST = [
    { id: 'apar_1', label: 'APAR Mudah dilihat dan jelas', keteranganSesuai: 'APAR terpasang di lokasi yang mudah dilihat dan dijangkau.', keteranganTidakSesuai: 'APAR tidak mudah dilihat atau terhalang oleh benda lain.' },
    { id: 'apar_2', label: 'Terdapat tanda Lokasi APAR', keteranganSesuai: 'Tanda lokasi APAR terpasang dengan jelas dan sesuai standar.', keteranganTidakSesuai: 'Tidak terdapat tanda lokasi APAR atau tanda tidak terlihat jelas.' },
    { id: 'apar_3', label: 'Tinggi Pemasangan APAR (minimal 50 cm dan maksimal 125 cm)', keteranganSesuai: 'Tinggi pemasangan APAR sesuai standar (50-125 cm dari lantai).', keteranganTidakSesuai: 'Tinggi pemasangan APAR tidak sesuai standar (di luar rentang 50-125 cm).' },
    { id: 'apar_4', label: 'APAR menggantung dan terdapat bracket/hook gantungan', keteranganSesuai: 'APAR terpasang dengan bracket/hook gantungan yang kokoh.', keteranganTidakSesuai: 'APAR tidak menggantung atau bracket/hook gantungan tidak tersedia/rusak.' },
    { id: 'apar_5', label: 'Kondisi fisik tabung', keteranganSesuai: 'Kondisi fisik tabung APAR baik, tidak berkarat, tidak penyok.', keteranganTidakSesuai: 'Kondisi fisik tabung APAR kurang baik (berkarat/penyok/rusak).' },
    { id: 'apar_6', label: 'Pin Pengaman', keteranganSesuai: 'Pin pengaman terpasang dengan baik dan tidak rusak.', keteranganTidakSesuai: 'Pin pengaman tidak terpasang, hilang, atau rusak.' },
    { id: 'apar_7', label: 'Label jenis dan petunjuk penggunaan', keteranganSesuai: 'Label jenis dan petunjuk penggunaan tersedia dan terbaca jelas.', keteranganTidakSesuai: 'Label jenis dan petunjuk penggunaan tidak tersedia atau tidak terbaca.' },
    { id: 'apar_8', label: 'Tanggal kadaluarsa terbaca jelas', keteranganSesuai: 'Tanggal kadaluarsa tertera dan terbaca dengan jelas.', keteranganTidakSesuai: 'Tanggal kadaluarsa tidak tertera atau tidak terbaca jelas.' },
    { id: 'apar_9', label: 'Manometer Normal (Zona Hijau)', keteranganSesuai: 'Manometer menunjukkan tekanan normal (zona hijau).', keteranganTidakSesuai: 'Manometer tidak menunjukkan tekanan normal (di luar zona hijau).' },
    { id: 'apar_10', label: 'Nozzle pada kondisi normal, tidak berdebu, tidak rusak', keteranganSesuai: 'Nozzle dalam kondisi normal, bersih, dan tidak rusak.', keteranganTidakSesuai: 'Nozzle berdebu, tersumbat, atau dalam kondisi rusak.' },
    { id: 'apar_11', label: 'Hose (selang) pada kondisi normal tidak retak tidak bocor', keteranganSesuai: 'Hose (selang) dalam kondisi baik, tidak retak dan tidak bocor.', keteranganTidakSesuai: 'Hose (selang) retak, bocor, atau dalam kondisi rusak.' },
    { id: 'apar_12', label: 'Kartu inspeksi tersedia dan terisi', keteranganSesuai: 'Kartu inspeksi tersedia dan terisi dengan lengkap.', keteranganTidakSesuai: 'Kartu inspeksi tidak tersedia atau tidak terisi.' },
];

export const FIRE_ALARM_CHECKLIST = [
    { id: 'fa_1', label: 'Panel fire alarm berfungsi normal', keteranganSesuai: 'Panel fire alarm berfungsi normal dan aktif.', keteranganTidakSesuai: 'Panel fire alarm tidak berfungsi normal atau mati.' },
    { id: 'fa_2', label: 'Lampu indikator power menyala', keteranganSesuai: 'Lampu indikator power menyala dengan normal.', keteranganTidakSesuai: 'Lampu indikator power tidak menyala.' },
    { id: 'fa_3', label: 'Tidak ada indikator trouble', keteranganSesuai: 'Tidak terdapat indikator trouble pada panel.', keteranganTidakSesuai: 'Terdapat indikator trouble pada panel fire alarm.' },
    { id: 'fa_4', label: 'Manual call point (MCP) dapat diakses', keteranganSesuai: 'Manual call point (MCP) dapat diakses dengan mudah.', keteranganTidakSesuai: 'Manual call point (MCP) terhalang atau tidak dapat diakses.' },
    { id: 'fa_5', label: 'MCP berfungsi saat diuji', keteranganSesuai: 'MCP berfungsi dengan baik saat dilakukan pengujian.', keteranganTidakSesuai: 'MCP tidak berfungsi saat dilakukan pengujian.' },
    { id: 'fa_6', label: 'Bell alarm berbunyi saat pengujian', keteranganSesuai: 'Bell alarm berbunyi dengan baik saat pengujian.', keteranganTidakSesuai: 'Bell alarm tidak berbunyi saat pengujian.' },
    { id: 'fa_7', label: 'Strobo lamp berfungsi', keteranganSesuai: 'Strobo lamp berfungsi dengan baik.', keteranganTidakSesuai: 'Strobo lamp tidak berfungsi atau rusak.' },
    { id: 'fa_8', label: 'Baterai cadangan dalam kondisi baik', keteranganSesuai: 'Baterai cadangan dalam kondisi baik dan terisi penuh.', keteranganTidakSesuai: 'Baterai cadangan dalam kondisi buruk atau habis.' },
    { id: 'fa_9', label: 'Zona alarm teridentifikasi jelas', keteranganSesuai: 'Zona alarm teridentifikasi dengan jelas pada panel.', keteranganTidakSesuai: 'Zona alarm tidak teridentifikasi dengan jelas.' },
    { id: 'fa_10', label: 'Catatan inspeksi tersedia', keteranganSesuai: 'Catatan inspeksi tersedia dan tercatat dengan baik.', keteranganTidakSesuai: 'Catatan inspeksi tidak tersedia atau tidak tercatat.' },
];

export const JALUR_EVAKUASI_CHECKLIST = [
    { id: 'je_1', label: 'Mudah dilihat dan jelas', keteranganSesuai: 'Jalur evakuasi mudah dilihat dan jelas.', keteranganTidakSesuai: 'Jalur evakuasi tidak mudah dilihat atau tidak jelas.' },
    { id: 'je_2', label: 'Terdapat tanda jalur evakuasi', keteranganSesuai: 'Tanda jalur evakuasi tersedia dan terpasang.', keteranganTidakSesuai: 'Tanda jalur evakuasi tidak tersedia atau tidak terpasang.' },
    { id: 'je_3', label: 'Tinggi Pemasangan safety sign rute evakuasi sesuai standar', keteranganSesuai: 'Tinggi pemasangan safety sign rute evakuasi sesuai standar.', keteranganTidakSesuai: 'Tinggi pemasangan safety sign rute evakuasi tidak sesuai standar.' },
    { id: 'je_4', label: 'Warna, gambar, dan arah safety sign rute evakuasi benar', keteranganSesuai: 'Warna, gambar, dan arah safety sign rute evakuasi sudah benar.', keteranganTidakSesuai: 'Warna, gambar, atau arah safety sign rute evakuasi tidak benar.' },
    { id: 'je_5', label: 'Peta jalur evakuasi tersedia di lokasi', keteranganSesuai: 'Peta jalur evakuasi tersedia dan terpasang di lokasi.', keteranganTidakSesuai: 'Peta jalur evakuasi tidak tersedia di lokasi.' },
    { id: 'je_6', label: 'Peta Lokasi APAR tersedia di lokasi', keteranganSesuai: 'Peta lokasi APAR tersedia dan terpasang di lokasi.', keteranganTidakSesuai: 'Peta lokasi APAR tidak tersedia di lokasi.' },
];

export const PINTU_DARURAT_CHECKLIST = [
    { id: 'pd_1', label: 'Pintu darurat mudah diakses', keteranganSesuai: 'Pintu darurat mudah diakses dan tidak terhalang.', keteranganTidakSesuai: 'Pintu darurat sulit diakses atau terhalang.' },
    { id: 'pd_2', label: 'Tidak ada hambatan di depan pintu', keteranganSesuai: 'Tidak terdapat hambatan di depan pintu darurat.', keteranganTidakSesuai: 'Terdapat hambatan di depan pintu darurat.' },
    { id: 'pd_3', label: 'Pintu membuka ke arah aliran evakuasi (outward)', keteranganSesuai: 'Pintu membuka ke arah aliran evakuasi (outward) sesuai standar.', keteranganTidakSesuai: 'Pintu tidak membuka ke arah aliran evakuasi.' },
    { id: 'pd_4', label: 'Pintu dapat dibuka tanpa kunci dari dalam', keteranganSesuai: 'Pintu dapat dibuka tanpa kunci dari dalam.', keteranganTidakSesuai: 'Pintu tidak dapat dibuka tanpa kunci dari dalam.' },
    { id: 'pd_5', label: 'Self-closing device berfungsi', keteranganSesuai: 'Self-closing device berfungsi dengan baik.', keteranganTidakSesuai: 'Self-closing device tidak berfungsi atau rusak.' },
    { id: 'pd_6', label: 'Engsel dan handle berfungsi baik', keteranganSesuai: 'Engsel dan handle pintu berfungsi dengan baik.', keteranganTidakSesuai: 'Engsel atau handle pintu tidak berfungsi dengan baik.' },
    { id: 'pd_7', label: 'Rambu EXIT terlihat jelas dan menyala/fluorescent', keteranganSesuai: 'Rambu EXIT terlihat jelas dan menyala/fluorescent.', keteranganTidakSesuai: 'Rambu EXIT tidak terlihat jelas atau tidak menyala.' },
    { id: 'pd_8', label: 'Pencahayaan darurat (Emergency Light) berfungsi', keteranganSesuai: 'Pencahayaan darurat (Emergency Light) berfungsi dengan baik.', keteranganTidakSesuai: 'Pencahayaan darurat (Emergency Light) tidak berfungsi.' },
    { id: 'pd_9', label: 'Pintu tahan api dalam kondisi baik', keteranganSesuai: 'Pintu tahan api dalam kondisi baik dan tidak rusak.', keteranganTidakSesuai: 'Pintu tahan api dalam kondisi rusak atau tidak layak.' },
    { id: 'pd_10', label: 'Terdapat catatan inspeksi berkala', keteranganSesuai: 'Catatan inspeksi berkala tersedia dan tercatat.', keteranganTidakSesuai: 'Catatan inspeksi berkala tidak tersedia.' },
    { id: 'pd_11', label: 'Terbuat dari bahan tahan api standar', keteranganSesuai: 'Pintu terbuat dari bahan tahan api sesuai standar.', keteranganTidakSesuai: 'Pintu tidak terbuat dari bahan tahan api standar.' },
];

export const TANGGA_DARURAT_CHECKLIST = [
    { id: 'td_1', label: 'Tangga darurat tersedia dan dapat digunakan', keteranganSesuai: 'Tangga darurat tersedia dan dapat digunakan dengan baik.', keteranganTidakSesuai: 'Tangga darurat tidak tersedia atau tidak dapat digunakan.' },
    { id: 'td_2', label: 'Jalur menuju tangga bebas hambatan', keteranganSesuai: 'Jalur menuju tangga darurat bebas dari hambatan.', keteranganTidakSesuai: 'Jalur menuju tangga darurat terdapat hambatan.' },
    { id: 'td_3', label: 'Tidak ada barang tersimpan di tangga/bawah tangga', keteranganSesuai: 'Tidak ada barang tersimpan di tangga atau bawah tangga.', keteranganTidakSesuai: 'Terdapat barang tersimpan di tangga atau bawah tangga.' },
    { id: 'td_4', label: 'Handrail tersedia dan kokoh', keteranganSesuai: 'Handrail tersedia dan dalam kondisi kokoh.', keteranganTidakSesuai: 'Handrail tidak tersedia atau tidak kokoh.' },
    { id: 'td_5', label: 'Pintu tangga dapat dibuka dengan mudah', keteranganSesuai: 'Pintu tangga dapat dibuka dengan mudah.', keteranganTidakSesuai: 'Pintu tangga sulit dibuka atau terkunci.' },
    { id: 'td_6', label: 'Pencahayaan darurat berfungsi', keteranganSesuai: 'Pencahayaan darurat pada tangga berfungsi dengan baik.', keteranganTidakSesuai: 'Pencahayaan darurat pada tangga tidak berfungsi.' },
    { id: 'td_7', label: 'Rambu EXIT terpasang dan terlihat jelas', keteranganSesuai: 'Rambu EXIT terpasang dan terlihat jelas di area tangga.', keteranganTidakSesuai: 'Rambu EXIT tidak terpasang atau tidak terlihat jelas.' },
    { id: 'td_8', label: 'Penanda nomor lantai tersedia', keteranganSesuai: 'Penanda nomor lantai tersedia di setiap lantai.', keteranganTidakSesuai: 'Penanda nomor lantai tidak tersedia.' },
    { id: 'td_9', label: 'Tangga terlindung dari asap dan api (presurisasi/ventilasi)', keteranganSesuai: 'Tangga terlindung dari asap dan api dengan sistem presurisasi/ventilasi.', keteranganTidakSesuai: 'Tangga tidak terlindung dari asap dan api.' },
    { id: 'td_10', label: 'Terdapat catatan inspeksi berkala', keteranganSesuai: 'Catatan inspeksi berkala tersedia dan tercatat.', keteranganTidakSesuai: 'Catatan inspeksi berkala tidak tersedia.' },
];

export const STEPS = ['data-umum', 'apar', 'fire-alarm', 'jalur-evakuasi', 'pintu-darurat', 'tangga-darurat', 'rekomendasi-pasif', 'review'];

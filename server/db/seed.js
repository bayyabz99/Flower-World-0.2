require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('./database');
const config = require('../config');

const db = getDb();

console.log('Veritabanı seed işlemi başlıyor...');

// Admin kullanıcı
const username = config.adminUsername;
const existingUser =
  db.prepare('SELECT id FROM users WHERE username = ?').get(username) ||
  db.prepare('SELECT id FROM users LIMIT 1').get();

if (!existingUser) {
  const hash = bcrypt.hashSync(config.adminPassword, 12);
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (cols.includes('username')) {
    db.prepare(
      'INSERT INTO users (username, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
    ).run(username, null, hash, 'Admin', 'admin');
  } else {
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run(
      `${username}@local`,
      hash,
      'Admin',
      'admin'
    );
  }
  console.log(`Admin oluşturuldu: ${username} / ${config.adminPassword}`);
} else if (!existingUser.username) {
  db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, existingUser.id);
}

// ─── Ürün kategorileri ───────────────────────────────────────────────────────
const productCategories = [
  { name: 'Gelin Çiçeği', slug: 'gelin-cicegi', sort_order: 1 },
  { name: 'Sevgililer Günü Çiçekleri', slug: 'sevgililer-gunu', sort_order: 2 },
  { name: 'Araba Süsleme', slug: 'araba-susleme', sort_order: 3 },
  { name: 'Gelin Arabası Süslemeleri', slug: 'gelin-arabasi-susleme', sort_order: 4 },
  { name: 'Asker Çiçekleri', slug: 'asker-cicekleri', sort_order: 5 },
  { name: 'Nişan Çiçekleri', slug: 'nisan-cicekleri', sort_order: 6 },
  { name: 'Kına Çiçekleri', slug: 'kina-cicekleri', sort_order: 7 },
  { name: 'Cenaze & Çelenk', slug: 'cenaze-celenk', sort_order: 8 },
  { name: 'Geçmiş Olsun', slug: 'gecmis-olsun', sort_order: 9 },
  { name: 'Doğum Günü Buketleri', slug: 'dogum-gunu', sort_order: 10 },
];

const insertCat = db.prepare(
  'INSERT OR IGNORE INTO categories (name, slug, sort_order) VALUES (?, ?, ?)'
);
const updateCat = db.prepare(
  'UPDATE categories SET name = ?, sort_order = ?, is_active = 1 WHERE slug = ?'
);
productCategories.forEach((c) => {
  insertCat.run(c.name, c.slug, c.sort_order);
  updateCat.run(c.name, c.sort_order, c.slug);
});

const catMap = Object.fromEntries(
  db.prepare('SELECT slug, id FROM categories').all().map((r) => [r.slug, r.id])
);

// ─── Galeri kategorileri ───────────────────────────────────────────────────────
const orgCategories = [
  { name: 'Gelin & Düğün', slug: 'gelin-dugun', sort_order: 1 },
  { name: 'Nişan & Kına', slug: 'nisan-kina', sort_order: 2 },
  { name: 'Sevgililer Günü', slug: 'sevgililer-gunu-galeri', sort_order: 3 },
  { name: 'Araba Süsleme', slug: 'araba-susleme-galeri', sort_order: 4 },
  { name: 'Asker Uğurlama', slug: 'asker-ugurlama', sort_order: 5 },
  { name: 'Cenaze & Çelenk', slug: 'cenaze-celenk-galeri', sort_order: 6 },
];

const insertOrgCat = db.prepare(
  'INSERT OR IGNORE INTO organization_categories (name, slug, sort_order) VALUES (?, ?, ?)'
);
orgCategories.forEach((c) => insertOrgCat.run(c.name, c.slug, c.sort_order));

const orgCatMap = Object.fromEntries(
  db.prepare('SELECT slug, id FROM organization_categories').all().map((r) => [r.slug, r.id])
);

// ─── Kategori başına 5 örnek ürün ────────────────────────────────────────────
function p(cat, items) {
  return items.map((item, i) => ({
    ...item,
    category_id: catMap[cat],
    is_featured: item.is_featured ?? (i === 0 ? 1 : 0),
    discount_percent: item.discount_percent || 0,
    free_shipping: item.free_shipping ? 1 : 0,
  }));
}

const products = [
  ...p('gelin-cicegi', [
    {
      title: 'Klasik Beyaz Gelin Buketi',
      slug: 'klasik-beyaz-gelin-buketi',
      description: 'Beyaz gül, ortanca ve yeşilliklerle zarif gelin buketi. Kurdele ve koruyucu ambalaj dahil.',
      price: 2850,
      sale_price: 2490,
      stock: 12,
      discount_percent: 13,
    },
    {
      title: 'Pudra Güllü Gelin Buketi',
      slug: 'pudra-gullu-gelin-buketi',
      description: 'Pudra ve krem tonlarında gül buketi; romantik düğün konseptleri için ideal.',
      price: 2650,
      stock: 10,
    },
    {
      title: 'Kır Buketi — Doğal Gelin Çiçeği',
      slug: 'kir-buketi-dogal-gelin',
      description: 'Sahada toplanmış hissi veren kır çiçekleri, lavanta ve kurdele detaylı gelin buketi.',
      price: 2200,
      stock: 14,
    },
    {
      title: 'Mini Gelin Buketi (After Party)',
      slug: 'mini-gelin-buketi-after-party',
      description: 'Düğün sonrası ve fotoğraf çekimleri için daha küçük, hafif gelin buketi.',
      price: 1450,
      sale_price: 1290,
      stock: 18,
      discount_percent: 11,
    },
    {
      title: 'Premium İspanyol Gelin Buketi',
      slug: 'premium-ispanyol-gelin-buketi',
      description: 'Düşen formda beyaz ve şampanya güller; lüks düğünler için özel tasarım.',
      price: 3950,
      stock: 6,
      free_shipping: 1,
    },
  ]),
  ...p('sevgililer-gunu', [
    {
      title: '11 Kırmızı Gül Buketi',
      slug: '11-kirmizi-gul-sevgililer',
      description: 'Sevgililer Günü klasiği: 11 adet taze kırmızı gül, siyah kurdele ve kart notu.',
      price: 890,
      sale_price: 750,
      stock: 40,
      discount_percent: 16,
    },
    {
      title: '51 Gül Dev Buket',
      slug: '51-gul-dev-buket',
      description: 'Etkileyici 51 kırmızı gül buketi; özel gün sürprizi için premium paketleme.',
      price: 4250,
      stock: 8,
      free_shipping: 1,
    },
    {
      title: 'Kalp Kutusu Gül Aranjmanı',
      slug: 'kalp-kutusu-gul-aranjmani',
      description: 'Kalp şeklinde kutuda kırmızı ve pembe güller; sevgililer günü hediye seti.',
      price: 1150,
      stock: 22,
    },
    {
      title: 'Sevgilim Mix Buket',
      slug: 'sevgilim-mix-buket',
      description: 'Gül, lisyantus ve mevsim çiçeklerinden romantik karışık buket.',
      price: 720,
      sale_price: 650,
      stock: 30,
      discount_percent: 10,
    },
    {
      title: 'Sonsuz Aşk Orkide & Gül',
      slug: 'sonsuz-ask-orkide-gul',
      description: 'Çift dal orkide ve 3 gül kombinasyonu; uzun ömürlü sevgililer hediyesi.',
      price: 1380,
      stock: 15,
    },
  ]),
  ...p('araba-susleme', [
    {
      title: 'Düğün Arabası Kapı Çelenği',
      slug: 'dugun-arabasi-kapi-celenigi',
      description: 'Kapı kolu ve cam kenarı için beyaz gül ve yeşillik çelenk seti.',
      price: 1850,
      stock: 10,
    },
    {
      title: 'Just Married Araba Süsü',
      slug: 'just-married-araba-susu',
      description: '"Just Married" yazılı plaka, balon ve çiçek kombinasyonlu arka cam süslemesi.',
      price: 1650,
      sale_price: 1490,
      stock: 12,
      discount_percent: 10,
    },
    {
      title: 'Kurdele & Gül Kapı Süsü (Çift)',
      slug: 'kurdele-gul-kapi-susu-cift',
      description: 'Her iki ön kapı için uyumlu kurdele ve gül buketi seti.',
      price: 2100,
      stock: 8,
      free_shipping: 1,
    },
    {
      title: 'Nişan Arabası Mini Süs',
      slug: 'nisan-arabasi-mini-sus',
      description: 'Nişan konvoyu için sade kapı çiçeği ve kurdele paketi.',
      price: 980,
      stock: 20,
    },
    {
      title: 'Premium Tam Kaplama Araba Süsü',
      slug: 'premium-tam-kaplama-araba',
      description: 'Kaput ve bagaj için geniş çiçek kaplama; düğün konvoyu için özel randevulu.',
      price: 5500,
      stock: 4,
      free_shipping: 1,
    },
  ]),
  ...p('gelin-arabasi-susleme', [
    {
      title: 'Gelin Arabası Tam Süs Paketi',
      slug: 'gelin-arabasi-tam-sus-paketi',
      description: 'Kaput, kapılar ve bagaj için beyaz gül ve ortanca tam süsleme paketi.',
      price: 6200,
      stock: 5,
      free_shipping: 1,
    },
    {
      title: 'Beyaz Gül Kaput Süslemesi',
      slug: 'beyaz-gul-kaput-suslemesi',
      description: 'Gelin arabası kaputu için yoğun beyaz gül ve yeşillik kaplama.',
      price: 3800,
      stock: 7,
    },
    {
      title: 'Kelebek & Gül Gelin Arabası',
      slug: 'kelebek-gul-gelin-arabasi',
      description: 'Kelebek detaylı, romantik tonlarda gelin arabası kapı ve kaput süsü.',
      price: 2950,
      sale_price: 2690,
      stock: 9,
      discount_percent: 9,
    },
    {
      title: 'Sade Gelin Arabası Kapı Seti',
      slug: 'sade-gelin-arabasi-kapi-seti',
      description: 'Minimalist gelin arabası: sade kapı buketleri ve ince kurdele.',
      price: 1750,
      stock: 11,
    },
    {
      title: 'Kırmızı Güllü Gelin Arabası (Klasik)',
      slug: 'kirmizi-gullu-gelin-arabasi',
      description: 'Kırmızı gül ağırlıklı gelin arabası süslemesi; geleneksel düğün konvoyu.',
      price: 4100,
      stock: 6,
    },
  ]),
  ...p('asker-cicekleri', [
    {
      title: 'Asker Uğurlama Buketi',
      slug: 'asker-ugurlama-buketi',
      description: 'Kırmızı-beyaz kurdele ve taze çiçeklerle asker uğurlama buketi.',
      price: 650,
      stock: 25,
    },
    {
      title: 'Vatan Sağ Olsun Çelenk (Mini)',
      slug: 'vatan-sag-olsun-celenk-mini',
      description: 'Asker töreni ve uğurlama için mini çelenk; Türk bayrağı kurdele opsiyonlu.',
      price: 890,
      stock: 18,
    },
    {
      title: 'Asker Karakolu Teslim Buket',
      slug: 'asker-karakolu-teslim-buket',
      description: 'Karakol ve birlik teslimatına uygun orta boy karışık buket.',
      price: 480,
      sale_price: 420,
      stock: 35,
      discount_percent: 13,
    },
    {
      title: 'Gururla Uğurluyoruz Aranjmanı',
      slug: 'gururla-ugurluyoruz-aranjmani',
      description: 'Krizantem, gül ve yeşilliklerle büyük asker uğurlama aranjmanı.',
      price: 1150,
      stock: 14,
    },
    {
      title: 'Asker Dönüşü Hoş Geldin Buketi',
      slug: 'asker-donusu-hos-geldin',
      description: 'Terhis ve dönüş kutlaması için renkli ve neşeli çiçek buketi.',
      price: 720,
      stock: 20,
    },
  ]),
  ...p('nisan-cicekleri', [
    {
      title: 'Nişan Masası Orta Aranjman',
      slug: 'nisan-masasi-orta-aranjman',
      description: 'Nişan masası için pastel güller ve ortanca orta boy aranjman.',
      price: 1450,
      stock: 12,
    },
    {
      title: 'Nişan Buketi — Pembe & Gold',
      slug: 'nisan-buketi-pembe-gold',
      description: 'Pembe gül buketi, gold kurdele; nişan fotoğrafları için ideal.',
      price: 1680,
      sale_price: 1490,
      stock: 10,
      discount_percent: 11,
    },
    {
      title: 'Nişan Konsept Masa Süsü (3\'lü)',
      slug: 'nisan-konsept-masa-susu-3lu',
      description: 'Üç masa için uyumlu mini aranjman seti; nişan daveti dekorasyonu.',
      price: 2200,
      stock: 8,
      free_shipping: 1,
    },
    {
      title: 'Söz & Nişan Kapı Karşılama',
      slug: 'soz-nisan-kapi-karsilama',
      description: 'Kapı girişi için standing çiçek ve balon kombinasyonlu karşılama süsü.',
      price: 2850,
      stock: 6,
    },
    {
      title: 'Mini Nişan Hediye Buketi',
      slug: 'mini-nisan-hediye-buketi',
      description: 'Davetlilere ve çifte hediye için küçük nişan buketi.',
      price: 550,
      stock: 30,
    },
  ]),
  ...p('kina-cicekleri', [
    {
      title: 'Kına Tahtı Çiçek Süslemesi',
      slug: 'kina-tahti-cicek-suslemesi',
      description: 'Kına tahtı arkası ve yanları için kırmızı-gold çiçek kaplama.',
      price: 4500,
      stock: 5,
      free_shipping: 1,
    },
    {
      title: 'Kına El Buketi — Kırmızı Dantel',
      slug: 'kina-el-buketi-kirmizi-dantel',
      description: 'Geline özel kırmızı gül ve dantel detaylı kına el buketi.',
      price: 1250,
      stock: 14,
    },
    {
      title: 'Kına Masası Orta Aranjman',
      slug: 'kina-masasi-orta-aranjman',
      description: 'Kına gecesi masası için kırmızı-bordo tonlarda orta aranjman.',
      price: 1380,
      stock: 11,
    },
    {
      title: 'Kına Gecesi Kapı Karşılama',
      slug: 'kina-gecesi-kapi-karsilama',
      description: 'Kına daveti girişi için dev çiçek ve ışıklı karşılama süsü.',
      price: 3200,
      sale_price: 2890,
      stock: 6,
      discount_percent: 10,
    },
    {
      title: 'Kına Konsept Mini Buket (Davetli)',
      slug: 'kina-konsept-mini-buket',
      description: 'Kına konseptine uygun kırmızı mini buket; davetli hediyesi.',
      price: 380,
      stock: 40,
    },
  ]),
  ...p('cenaze-celenk', [
    {
      title: 'Cenaze Çelengi — Klasik Beyaz',
      slug: 'cenaze-celengi-klasik-beyaz',
      description: 'Saygı ifadesi için beyaz-krem tonlarında standart cenaze çelengi.',
      price: 1850,
      stock: 10,
      free_shipping: 1,
    },
    {
      title: 'Cenaze Çelengi — Çift Katlı',
      slug: 'cenaze-celengi-cift-katli',
      description: 'Çift katlı, geniş yapraklı premium cenaze çelengi.',
      price: 2650,
      stock: 6,
      free_shipping: 1,
    },
    {
      title: 'Tabut Üstü Çelenk (Orta)',
      slug: 'tabut-ustu-celenk-orta',
      description: 'Tabut üzerine yerleştirilen orta boy çelenk aranjmanı.',
      price: 1450,
      stock: 8,
    },
    {
      title: 'Taziye Çiçeği Buketi',
      slug: 'taziye-cicegi-buketi',
      description: 'Yakın aile için sade beyaz çiçek taziye buketi.',
      price: 680,
      stock: 20,
    },
    {
      title: 'Cenaze Salonu Büyük Çelenk',
      slug: 'cenaze-salonu-buyuk-celenk',
      description: 'Cenaze salonu girişi için büyük boy çelenk; yazılı kurdele dahil.',
      price: 3200,
      stock: 5,
      free_shipping: 1,
    },
  ]),
  ...p('gecmis-olsun', [
    {
      title: 'Geçmiş Olsun Papatya Buketi',
      slug: 'gecmis-olsun-papatya-buketi',
      description: 'Beyaz papatya ve yeşilliklerle sakin hastane buketi.',
      price: 480,
      stock: 35,
    },
    {
      title: 'Hastane Odası Aranjmanı',
      slug: 'hastane-odasi-aranjmani',
      description: 'Kokusuz, alerji dostu çiçeklerle hastane odası aranjmanı.',
      price: 620,
      sale_price: 550,
      stock: 28,
      discount_percent: 11,
    },
    {
      title: 'Renkli Geçmiş Olsun Mix',
      slug: 'renkli-gecmis-olsun-mix',
      description: 'Neşeli tonlarda karışık mevsim buketi; moral yükseltmek için.',
      price: 590,
      stock: 25,
    },
    {
      title: 'Orkide Geçmiş Olsun',
      slug: 'orkide-gecmis-olsun',
      description: 'Tek dal beyaz orkide, uzun süre dayanıklı geçmiş olsun hediyesi.',
      price: 750,
      stock: 18,
    },
    {
      title: 'Premium Geçmiş Olsun Sepeti',
      slug: 'premium-gecmis-olsun-sepeti',
      description: 'Sepet içinde gül, krizantem ve mevsim çiçekleri; büyük boy.',
      price: 980,
      stock: 12,
      free_shipping: 1,
    },
  ]),
  ...p('dogum-gunu', [
    {
      title: 'Doğum Günü Balonlu Buket',
      slug: 'dogum-gunu-balonlu-buket',
      description: 'Renkli çiçekler ve doğum günü balonu ile neşeli buket.',
      price: 650,
      stock: 30,
    },
    {
      title: 'Yaş Gülü Doğum Günü Buketi',
      slug: 'yas-gulu-dogum-gunu',
      description: 'İstenen yaş rakamı güllerle hazırlanan özel doğum günü buketi.',
      price: 890,
      sale_price: 790,
      stock: 22,
      discount_percent: 11,
    },
    {
      title: 'Pastel Doğum Günü Aranjmanı',
      slug: 'pastel-dogum-gunu-aranjmani',
      description: 'Pembe, lavanta ve krem tonlarda masa aranjmanı.',
      price: 720,
      stock: 20,
    },
    {
      title: 'Surprise Box Doğum Günü',
      slug: 'surprise-box-dogum-gunu',
      description: 'Kutuda gül ve çikolata alanı bırakılmış doğum günü hediye seti.',
      price: 1150,
      stock: 15,
    },
    {
      title: 'Dev Doğum Günü Buketi',
      slug: 'dev-dogum-gunu-buketi',
      description: 'Büyük boy karışık çiçek buketi; özel kutlama için.',
      price: 1380,
      stock: 10,
      free_shipping: 1,
    },
  ]),
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (title, slug, description, price, sale_price, stock, category_id,
    discount_percent, is_featured, is_active, free_shipping)
  VALUES (@title, @slug, @description, @price, @sale_price, @stock, @category_id,
    @discount_percent, @is_featured, 1, @free_shipping)
`);

const updateProduct = db.prepare(`
  UPDATE products SET
    title = @title, description = @description, price = @price, sale_price = @sale_price,
    stock = @stock, category_id = @category_id, discount_percent = @discount_percent,
    is_featured = @is_featured, is_active = 1, free_shipping = @free_shipping,
    updated_at = datetime('now')
  WHERE slug = @slug
`);

products.forEach((item) => {
  const row = {
    title: item.title,
    slug: item.slug,
    description: item.description,
    price: item.price,
    sale_price: item.sale_price ?? null,
    stock: item.stock,
    category_id: item.category_id,
    discount_percent: item.discount_percent || 0,
    is_featured: item.is_featured ? 1 : 0,
    free_shipping: item.free_shipping ? 1 : 0,
  };
  insertProduct.run(row);
  updateProduct.run(row);
});

// Eski demo kategorileri pasife al (yeni katalog dışı)
const activeSlugs = productCategories.map((c) => c.slug);
const deactivateOld = db.prepare(
  `UPDATE categories SET is_active = 0 WHERE slug NOT IN (${activeSlugs.map(() => '?').join(',')})`
);
deactivateOld.run(...activeSlugs);

// ─── Galeri örnekleri ────────────────────────────────────────────────────────
const organizations = [
  {
    title: 'Gelin Arabası Beyaz Gül Kaplama',
    slug: 'galeri-gelin-arabasi-beyaz-gul',
    description: 'Tam kaplama beyaz gül gelin arabası süslemesi.',
    category_id: orgCatMap['gelin-dugun'],
    location: 'Konya',
    is_featured: 1,
  },
  {
    title: 'Kına Tahtı Kırmızı Gold Konsept',
    slug: 'galeri-kina-tahti-kirmizi-gold',
    description: 'Kına gecesi tahtı çiçek ve ışık süslemesi.',
    category_id: orgCatMap['nisan-kina'],
    location: 'Konya',
    is_featured: 1,
  },
  {
    title: 'Sevgililer Günü 101 Gül Teslimat',
    slug: 'galeri-sevgililer-101-gul',
    description: 'Özel sipariş 101 gül buketi teslimatı.',
    category_id: orgCatMap['sevgililer-gunu-galeri'],
    location: 'Konya',
    is_featured: 1,
  },
  {
    title: 'Düğün Konvoyu Araba Süsleme',
    slug: 'galeri-dugun-konvoyu-araba',
    description: '5 araçlık konvoy kapı ve kaput süslemesi.',
    category_id: orgCatMap['araba-susleme-galeri'],
    location: 'Konya',
  },
  {
    title: 'Asker Uğurlama Töreni Çelenk',
    slug: 'galeri-asker-ugurlama-celenk',
    description: 'Birlik önünde asker uğurlama çelenk ve buket teslimatı.',
    category_id: orgCatMap['asker-ugurlama'],
    location: 'Konya',
  },
  {
    title: 'Cenaze Çelengi Teslimat',
    slug: 'galeri-cenaze-celengi-teslimat',
    description: 'Camii önü cenaze çelengi teslimat ve kurulum.',
    category_id: orgCatMap['cenaze-celenk-galeri'],
    location: 'Konya',
  },
];

const insertOrg = db.prepare(`
  INSERT OR IGNORE INTO organizations (title, slug, description, category_id, location, is_published, is_featured)
  VALUES (@title, @slug, @description, @category_id, @location, 1, @is_featured)
`);

organizations.forEach((o) => {
  insertOrg.run({ ...o, is_featured: o.is_featured ? 1 : 0 });
});

const productCount = db.prepare('SELECT COUNT(*) AS c FROM products WHERE is_active = 1').get().c;
const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories WHERE is_active = 1').get().c;

console.log(`Seed tamamlandı: ${catCount} kategori, ${productCount} aktif ürün.`);
console.log(`\n  Site: http://localhost:${config.port}`);
console.log(`  Admin: http://localhost:${config.port}/admin`);
console.log(`  Giriş: ${username} / ${config.adminPassword}\n`);

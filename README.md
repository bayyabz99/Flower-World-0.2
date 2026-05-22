# Flower Çiçekçilik

Modern çiçek ve buket e-ticaret sitesi — Node.js, Express, SQLite.

## Özellikler

- **E-ticaret:** Kategori filtreleri, buket kartları, sepet, checkout
- **Teslimat:** Kapıda nakit, kapıda kart, kredi kartı altyapısı (Iyzico/Stripe)
- **Galeri:** Teslimat galerisi — düğün, doğum günü ve özel gün çiçekleri
- **Admin panel:** Çiçek, kategori, galeri, sipariş ve sistem ayarları
- **SEO:** Türkçe slug URL'ler (`/urun/21-gul-buketi`, `/is/dugun-masasi-gul-aranjmani`)
- **Görseller:** Sharp ile WebP optimizasyonu (thumb, medium, large)

## Gereksinimler

- **Node.js 22.5+** (yerleşik `node:sqlite` kullanılır; ek derleme gerekmez)

## Kurulum

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
- Varsayılan giriş: `admin` / `admin123` (kullanıcı adı + şifre)

## Proje Yapısı

```
├── server/
│   ├── index.js          # Sunucu girişi
│   ├── app.js            # Express yapılandırması
│   ├── config/           # Ortam ayarları
│   ├── db/               # Şema, seed, SQLite
│   ├── middleware/       # Auth, upload
│   ├── repositories/     # Veritabanı işlemleri
│   ├── routes/           # Public, admin, API
│   └── services/         # Görsel işleme
├── views/                # EJS şablonları
├── public/               # CSS, JS, uploads
└── data/                 # SQLite veritabanı
```

## Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `users` | Admin kullanıcılar |
| `categories` | Çiçek kategorileri |
| `products` | Buket ve çiçek ürünleri |
| `product_images` | Ürün görselleri |
| `organization_categories` | Galeri kategorileri |
| `organizations` | Teslimat galeri kayıtları |
| `organization_images` | Galeri görselleri |
| `orders` / `order_items` | Siparişler |
| `settings` | İletişim ve ödeme ayarları |

## Render'da Yayınlama

1. GitHub'a yükleyin, Render → **New Web Service** → repoyu bağlayın.
2. **Build:** `npm install` · **Start:** `npm start`
3. **Environment Variables** (zorunlu):

| Değişken | Açıklama |
|----------|----------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | Uzun rastgele metin |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | Güçlü şifreniz |

4. Deploy sonrası admin: `https://SIZIN-URL.onrender.com/admin/giris`

İlk açılışta admin otomatik oluşturulur. `ADMIN_PASSWORD` Render'da tanımlıysa her deploy'da şifre buna eşitlenir.

## Ödeme Entegrasyonu

1. `.env` dosyasına Iyzico veya Stripe anahtarlarını ekleyin
2. Admin → Sistem Ayarları'ndan ilgili ödeme yöntemini aktif edin
3. Online ödeme için `iyzico_enabled` veya `stripe_enabled` değerini `1` yapın

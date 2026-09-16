# DENGE PWA

DENGE; iPhone Safari üzerinde çalışmak, **Ana Ekrana Ekle** ile kurulmak ve fiziksel hareketleri cihaz içinde analiz etmek üzere tasarlanmış bir Progressive Web App'tir. Kamera görüntüsü kaydedilmez veya sunucuya gönderilmez. Personel ve test sonuçları, cihazdaki IndexedDB veritabanında tutulur.

## Kurulum ve çalıştırma

Bu proje Node.js 20+ ve npm ile hazırlanmıştır.

```bash
npm install
npm run dev
```

Tarayıcıda Vite'ın gösterdiği yerel adresi açın. Üretim derlemesi için:

```bash
npm run build
npm run preview
```

Testler:

```bash
npm test
```

Bu çalışma ortamında `npm` komutu bulunmadığı için eşdeğer paket yöneticisiyle `pnpm install` kullanılmıştır. Kendi bilgisayarınızda standart `npm install` yeterlidir.

## iPhone ve PWA kurulumu

Kamera, Safari'de yalnızca `https://` adresinden (veya yerel geliştirmede `localhost`) açılabilir. Telefonu aynı Wi‑Fi ağına bağlayarak bir HTTPS geliştirme tüneli kullanın ya da projeyi yayınlayın. Safari'de adresi açın, **Paylaş** düğmesine basın ve **Ana Ekrana Ekle** seçeneğini kullanın. Uygulama ana ekranda **DENGE** adı ve kendi ikonu ile görünür.

PWA service worker'ı temel uygulama dosyalarını önbelleğe alır. MediaPipe modeli ve WASM dosyaları da ilk başarılı kullanımdan sonra çalışma zamanı önbelleğine alınır. İlk pose kullanımı için internet bağlantısı gerekir.

## JSON personel formatı

```json
[
  {
    "sicilNo": "1001",
    "rutbe": "Tnk.Tğm.",
    "ad": "AD",
    "soyad": "SOYAD",
    "birlik": "BİRLİK"
  }
]
```

Örnek dosya: `public/personel_ornek.json`. İçe aktarma önce önizlenir; mevcut ve hatalı kayıtlar otomatik atlanır. Ayarlar ekranındaki **VERİLERİ DIŞA AKTAR** ile tüm personel/sonuç verisini tek JSON dosyasında yedekleyebilirsiniz. Tarayıcı veya site verilerinin silinmesi bu yerel kayıtları da siler.

## Ücretsiz HTTPS yayınlama

`npm run build` sonrasında oluşan `dist/` klasörünü Cloudflare Pages, Netlify veya GitHub Pages gibi HTTPS sağlayan bir statik barındırma hizmetine yükleyin. Cloudflare Pages ve Netlify'da Git deposunu bağlayıp build komutunu `npm run build`, publish dizinini `dist` olarak seçmek yeterlidir.

## Gerçek cihaz doğrulaması

- Arka ve ön kamerada izin penceresini ve ayna dönüşümünü kontrol edin.
- İskeletin `object-fit: cover` kesimi sırasında eklemlere oturduğunu kontrol edin.
- Üç hareket için ayrı state machine eşiklerini gerçek iPhone görüntüleriyle kalibre edin.
- Arka plana geçildiğinde kameranın durduğunu, döndükten sonra yeniden başlatılabildiğini doğrulayın.
- JSON aktarma, veri yedeği ve sonuçların doğru personele yazılmasını deneyin.

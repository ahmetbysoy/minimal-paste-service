# Minimal Paste — Project Task Specification
«Proje: 24 Saatlik Minimal Paste Service
Ana amaç: Kullanıcının metin/kod yapıştırıp anında paylaşılabilir bir URL almasını sağlamak. Paste'ler maksimum 24 saat yaşar ve sonrasında otomatik olarak silinir.
Temel prensip: Gereksiz özellik yok. Dosya upload yok. Kullanıcı hesabı yok. Karmaşık UI yok. Küçük, hızlı, güvenli ve kolay deploy edilebilir bir sistem.»

## KESİN GEREKSİNİMLER
- Maksimum paste boyutu: 5 MiB (UTF-8 byte boyutu)
- Expiration: createdAt + 24 saat
- ID: Tahmin edilemez, crypto.getRandomValues() tabanlı
- Storage: Vercel Blob (GitHub storage DEĞİL)
- Frontend: Tek dosya (index.html), React/Vite/Tailwind YOK
- Cleanup: GitHub Actions ile scheduled deletion

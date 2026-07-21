# Roadmap

## Sprint 1 — Kurulum & Auth
- Proje kurulumu
- E-posta OTP auth
- Workspace oluşturma

## Sprint 2 — Onboarding
- Maaş / mesai girişi (slider UI)
- Rutin gider girişi: önceden tanımlı kategori listesinden (Kira, Elektrik, Su, Doğalgaz, İnternet, Telefon, Abonelikler vb.) seçilebilir checklist + kesim günü / son ödeme günü, "Diğer" ile özel kategori ekleme
- Kredi kartı girişi (limit, kesim/son ödeme günü)
- Yatırım platformu + toplam bakiye girişi

## Sprint 3 — Gelir & Gider Yönetimi
- Gelir görüntüleme/güncelleme
- Rutin gider yönetimi
- Tek seferlik gider girişi
- Dashboard (aylık özet)

## Sprint 4 — Kredi Kartları
- Aylık ekstre tutarı girişi
- Kredi kartına ödeme yapma
- Ödeme geçmişi
- Taksitli alışveriş girişi (eşya, toplam tutar, taksit sayısı, ödeme yöntemi) ve gelecek ay taksit yükü hesaplama
- Bildirimler (son ödeme tarihi)

## Sprint 5 — Yatırımlar
- Para çekme / yatırma hareketleri
- Yatırım geçmişi ve bakiye hesaplama
- Portföy özet görünümü (platform bazlı dağılım)

## Sprint 6 — Hedefler / Birikim Planları
- Tatil / satın alım hedefi oluşturma (hedef tarih + tutar)
- Aylık ayrılması gereken tutarın otomatik hesaplanması
- Hedefe ilerleyiş takibi

## Sprint 6.5 — Gelişmiş Hesaplama & İçgörü
- What-if hesaplayıcı (fazla harcama → hedef gecikmesi simülasyonu)
- Nakit akışı takvimi (heatmap)
- Plansız gelir / harcama girişi (ödeme yöntemi ayrımı: nakit / kredi kartı / banka hesabı)
- Kredi kartı ekstre uzlaştırma mantığı (çift sayım önleme)
- Harcama kategorileri ve kategori bazlı içgörü (ör. "bu ay yemeğe çok harcadın")

## Sprint 7 — Varlıklar
- Ev / Arsa / Araç ekleme
- Vergi, DASK, sigorta, kasko tarihleri
- MTV varsayılan dönem mantığı (Ocak/Temmuz)

## Sprint 8 — Bildirimler
- Merkezi bildirim servisi (edge function **veya** Railway cron worker — bkz. ARCHITECTURE.md dağıtım)
- Kredi kartı, vergi, sigorta, kasko, tek seferlik gider hatırlatmaları
- Kademeli bildirim (7 gün önce / 1 gün önce / gün içi), kullanıcı bazlı tercih ayarı
- Önkoşul: ilgili domain verinin Supabase’te olması; istemci AsyncStorage-only iken sunucu cron’u açılmaz

## Sprint 9 — Finansal İçgörü / Raporlar
- Aylık bütçe durumu özeti
- Harcama eğilimi analizi (kategori bazlı, ör. "bu ay yemeğe çok harcadın")
- Hedeflere ilerleyiş raporu
- Varlık değeri endeksleme (TCMB EVDS — TÜFE/döviz kuru önerisi, kullanıcı onaylı; scheduled job: Edge veya Railway)
- Ana ekran widget'ı (kalan bütçe özeti)

## Hosting notu (sürekli)
- Expo uygulaması Railway’de barındırılmaz.
- Railway yalnızca Sprint 8/9 (ve Faz 2 mail) worker ihtiyacı doğunca değerlendirilir.

## Sprint 10 — Dışa Aktarım
- CSV export
- PDF export

## Sprint 11 — Aile / Hane Kullanımı (Faz 2)
- Workspace paylaşımı, davet mekanizması
- Rol bazlı yetkilendirme (owner/member)
- Ortak bütçe ve varlık görünümü

## Sprint 12 — Mail Entegrasyonu (Faz 2)
- E-posta hesabı bağlama (OAuth, Gmail vb.)
- Banka ekstresi / harcama e-postalarının tespiti ve parse edilmesi
- Otomatik ekstre/harcama önerisi, kullanıcı onayı ile kayda dönüştürme
- Manuel giriş alanlarının kademeli olarak daraltılması

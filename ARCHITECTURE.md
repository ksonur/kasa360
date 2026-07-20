# Sistem Mimarisi

```
React Native (Expo)
        |
 Supabase Auth (Email OTP)
        |
 PostgreSQL (RLS, workspace_id izolasyonu)
        |
 Edge Functions
   ├── Bildirim Servisi (kademeli hatırlatmalar: 7g/1g/gün içi, kullanıcı tercihine göre)
   ├── Hesaplama Servisi (bakiye, hedef ilerleme, what-if senaryo, bütçe özeti, ekstre uzlaştırma)
   ├── Varlık Endeksleme Servisi (TCMB EVDS — TÜFE/döviz kuru serileri, periyodik güncelleme önerisi)
   └── Mail Entegrasyon Servisi (Faz 2 — OAuth + parser)
        |
 Notifications (push / in-app / home-screen widget)
```

## Feature Bazlı Yapı
```
auth/
onboarding/
dashboard/
income/
expenses/
cards/
investments/
goals/
assets/
notifications/
reports/
settings/
family/          (Faz 2)
mail-integration/ (Faz 2)
```

## Katman Notları
- **Auth**: Supabase e-posta OTP, oturum yönetimi.
- **Onboarding**: Adım adım (wizard) veri toplama; her adım kısmi kaydedilebilir.
- **Income/Expenses/Cards/Investments/Assets**: Her biri kendi CRUD + hareket (transaction) geçmişine sahip bağımsız feature modülleri.
- **Goals**: Hedef tarih + hedef tutar alıp gerekli aylık ayırım miktarını hesaplayan türetilmiş (derived) modül; income/expenses'ten bağımsız ama dashboard'da birleşik gösterim.
- **Notifications**: Tüm modüllerden tarih bazlı tetikleyici toplayan merkezi servis; UI'dan bağımsız çalışır (edge function + scheduled job).
- **Reports**: Dashboard ve export (CSV/PDF) için salt-okunur agregasyon katmanı.
- **Family (Faz 2)**: workspace paylaşımı, üyelik ve rol yönetimi; mevcut RLS/workspace_id modeline üye bazlı yetki ekler.
- **Mail Integration (Faz 2)**: Kullanıcının e-posta hesabına salt-okunur bağlanma (OAuth), banka/harcama e-postalarının ayrıştırılması, önerilen kayıtların kullanıcı onayına sunulması. Bu servis diğer modüllerden izole tutulur; hatalı parse durumunda finansal kayıtlara doğrudan yazma yapılmaz, önce "öneri" tablosuna düşer.
- **What-if Hesaplayıcı**: Hesaplama Servisi içinde salt-okunur bir fonksiyon; herhangi bir kayıt oluşturmadan mevcut hedef/bakiye verisi üzerinden anlık senaryo sonucu döner (state-less).
- **Nakit Akışı Takvimi**: Reports/Dashboard katmanında, expense_templates/credit_cards/asset_obligations tablolarındaki tarih alanlarını tek bir zaman ekseninde birleştiren salt-okunur agregasyon view'ı.
- **Varlık Endeksleme Servisi**: TCMB EVDS API'sinden (ücretsiz API anahtarı ile) TÜFE/döviz kuru serilerini periyodik çeken, `asset_value_index_settings` ve `asset_value_history` tablolarına öneri düşen scheduled job. Kullanıcı onayı olmadan `assets.tahmini_deger` güncellenmez.
- **Ekstre Uzlaştırma**: Hesaplama Servisi, kredi kartı ekstresi girildiğinde ilgili dönemin `transactions` toplamıyla karşılaştırma yapar; fark varsa "detaylandırılmamış harcama" kaydı oluşturur (bkz. DATABASE.md). Böylece manuel plansız harcama girişi ile ekstre tutarı çift sayılmaz.
- **Ana Ekran Widget'ı**: Expo/React Native native widget modülü (iOS WidgetKit / Android App Widget); Hesaplama Servisi'nin ürettiği "kalan bütçe" özetini düşük frekansta (ör. günde birkaç kez) çeken hafif, salt-okunur bir uç nokta üzerinden beslenir.
- **Taksit Tahmini**: Hesaplama Servisi, `installment_purchases` tablosundaki `remaining_installments` ve `monthly_amount` alanlarını kullanarak gelecek ayların kart/nakit yükünü önceden hesaplar; bu veri Nakit Akışı Takvimi'ne ve "gelecekte kartıma ne kadar ödeyeceğim" görünümüne beslenir. Kredi kartı taksitleri ekstre uzlaştırma mantığına dahildir, nakit taksitler dahil değildir.
- **Görsel Kimlik**: Frontend tarafında ana renk paleti yeşil ve beyaz olarak sabitlenir (design tokens seviyesinde tanımlanır, feature modülleri arasında tutarlılık için).

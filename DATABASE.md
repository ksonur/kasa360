# Database Taslağı

## Mevcut Tablolar
- users
- workspaces
- workspace_members            (Faz 2 — aile/hane kullanımı, rol: owner/member)
- income_sources
- monthly_income_plans
- expense_templates             (rutin giderler: kesim günü, son ödeme günü)
- monthly_expenses               (rutin giderlerin aylık gerçekleşmesi)
- one_time_expenses              (tek seferlik giderler)
- accounts
- credit_cards                   (limit, kesim günü, son ödeme günü)
- credit_card_statements         (aylık ekstre tutarı)
- credit_card_payments           (karta yapılan ödeme kayıtları)
- transactions
- investment_platforms
- investment_assets
- investment_transactions        (para çekme/yatırma hareketleri)
- portfolio_snapshots
- purchase_goals                  (tatil/satın alım hedefleri: hedef tarih, hedef tutar, aylık ayırım)
- assets                          (ev, arsa, araç)
- asset_obligations               (vergi, DASK, sigorta, kasko dönemleri)
- liabilities
- notifications
- email_connections               (Faz 2 — mail entegrasyonu, OAuth bağlantısı)
- email_parsed_suggestions        (Faz 2 — mailden çıkarılan, onay bekleyen ekstre/harcama önerileri)
- extra_income                     (maaş/mesai dışı ek gelir: freelance, hediye, iade vb. — tarih, tutar, kaynak, kategori)
- expense_categories               (sadece önceden tanımlı sabit liste — sistem seed'i; kullanıcı özel kategori satırı oluşturmaz)
- installment_purchases            (taksitli alışverişler: eşya adı, toplam tutar, taksit sayısı, aylık taksit tutarı, başlangıç tarihi, ödeme yöntemi, ilişkili kart)
- asset_value_index_settings       (varlık bazında endeksleme tipi: TÜFE / döviz kuru / manuel, kaynak seri kodu)
- asset_value_history              (varlığın zaman içindeki değer güncellemeleri; kullanıcı onayı ile asset.tahmini_deger'e yansır)
- notification_preferences         (kullanıcı/kayıt türü bazlı kademeli hatırlatma ayarı: gün önce listesi, ör. [7,1,0])

## transactions Tablosu — Ek Alanlar
- `payment_method`  (nakit / kredi_karti / banka_hesabi)
- `credit_card_id`  (payment_method = kredi_karti ise dolu, ilgili karta FK)
- `statement_period` (payment_method = kredi_karti ise, ilişkili olduğu ekstre dönemi)
- `category_id`     (expense_categories FK; sabit listeden biri seçilir)
- `custom_label`    (category_id = "Diğer" seçildiğinde girilen serbest metin; ayrı bir kategori kaydı açılmaz)
- `source`          (manuel / email_parsed — hangi yoldan geldiği)

## expense_categories — Sabit Liste
Sistemde sabit, değiştirilemez bir liste olarak tutulur (kullanıcı yeni kategori satırı ekleyemez, sadece "Diğer" ile serbest metin girer):
- Kira
- Elektrik
- Su
- Doğalgaz
- İnternet
- Telefon
- Abonelikler (Netflix, Spotify vb.)
- Market / Gıda
- Ulaşım
- Sağlık
- Eğitim
- Giyim
- Eğlence / Sosyal
- Diğer (seçildiğinde `custom_label` alanı serbest metin olarak doldurulur)

Kategori ataması her zaman manueldir; hiçbir otomatik/AI tahminiyle doğrudan atanmaz — mail entegrasyonu (Faz 2) sadece öneri sunar, kullanıcı onaylamadan kayda işlenmez.

## installment_purchases Tablosu
- `id`, `workspace_id`
- `item_name` — eşya/hizmet adı
- `total_amount` — toplam tutar (numeric)
- `installment_count` — taksit sayısı
- `monthly_amount` — hesaplanan aylık taksit tutarı (derived: total_amount / installment_count, yuvarlama farkı son taksitte düzeltilir)
- `start_date` — ilk taksit tarihi
- `payment_method` — kredi_karti / nakit
- `credit_card_id` — payment_method = kredi_karti ise dolu, ilgili karta FK
- `remaining_installments` — derived, kalan taksit sayısı
- `status` — aktif / kapatıldı (erken ödeme durumunda kullanıcı manuel olarak "kapatıldı" işaretler)
- `closed_at` — manuel kapatma tarihi (status = kapatıldı ise dolu)

Kurallar:
- `payment_method = kredi_karti` olan taksitler, ilgili kartın her dönemindeki `transactions`'a otomatik olarak bir "taksit" kaydı düşürür ve ekstre uzlaştırmasına (bkz. yukarıdaki reconciliation kuralı) dahil edilir.
- `payment_method = nakit` olan taksitler (mağaza taksit planı vb.) kart/ekstre hesaplamasını etkilemez, sadece nakit akışı takvimine ve aylık gider toplamına yansır.
- Nakit Akışı Takvimi ve "gelecekte kartıma ne kadar ödeyeceğim" görünümü, `remaining_installments` üzerinden gelecek ayların toplam taksit yükünü hesaplayarak gösterir.
- Erken kapatma (kalan taksitlerin tek seferde ödenmesi) otomatik algılanmaz; kullanıcı `status`'u manuel olarak "kapatıldı" işaretler. Kapatıldıktan sonra ileriye dönük taksit kayıtları (henüz gerçekleşmemiş dönemler) oluşturulmaz, geçmiş dönemlere ait zaten oluşmuş `transactions` kayıtları değişmez (append-only kuralı).

## Kredi Kartı Ekstre Uzlaştırma (Reconciliation) Kuralı
Çift sayımı önlemek için ekstre tutarı hesaplamanın kaynağı değil, **doğrulama referansı**dır:
1. Kullanıcı bir harcamayı anında girer ve `payment_method = kredi_karti` seçerse, bu kayıt ilgili kartın `statement_period`'una bağlanır.
2. İlgili dönem için ekstre (`credit_card_statements.tutar`) girildiğinde, sistem o dönem için zaten girilmiş `transactions` toplamını hesaplar ve ekstre tutarıyla karşılaştırır.
3. Ekstre tutarı ile girilen harcamaların toplamı eşitse, tüm harcamalar zaten detaylandırılmış demektir.
4. Ekstre tutarı daha yüksekse, aradaki fark otomatik olarak "detaylandırılmamış harcama" adıyla tek bir transactions kaydı oluşturur (kullanıcı isterse sonradan bölüp kategorilendirebilir).
5. Bütçe/dashboard hesaplamaları her zaman `transactions` tablosundan beslenir; `credit_card_statements.tutar` sadece uzlaştırma ve uyarı amaçlıdır — asla iki kez toplanmaz.
- Nakit (`payment_method = nakit`) harcamalar hiçbir kart/ekstre hesaplamasına dahil edilmez, doğrudan aylık gider toplamına eklenir.

## Kurallar
- UUID PK
- numeric finansal alanlar (float yok)
- created_at / updated_at
- Row Level Security
- workspace_id ile izolasyon
- Finansal geçmiş kayıtları değiştirilmez; düzeltme yeni kayıt olarak eklenir (append-only + audit alanı)
- investment_transactions ve credit_card_payments hareket bazlıdır; güncel bakiye bu hareketlerden türetilir (derived), doğrudan güncellenen bir "balance" alanı tutulmaz
- email_parsed_suggestions durum alanına sahiptir (pending/approved/rejected); onaylanmadan ilgili finansal tabloya (transactions, credit_card_statements vb.) yazılmaz
- workspace_members ile paylaşılan workspace'lerde her üyenin rolüne göre yazma/okuma yetkisi RLS politikalarıyla sınırlandırılır

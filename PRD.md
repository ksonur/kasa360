# Product Requirements Document

## Amaç
Kullanıcının minimum veri girişiyle gelir, gider, yatırım, kredi kartı, varlık ve finansal hedeflerini yönetmesini, geleceğe yönelik planlama yapabilmesini ve varlıklarının farkında olmasını sağlamak.

## Giriş
- E-posta OTP ile giriş (şifresiz).

## Onboarding
1. **Gelir**: Maaş ve mesai tutarı (slider + manuel giriş).
2. **Rutin Giderler**: Sistem, kullanıcıya önceden tanımlı yaygın kategorileri (Kira, Elektrik, Su, Doğalgaz, İnternet, Telefon, Abonelikler, vb.) seçilebilir bir liste olarak sunar; kullanıcı hangileri kendisine uyguluyorsa seçer, seçtiği her kategori için tutar, kesim günü ve son ödeme günü girer. Listede olmayan bir gider için "Diğer" seçilir ve serbest metin olarak adı yazılır (ayrı bir kategori kaydı oluşturulmaz, sadece o giderin etiketi olarak tutulur).
3. **Kredi Kartları**: Kart limiti, ekstre kesim günü, son ödeme günü.
4. **Yatırımlar**: Platform adı ve o platformdaki toplam bakiye (varlık bazında detay değil, toplam bakiye girişi).

Onboarding adımları arasında geri dönülebilir, yarıda bırakılıp devam edilebilir olmalı.

## Aylık Kullanım Akışı
- **Ekstre Girişi**: Kullanıcı o ayki kredi kartı ekstre tutarlarını girer.
- **Yatırım Hareketleri**: Yatırım bakiyesinden para çekebilir veya yatırabilir; bu hareketler geçmiş olarak tutulur.
- **Kredi Kartı Ödemesi**: Kullanıcı kartına ödeme yapabilir, ödeme kayıt altına alınır.
- **Hedef / Birikim Planı**: Tatil veya satın alım gibi bir plan için hedef tarih ve o tarihe kadar ortalama ayrılacak miktar girilebilir; sistem aylık ayrılması gereken tutarı hesaplar.
- **Tek Seferlik Giderler**: Rutin olmayan, bir kereye mahsus giderler ayrıca girilebilir.
- **Varlık Yönetimi**: Mevcut varlıkların (ev, arsa, araç) eklenmesi ve ilgili vergi/DASK/sigorta/kasko tarihlerinin girilmesi.
- **Finansal Bilgilendirme**: Sistem kullanıcıya bütçe durumu, harcama eğilimi ve hedeflerine ilerleyiş hakkında bilgi verir.
- **Bildirimler**: Kullanıcının hatırlaması gereken ödemeler ve tarihler (kredi kartı son ödeme, vergi, sigorta, kasko, tek seferlik gider vadesi vb.) bildirim olarak iletilir.

## Ek Özellikler (Faz 1.5)
- **What-if Hesaplayıcı**: Kullanıcı "bu ay X TL fazladan harcarsam hedefim ne kadar gecikir?" senaryosunu girdiğinde, mevcut hedef ilerleme hesaplamasına dayanarak yeni tahmini tarih gösterilir. Kayıt oluşturmaz, sadece anlık hesaplama yapar.
- **Nakit Akışı Takvimi**: Ay içindeki tüm kesim günü, son ödeme günü, vergi/DASK/sigorta/kasko tarihlerini tek bir takvim (heatmap) üzerinde gösterir; kullanıcı "bu ay param yeter mi" sorusuna görsel olarak cevap bulur.
- **Varlık Değeri Endeksleme**: Ev/arsa/araç için "tahmini güncel değer" alanı, TÜFE (TCMB EVDS) veya döviz kuruna endeksli olarak periyodik güncelleme önerisi alır; kullanıcı onayı olmadan değer otomatik değişmez.
- **Kademeli Bildirimler**: Tek bir hatırlatma yerine 7 gün önce / 1 gün önce / gün içi gibi kademeli bildirim; kullanıcı bu kademeleri kendi tercihine göre ayarlayabilir.
- **Ana Ekran Widget'ı**: "Bu ay ne kadar param kaldı" bilgisini uygulama açılmadan gösteren mobil widget.
- **Harcama Kategorisi İçgörüsü**: "Bu ay yemeğe çok harcadın" gibi kategori bazlı davranışsal bilgilendirme. Kategori ataması otomatik değil, kullanıcı tarafından manuel yapılır — önceden tanımlı bir kategori listesinden seçilir; listede yoksa "Diğer" ile serbest metin girilir (mail entegrasyonu aktifleşince önerilen kategori kullanıcı onayına sunulur, yine de otomatik atanmaz).
- **Taksitli Alışveriş / Gelecek Kart Ödemeleri**: Kullanıcı taksitli satın aldığı bir eşyayı (toplam tutar, taksit sayısı, başlangıç tarihi) sisteme girer. Sistem her ay kaç taksidin düşeceğini hesaplar ve bunu gelecek aylardaki kart ödeme yükümlülüğüne (ve nakit akışı takvimine) dahil eder. Kullanıcı taksidin kredi kartı mı yoksa nakit/başka bir ödeme planı mı olduğunu belirtir; bu seçim ekstre uzlaştırma mantığını etkiler (kredi kartıysa ilgili kartın dönemine bağlanır, nakitse kart hesaplamasına girmez). Taksitler erken kapatılırsa (kalanı tek seferde ödeme) sistem bunu otomatik algılamaz; kullanıcı ilgili taksit planını manuel olarak "kapatıldı" işaretler, bundan sonra gelecek dönemler için taksit kaydı üretilmez.
- **Plansız Gelir / Harcama Girişi**: Kullanıcı maaş/mesai dışında ek bir gelir (freelance, hediye, iade vb.) veya planlanmamış bir harcama yaptığında bunu anında sisteme girebilir. Bu girişler dashboard'da erken görünür, aylık toplamları güncel tutar.
  - Ödeme yöntemi (nakit / kredi kartı / banka hesabı) seçilir.
  - Kredi kartıyla yapılan plansız harcamalar ilgili kartın o dönemine bağlanır; ekstre geldiğinde çift sayım oluşmaz (bkz. DATABASE.md reconciliation kuralı).
  - Nakit harcamalar hiçbir kart/ekstre hesaplamasını etkilemez, doğrudan aylık gider toplamına eklenir.

## MVP Kapsamı
- E-posta OTP giriş
- Maaş ve mesai
- Rutin giderler (kesim/son ödeme günü ile)
- Tek seferlik giderler
- Kredi kartı takibi (limit, ekstre, ödeme)
- Yatırım takibi (platform, bakiye, para çekme/yatırma)
- Satın alım / tatil hedef planları (tarih + ayrılan tutar)
- Varlıklar (Ev, Arsa, Araç)
- Vergi / Sigorta / Kasko bildirimleri
- Finansal özet ve bildirim sistemi

## UX Prensipleri
- Sayısal tahmini büyüklükler (maaş, mesai, hedef tutar) için sürgülü seçim (slider) + manuel giriş seçeneği.
- Tüm tarih girişleri calendar picker ile yapılır.
- Tekrar eden gün bazlı alanlar (kesim günü, son ödeme günü) için 1-31 arası hızlı seçim bileşeni.
- Aynı bilgi kullanıcıdan iki kez istenmez; sistemde varsa otomatik önerilir.
- Harcama/gider kategorileri serbest metin yerine önceden tanımlı, seçilebilir bir liste (chip/checklist) olarak sunulur; listede olmayan bir kategori için "Diğer" seçilip serbest metin yazılabilir (ayrı bir kategori kaydı açılmaz).

## Görsel Kimlik
- Ana renk paleti: yeşil ve beyaz (finansal/para teması ile örtüşen, sade ve güven veren bir görünüm).

## Varlık Modülü

### Ev / Arsa
- Varlık adı
- Tür
- Satın alma bedeli
- Tahmini güncel değer
- Emlak vergisi dönemleri
- DASK
- Konut sigortası

### Araç
- Araç adı
- Marka / Model
- Tahmini güncel değer
- MTV dönemleri
- Trafik sigortası başlangıç tarihi
- Kasko başlangıç tarihi

İş kuralları:
- MTV varsayılan olarak Ocak ve Temmuz dönemlerinde.
- Trafik sigortası yıllık.
- Kasko yıllık.
- Kullanıcı tarihleri değiştirebilir.

## Gelecek Kapsam (Roadmap'te ayrı fazlar)
- **Aile/Hane Kullanımı**: Birden fazla kullanıcının aynı workspace'i paylaşarak ortak bütçe/varlık takibi yapabilmesi, rol bazlı yetkilendirme (owner/member).
- **Mail Entegrasyonu**: Kullanıcının e-postasına bağlanarak banka ekstresi ve harcama bildirimi e-postalarından otomatik veri çıkarımı yapılması; bu sayede aylık ekstre ve harcama girişlerinin büyük kısmının otomatikleştirilip kullanıcıdan istenen manuel alanların daraltılması. Bu veri aynı zamanda harcama kategorisi içgörülerinin (ör. "bu ay yemeğe çok harcadın") doğruluğunu ve kapsamını artırır.

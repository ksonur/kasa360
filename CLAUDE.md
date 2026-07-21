# Claude Development Rules

## Genel
- TypeScript strict mode.
- React Native + Expo.
- Backend: Railway API (Hono) + PostgreSQL (Supabase yok).
- Feature-based architecture.
- Önce mimari, sonra kod.
- Float kullanma, numeric kullan.
- Kullanıcıdan minimum veri iste.
- Aynı bilgiyi iki kez isteme.
- Geçmiş finansal kayıtları değiştirme (append-only mantık, düzeltme yeni kayıt olarak girilir).
- Her geliştirmede test edilebilir ve modüler kod üret.

## UX / Veri Girişi
- Her sayısal finansal giriş için uygun input tipi seç: maaş/mesai gibi tahmini büyüklükler için slider (sürgülü seçim + üzerine yazılabilir alan), tarihler için calendar picker, tekrar eden ödemeler için gün seçici (1-31).
- Form adımlarını mümkün olduğunca sihirbaz (stepper/wizard) mantığıyla kur, tek ekranda çok alan gösterme.
- Kullanıcı daha önce girdiği bir veriyi (ör. kredi kartı limiti) tekrar sorma; sistemde varsa öner/otomatik doldur.
- Gider/harcama kategorileri serbest metin girişi yerine önceden tanımlı seçilebilir liste (checklist/chip) olarak sunulur; "Diğer" seçilirse serbest metin etiketi girilir, ayrı bir kategori kaydı açılmaz. Sistem asla kategoriyi otomatik/AI ile tahmin edip kullanıcı onayı olmadan atamaz.
- Onboarding adımları arasında geri dönülebilir ve kısmi kaydedilebilir olmalı (kullanıcı yarıda bırakabilir).

## Finansal Bütünlük
- Aylık ekstre, yatırım hareketi, kredi kartı ödemesi gibi işlemler transaction bazlı ve geri alınabilir (soft-delete + audit) olmalı.
- Yatırım para çekme/yatırma işlemleri portföy anlık bakiyesini değil, hareket geçmişini günceller; bakiye hesaplanan (derived) bir değerdir.
- Hedef/birikim planları (tatil, satın alım) ayrı bir varlık olarak modellenir, gerçek bakiyeden bağımsız "sanal ayrım" (mental accounting) olarak tutulur.
- Bütçe/dashboard hesaplamaları her zaman `transactions` tablosundan beslenir; kredi kartı ekstre tutarı yalnızca uzlaştırma/doğrulama amaçlıdır, asla ayrıca toplanmaz (çift sayım yasak).
- Her harcama/gelir kaydında ödeme yöntemi (nakit / kredi kartı / banka hesabı) net olmalı; nakit hareketler kart/ekstre hesaplamalarını hiçbir şekilde etkilemez.

## Bildirimler
- Ödeme/yenileme tarihi yaklaşan her kayıt (kredi kartı son ödeme, vergi, DASK, sigorta, kasko, tek seferlik gider) otomatik bildirim üretir.
- Bildirim üretim mantığı ayrı bir servis/edge function olarak izole edilir, UI'dan bağımsız çalışabilmeli.

## Gelecek Kapsam (henüz aktif değil, mimaride yer ayır)
- Aile/hane bazlı çoklu kullanıcı (workspace paylaşımı, roller: owner/member).
- Mail entegrasyonu ile banka ekstresi ve harcama bildirimi e-postalarından otomatik veri çıkarımı (parsing/NLP), bu alan aktive olduğunda kullanıcıdan istenen manuel giriş alanları daraltılacak şekilde tasarlanmalı.

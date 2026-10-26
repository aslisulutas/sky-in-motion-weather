# Eğlenceli 3D Animasyonlu Hava Durumu Uygulaması

## Veri kaynağı
Open-Meteo: ücretsiz, kayıt ve anahtar gerekmiyor. Anlık hava, saatlik ve 7 günlük tahmin, şehir arama.

## Görünüm (3D oyuncak / animasyon filmi tarzı)
- Ekranın tamamını kaplayan, hava durumuna göre değişen hareketli 3D sahne:
  - Güneşli: dönen, parlayan tombul bir güneş, yavaşça süzülen yumuşak bulutlar
  - Bulutlu: katman katman kabarık, sallanan 3D bulutlar
  - Yağmurlu: koyu bulutlar ve yağan damlalar
  - Karlı: dönerek düşen kar taneleri
  - Fırtına: şimşek çakmaları
  - Sisli: yerden kayan sis
  - Gece: ay, parıldayan yıldızlar, koyu lacivert gökyüzü
- Gökyüzü rengi saate ve havaya göre değişir (sabah, gündüz, gün batımı, gece)
- Yuvarlak hatlı, şeker renkli, oyuncak gibi kartlar; neşeli, kalın yazı tipi (örneğin Fredoka)
- Fare hareketine göre sahnede hafif derinlik etkisi

## Ekrandakiler
- Şehir arama kutusu ve "Konumumu kullan" butonu
- Büyük sıcaklık, şehir adı, hava açıklaması (Türkçe)
- Hissedilen sıcaklık, nem, rüzgar, yağış ihtimali küçük kartları
- Kaydırılabilir 24 saatlik tahmin şeridi (küçük animasyonlu ikonlarla)
- 7 günlük tahmin listesi
- Açılışta varsayılan şehir: İstanbul

## Teknik detaylar
- 3D sahne: react-three-fiber + drei (yalnızca tarayıcıda yüklenir); bulutlar yumuşak küre gruplarından, yağmur/kar parçacıklarla
- Veri: route loader + TanStack Query ile Open-Meteo forecast ve geocoding çağrıları
- WMO hava kodlarından sahne türü ve Türkçe açıklama eşlemesi (tek modülde)
- Renkler ve gökyüzü gradyanları styles.css içinde tasarım tokenları olarak
- Sayfa başlığı ve açıklama meta bilgileri

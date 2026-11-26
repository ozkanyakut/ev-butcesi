# Otomatik GitHub Senkronizasyonu (Auto-Push Rule)

Bu projede (`ev-butcesi` - `https://github.com/ozkanyakut/ev-butcesi.git`) yapılan tüm kod ve yapılandırma değişiklikleri sonrasında:

1. Kullanıcı ayrıca söylemese bile her görev sonunda yapılan değişiklikleri anlamlı bir commit mesajıyla kaydet (`git add -A && git commit -m "..."`).
2. Değişiklikleri doğrudan GitHub'a gönder (`git push origin main`).
3. Görev bitiminde `git status` ile çalışma dizininin temiz ve `origin/main` ile güncel olduğunu doğrula.

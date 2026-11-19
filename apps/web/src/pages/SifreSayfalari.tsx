/**
 * Şifremi unuttum (bağlantı iste) ve yeni şifre belirleme. E-postadaki bağlantı /sifre-yenile adresine gelir;
 * Supabase bağlantıdaki kodla geçici bir oturum açar, kullanıcı burada yeni şifresini belirler.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { Alan } from '../components/Alan';
import { HataKutusu } from '../components/HataKutusu';
import { Yukleniyor } from '../components/Yukleniyor';
import {
  sifremiUnuttumSemasi,
  yeniSifreSemasi,
  type SifremiUnuttumFormu,
  type YeniSifreFormu,
} from '../lib/formlar';
import { turkceHata } from '../lib/hatalar';
import { sifreSifirlamaIste, yeniSifreBelirle } from '../lib/sifre';
import { supabaseAyarHatasi } from '../lib/supabase';

export function SifremiUnuttumSayfasi() {
  const [gonderildi, setGonderildi] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SifremiUnuttumFormu>({ resolver: zodResolver(sifremiUnuttumSemasi) });

  const gonder = handleSubmit(async ({ eposta }) => {
    setHata(null);
    try {
      await sifreSifirlamaIste(eposta, `${window.location.origin}/sifre-yenile`);
      setGonderildi(eposta);
    } catch (e) {
      setHata(turkceHata(e));
    }
  });

  return (
    <section className="kart dar" aria-labelledby="unuttum-baslik">
      <h1 id="unuttum-baslik">Şifremi unuttum</h1>
      {gonderildi ? (
        <p role="status">
          Bu adresle kayıtlı bir hesap varsa <strong>{gonderildi}</strong> adresine şifre sıfırlama bağlantısı
          gönderdik. Bağlantı 1 saat geçerlidir; gelen kutunu ve istenmeyen klasörünü kontrol et.
        </p>
      ) : (
        <form onSubmit={gonder} noValidate>
          <HataKutusu mesaj={supabaseAyarHatasi ?? hata} />
          <Alan
            etiket="E-posta"
            type="email"
            autoComplete="email"
            inputMode="email"
            hata={errors.eposta?.message}
            {...register('eposta')}
          />
          <button type="submit" className="birincil genis" disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder'}
          </button>
        </form>
      )}
      <p className="form-alti">
        <Link to="/giris">Giriş ekranına dön</Link>
      </p>
    </section>
  );
}

export function YeniSifreSayfasi() {
  const { yukleniyor, oturum } = useAuth();
  const navigate = useNavigate();
  const [hata, setHata] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<YeniSifreFormu>({ resolver: zodResolver(yeniSifreSemasi) });

  const gonder = handleSubmit(async ({ sifre }) => {
    setHata(null);
    try {
      await yeniSifreBelirle(sifre);
      navigate('/', { replace: true, state: { mesaj: 'Şifren değiştirildi.' } });
    } catch (e) {
      setHata(turkceHata(e));
    }
  });

  if (yukleniyor) return <Yukleniyor />;
  if (!oturum)
    return (
      <section className="kart dar" aria-labelledby="yeni-sifre-baslik">
        <h1 id="yeni-sifre-baslik">Yeni şifre</h1>
        <div className="uyari" role="alert">
          Sıfırlama bağlantısı geçersiz ya da süresi dolmuş. Yeni bir bağlantı iste.
        </div>
        <p className="form-alti">
          <Link to="/sifremi-unuttum">Yeni bağlantı iste</Link>
        </p>
      </section>
    );

  return (
    <section className="kart dar" aria-labelledby="yeni-sifre-baslik">
      <h1 id="yeni-sifre-baslik">Yeni şifre</h1>
      <HataKutusu mesaj={hata} />
      <form onSubmit={gonder} noValidate>
        <Alan
          etiket="Yeni şifre"
          type="password"
          autoComplete="new-password"
          aciklama="En az 8 karakter; harf ve rakam içermeli."
          hata={errors.sifre?.message}
          {...register('sifre')}
        />
        <Alan
          etiket="Yeni şifre (tekrar)"
          type="password"
          autoComplete="new-password"
          hata={errors.sifreTekrar?.message}
          {...register('sifreTekrar')}
        />
        <button type="submit" className="birincil genis" disabled={isSubmitting}>
          {isSubmitting ? 'Kaydediliyor…' : 'Şifreyi değiştir'}
        </button>
      </form>
    </section>
  );
}

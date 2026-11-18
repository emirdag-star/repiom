import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { Alan } from '../components/Alan';
import { HataKutusu } from '../components/HataKutusu';
import { kayitSemasi, type KayitFormu } from '../lib/formlar';
import { turkceHata } from '../lib/hatalar';
import { supabase, supabaseAyarHatasi } from '../lib/supabase';

export function KayitSayfasi() {
  const { oturum } = useAuth();
  const navigate = useNavigate();
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const [dogrulamaBekleniyor, setDogrulamaBekleniyor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<KayitFormu>({ resolver: zodResolver(kayitSemasi) });

  if (oturum) return <Navigate to="/" replace />;

  const gonder = handleSubmit(async ({ eposta, sifre }) => {
    setSunucuHatasi(null);
    if (!supabase) return setSunucuHatasi(supabaseAyarHatasi);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: eposta,
        password: sifre,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return setSunucuHatasi(turkceHata(error));
      // E-posta doğrulaması açıksa oturum hemen açılmaz.
      if (!data.session) return setDogrulamaBekleniyor(eposta);
      navigate('/', { replace: true });
    } catch (e) {
      setSunucuHatasi(turkceHata(e));
    }
  });

  if (dogrulamaBekleniyor) {
    return (
      <section className="kart dar" aria-labelledby="kayit-baslik">
        <h1 id="kayit-baslik">E-postanı kontrol et</h1>
        <p role="status">
          <strong>{dogrulamaBekleniyor}</strong> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya
          tıkladıktan sonra giriş yapabilirsin.
        </p>
        <p className="form-alti">
          <Link to="/giris">Giriş ekranına dön</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="kart dar" aria-labelledby="kayit-baslik">
      <h1 id="kayit-baslik">Kayıt ol</h1>
      <HataKutusu mesaj={supabaseAyarHatasi ?? sunucuHatasi} />
      <form onSubmit={gonder} noValidate>
        <Alan
          etiket="E-posta"
          type="email"
          autoComplete="email"
          inputMode="email"
          hata={errors.eposta?.message}
          {...register('eposta')}
        />
        <Alan
          etiket="Şifre"
          type="password"
          autoComplete="new-password"
          aciklama="En az 8 karakter; harf ve rakam içermeli."
          hata={errors.sifre?.message}
          {...register('sifre')}
        />
        <Alan
          etiket="Şifre (tekrar)"
          type="password"
          autoComplete="new-password"
          hata={errors.sifreTekrar?.message}
          {...register('sifreTekrar')}
        />
        <button type="submit" className="birincil genis" disabled={isSubmitting}>
          {isSubmitting ? 'Kayıt yapılıyor…' : 'Kayıt ol'}
        </button>
      </form>
      <p className="form-alti">
        Zaten hesabın var mı? <Link to="/giris">Giriş yap</Link>
      </p>
    </section>
  );
}

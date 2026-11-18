import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { Alan } from '../components/Alan';
import { HataKutusu } from '../components/HataKutusu';
import { girisSemasi, type GirisFormu } from '../lib/formlar';
import { turkceHata } from '../lib/hatalar';
import { supabase, supabaseAyarHatasi } from '../lib/supabase';

export function GirisSayfasi() {
  const { oturum } = useAuth();
  const navigate = useNavigate();
  const konum = useLocation();
  const donus = (konum.state as { donus?: string } | null)?.donus ?? '/';
  const [sunucuHatasi, setSunucuHatasi] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GirisFormu>({ resolver: zodResolver(girisSemasi) });

  if (oturum) return <Navigate to={donus} replace />;

  const gonder = handleSubmit(async ({ eposta, sifre }) => {
    setSunucuHatasi(null);
    if (!supabase) return setSunucuHatasi(supabaseAyarHatasi);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: eposta, password: sifre });
      if (error) return setSunucuHatasi(turkceHata(error));
      navigate(donus, { replace: true });
    } catch (e) {
      setSunucuHatasi(turkceHata(e));
    }
  });

  return (
    <section className="kart dar" aria-labelledby="giris-baslik">
      <h1 id="giris-baslik">Giriş yap</h1>
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
          autoComplete="current-password"
          hata={errors.sifre?.message}
          {...register('sifre')}
        />
        <button type="submit" className="birincil genis" disabled={isSubmitting}>
          {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
      <p className="form-alti">
        Hesabın yok mu? <Link to="/kayit">Kayıt ol</Link>
      </p>
    </section>
  );
}

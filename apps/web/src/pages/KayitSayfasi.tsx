import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { Alan } from '../components/Alan';
import { BelgeBaglantisi } from '../components/Belge';
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
  } = useForm<KayitFormu>({
    resolver: zodResolver(kayitSemasi),
    // İsteğe bağlı izinler önceden işaretli olmaz.
    defaultValues: { sozlesme: false, kvkk: false, riza: false, ileti: false },
  });

  if (oturum) return <Navigate to="/" replace />;

  const gonder = handleSubmit(async ({ eposta, sifre, sozlesme, kvkk, riza, ileti }) => {
    setSunucuHatasi(null);
    if (!supabase) return setSunucuHatasi(supabaseAyarHatasi);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: eposta,
        password: sifre,
        options: {
          emailRedirectTo: window.location.origin,
          // Onaylar sunucuda (kayıt tetikleyicisi) belgelerin güncel sürümüyle kaydedilir; zorunlular yoksa kayıt reddedilir.
          data: {
            onaylar: [
              sozlesme && 'kullanici_sozlesmesi',
              kvkk && 'kvkk_aydinlatma',
              riza && 'acik_riza_yurtdisi',
              ileti && 'ticari_ileti',
            ].filter(Boolean),
            tarayici: navigator.userAgent.slice(0, 200),
          },
        },
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
        <fieldset className="onaylar-kutusu">
          <legend>Sözleşme ve izinler</legend>
          <OnaySatiri hata={errors.sozlesme?.message} {...register('sozlesme')}>
            <BelgeBaglantisi id="kullanici_sozlesmesi" />
            'ni okudum ve kabul ediyorum. <span className="zorunlu">(zorunlu)</span>
          </OnaySatiri>
          <OnaySatiri hata={errors.kvkk?.message} {...register('kvkk')}>
            Kişisel verilerimin işlenmesine ilişkin <BelgeBaglantisi id="kvkk_aydinlatma" />
            'ni okudum. <span className="zorunlu">(zorunlu)</span>
          </OnaySatiri>
          <OnaySatiri {...register('riza')}>
            İsteğe bağlı: çizim analizinde plan görsellerimin yapay zekâ kontrolü için yurt dışına
            aktarılmasına <BelgeBaglantisi id="acik_riza_yurtdisi">açık rıza</BelgeBaglantisi> veriyorum.
          </OnaySatiri>
          <OnaySatiri {...register('ileti')}>
            İsteğe bağlı: kampanya ve yenilikler için{' '}
            <BelgeBaglantisi id="ticari_ileti">ticari elektronik ileti</BelgeBaglantisi> almak istiyorum.
          </OnaySatiri>
        </fieldset>
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

/** Onay kutusu satırı: etiket içinde belge bağlantısı olabilir; hata ekran okuyucuya bağlanır. */
function OnaySatiri({
  hata,
  children,
  ...girdi
}: InputHTMLAttributes<HTMLInputElement> & {
  hata?: string;
  children: ReactNode;
  ref?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  return (
    <div className="onay-satiri">
      <input
        id={id}
        type="checkbox"
        aria-invalid={hata ? true : undefined}
        aria-describedby={hata ? `${id}-h` : undefined}
        {...girdi}
      />
      <label htmlFor={id}>{children}</label>
      {hata && (
        <p id={`${id}-h`} className="alan-hata">
          {hata}
        </p>
      )}
    </div>
  );
}

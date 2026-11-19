import { z } from 'zod';

export const epostaAlani = z
  .string()
  .trim()
  .min(1, 'E-posta adresini yaz.')
  .pipe(z.email('Geçerli bir e-posta adresi yaz (ör. ad@ornek.com).'));

export const girisSemasi = z.object({
  eposta: epostaAlani,
  sifre: z.string().min(1, 'Şifreni yaz.'),
});
export type GirisFormu = z.infer<typeof girisSemasi>;

export const kayitSemasi = z
  .object({
    eposta: epostaAlani,
    sifre: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalı.')
      .regex(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/, 'Şifrede en az bir harf olmalı.')
      .regex(/\d/, 'Şifrede en az bir rakam olmalı.'),
    sifreTekrar: z.string().min(1, 'Şifreni tekrar yaz.'),
    sozlesme: z.boolean().refine((x) => x, "Kayıt için Kullanıcı Sözleşmesi'ni kabul etmelisin."),
    kvkk: z.boolean().refine((x) => x, "Kayıt için KVKK Aydınlatma Metni'ni okuduğunu onaylamalısın."),
    riza: z.boolean(),
    ileti: z.boolean(),
  })
  .refine((d) => d.sifre === d.sifreTekrar, { path: ['sifreTekrar'], message: 'Şifreler aynı değil.' });
export type KayitFormu = z.infer<typeof kayitSemasi>;

// Expo, pnpm çalışma alanını kendiliğinden tanır. Ek kural: ortak paketler (packages/*) React, sorgu önbelleği ve
// Supabase'i uygulamanın kopyasından kullanmalı (iki ayrı React kopyası hook'ları bozar).
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const TEKIL = ['react', 'react-dom', 'react-native', '@tanstack/react-query', '@supabase/supabase-js'];
const uygulama = path.join(__dirname, 'package.json');
const onceki = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, ad, platform) => {
  const c = TEKIL.some((t) => ad === t || ad.startsWith(t + '/'))
    ? { ...ctx, originModulePath: uygulama }
    : ctx;
  return onceki ? onceki(c, ad, platform) : c.resolveRequest(c, ad, platform);
};
module.exports = config;

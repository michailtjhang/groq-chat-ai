import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Hapus properti 'eslint' yang menyebabkan error
  
  // Script dev/build Anda masih menggunakan --turbopack, jadi ini aman
  // Ini adalah konfigurasi Next.js yang standar:
  // experimental: {
  //   turbo: {
  //     // Konfigurasi Turbopack jika ada
  //   }
  // }
};

export default nextConfig;
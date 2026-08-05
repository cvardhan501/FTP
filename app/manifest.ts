import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AirDropX Offline P2P Transfer',
    short_name: 'AirDropX',
    description: 'Ultra-fast offline peer-to-peer file transfer engine built with WebRTC and Socket.IO',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}

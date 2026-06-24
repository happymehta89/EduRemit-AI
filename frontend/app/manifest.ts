import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EduRemit AI',
    short_name: 'EduRemit',
    description: 'Secure Education Funding on Stellar',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F3F0',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

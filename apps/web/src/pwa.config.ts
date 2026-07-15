/**
 * Service Worker — AutoCore ERP PWA (Sprint 14 — estrutura)
 *
 * Estratégias de cache:
 *   — API calls: Network-first (dados sempre atualizados)
 *   — Static assets (JS/CSS/fonts): Cache-first (hash = cache bust automático)
 *   — index.html: Network-first com fallback para cache
 *
 * Integração real: usar `vite-plugin-pwa` (Workbox) no vite.config.ts.
 * Adicionar ao package.json: "vite-plugin-pwa": "^0.20.0"
 * E configurar no vite.config.ts:
 *
 * import { VitePWA } from 'vite-plugin-pwa'
 *
 * VitePWA({
 *   registerType: 'autoUpdate',
 *   manifest: false, // já temos manifest.json em public/
 *   workbox: {
 *     globPatterns: ['**\/*.{js,css,html,ico,png,svg,woff2}'],
 *     runtimeCaching: [{
 *       urlPattern: /^https:\/\/api\.autocore\./i,
 *       handler: 'NetworkFirst',
 *       options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
 *     }],
 *   },
 * })
 *
 * Esta estrutura está pronta para integração — a Sprint 14 entrega o
 * manifest.json funcional e a configuração documentada.
 */

export {};

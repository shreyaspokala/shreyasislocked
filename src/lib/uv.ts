import { basePath } from './paths';

declare global {
  interface Window {
    __uv$config?: {
      prefix: string;
      bare?: string;
      handler?: string;
      client?: string;
      bundle?: string;
      config?: string;
      sw?: string;
      encodeUrl: (s: string) => string;
    };
    BareMux?: { BareMuxConnection: new (workerPath: string) => {
      setTransport(path: string, args: unknown[]): Promise<void>;
      getTransport(): Promise<[string, unknown[]] | null>;
    }};
  }
}

let ready: Promise<void> | null = null;

export function registerUV(): Promise<void> {
  if (ready) return ready;
  if (!('serviceWorker' in navigator)) return Promise.reject(new Error('no service worker'));
  ready = (async () => {
    await loadScript(basePath('baremux/bare.cjs'));
    await loadScript(basePath('uv/uv.bundle.js'));
    await loadScript(basePath('uv/uv.config.js'));
    if (window.__uv$config) {
      window.__uv$config.prefix = basePath('uv/service/');
      window.__uv$config.bare = basePath('bare/');
      window.__uv$config.handler = basePath('uv/uv.handler.js');
      window.__uv$config.client = basePath('uv/uv.client.js');
      window.__uv$config.bundle = basePath('uv/uv.bundle.js');
      window.__uv$config.config = basePath('uv/uv.config.js');
      window.__uv$config.sw = basePath('uv/uv.sw.js');
    }

    const conn = new window.BareMux!.BareMuxConnection(basePath('baremux/worker.js'));
    const current = await conn.getTransport().catch(() => null);
    const transportPath = basePath('baretransport/index.mjs');
    if (!current || current[0] !== transportPath) {
      await conn.setTransport(transportPath, [{ bare: basePath('bare/') }]);
    }

    await navigator.serviceWorker.register(basePath('uv/sw.js'), { scope: basePath('uv/service/') });
    await navigator.serviceWorker.ready;
  })();
  return ready;
}

function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[data-ext="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src;
    s.dataset.ext = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error('load ' + src));
    document.head.appendChild(s);
  });
}

export function uvEncode(url: string): string {
  const cfg = window.__uv$config;
  if (!cfg) throw new Error('UV config not loaded');
  return cfg.prefix + cfg.encodeUrl(url);
}

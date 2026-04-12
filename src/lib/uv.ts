declare global {
  interface Window {
    __uv$config?: { prefix: string; encodeUrl: (s: string) => string };
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
    await loadScript('/baremux/bare.cjs');
    await loadScript('/uv/uv.bundle.js');
    await loadScript('/uv/uv.config.js');

    const conn = new window.BareMux!.BareMuxConnection('/baremux/worker.js');
    const current = await conn.getTransport().catch(() => null);
    if (!current || current[0] !== '/baretransport/index.mjs') {
      await conn.setTransport('/baretransport/index.mjs', [{ bare: '/bare/' }]);
    }

    await navigator.serviceWorker.register('/uv/sw.js', { scope: '/uv/service/' });
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

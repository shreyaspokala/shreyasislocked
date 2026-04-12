const STORE = 'searchHistory.v1';
const SALT_KEY = 'searchHistory.salt';
const VERIFIER_KEY = 'searchHistory.verifier';
const PBKDF2_ITERS = 250_000;

export interface HistoryEntry {
  url: string;
  title?: string;
  at: number;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64e(buf: ArrayBuffer | Uint8Array): string {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s);
}
function b64d(s: string): Uint8Array {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function getSalt(): Uint8Array {
  let s = localStorage.getItem(SALT_KEY);
  if (!s) {
    const n = crypto.getRandomValues(new Uint8Array(16));
    s = b64e(n);
    localStorage.setItem(SALT_KEY, s);
  }
  return b64d(s);
}

export function isPasswordSet(): boolean {
  return !!localStorage.getItem(VERIFIER_KEY);
}

export async function setPassword(password: string): Promise<void> {
  const salt = getSalt();
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const token = enc.encode('ok:' + Date.now());
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, token);
  localStorage.setItem(VERIFIER_KEY, JSON.stringify({ iv: b64e(iv), ct: b64e(ct) }));
}

export async function unlock(password: string): Promise<CryptoKey | null> {
  const raw = localStorage.getItem(VERIFIER_KEY);
  if (!raw) return null;
  const { iv, ct } = JSON.parse(raw) as { iv: string; ct: string };
  const salt = getSalt();
  const key = await deriveKey(password, salt);
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(iv) }, key, b64d(ct));
    if (!dec.decode(pt).startsWith('ok:')) return null;
    return key;
  } catch {
    return null;
  }
}

async function encryptEntry(key: CryptoKey, e: HistoryEntry): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(e)));
  return JSON.stringify({ iv: b64e(iv), ct: b64e(ct) });
}
async function decryptEntry(key: CryptoKey, blob: string): Promise<HistoryEntry | null> {
  try {
    const { iv, ct } = JSON.parse(blob) as { iv: string; ct: string };
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(iv) }, key, b64d(ct));
    return JSON.parse(dec.decode(pt)) as HistoryEntry;
  } catch {
    return null;
  }
}

export function getCiphertext(): string[] {
  const raw = localStorage.getItem(STORE);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function pushHistory(key: CryptoKey, entry: HistoryEntry, max = 500): Promise<void> {
  const arr = getCiphertext();
  arr.unshift(await encryptEntry(key, entry));
  if (arr.length > max) arr.length = max;
  localStorage.setItem(STORE, JSON.stringify(arr));
}

export async function readHistory(key: CryptoKey): Promise<HistoryEntry[]> {
  const blobs = getCiphertext();
  const out: HistoryEntry[] = [];
  for (const b of blobs) {
    const e = await decryptEntry(key, b);
    if (e) out.push(e);
  }
  return out;
}

export function clearHistory(): void {
  localStorage.removeItem(STORE);
}

export function resetAll(): void {
  localStorage.removeItem(STORE);
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

const SESSION_PW = 'searchHistory.sessionPw';
export function stashSessionPassword(pw: string): void { sessionStorage.setItem(SESSION_PW, pw); }
export function clearSessionPassword(): void { sessionStorage.removeItem(SESSION_PW); }
export async function getSessionKey(): Promise<CryptoKey | null> {
  const pw = sessionStorage.getItem(SESSION_PW);
  if (!pw) return null;
  return unlock(pw);
}
export async function logVisit(url: string, title?: string): Promise<void> {
  if (!isPasswordSet()) return;
  const key = await getSessionKey();
  if (!key) return;
  await pushHistory(key, { url, title, at: Date.now() });
}

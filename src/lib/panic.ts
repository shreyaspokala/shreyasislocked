export function wirePanic(): void {
  const url = () => localStorage.getItem('panicUrl') || 'https://www.google.com';
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || (e.key === 'Escape' && e.shiftKey)) {
      window.location.href = url();
    }
  });
}

export function openInBlank(): void {
  const w = window.open('about:blank', '_blank');
  if (!w) { alert('Pop-ups are blocked. Please allow pop-ups.'); return; }
  const iframe = w.document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:100%;border:none;position:fixed;top:0;left:0;';
  iframe.src = window.location.href;
  w.document.body.style.margin = '0';
  w.document.body.appendChild(iframe);
  window.close();
  setTimeout(() => { window.location.href = localStorage.getItem('panicUrl') || 'https://www.google.com'; }, 100);
}

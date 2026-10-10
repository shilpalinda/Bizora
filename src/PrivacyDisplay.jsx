import { useEffect, useState, useSyncExternalStore } from 'react';
import { Eye, EyeOff, Lock, Settings, X } from 'lucide-react';

const listeners = new Set();
let sharedKey;
let hidden = true;
let activationRevision = 0;
try {
  let session = document.cookie.split('; ').find((item) => item.startsWith('bizoraPrivacySession='))?.split('=')[1];
  if (!session) {
    session = crypto.randomUUID();
    document.cookie = `bizoraPrivacySession=${session}; Path=/; SameSite=Strict`;
  }
  sharedKey = `bizora-privacy-${session}`;
  hidden = localStorage.getItem(sharedKey) === 'active' || sessionStorage.getItem('bizora-privacy-active') === 'active';
} catch {
  hidden = true;
}

const paint = () => {
  document.documentElement.dataset.privacy = hidden ? 'active' : 'normal';
  if (hidden && document.activeElement instanceof HTMLElement) document.activeElement.blur();
};
paint();

const publish = (active) => {
  if (active) activationRevision += 1;
  hidden = active;
  paint();
  try {
    sessionStorage.setItem('bizora-privacy-active', active ? 'active' : 'normal');
    if (sharedKey) localStorage.setItem(sharedKey, active ? 'active' : 'normal');
  } catch {
    hidden = true;
    paint();
  }
  listeners.forEach((listener) => listener());
};
window.addEventListener('storage', (event) => {
  if (event.key === sharedKey && event.newValue === 'active') publish(true);
});

export const isPrivacyActive = () => hidden;
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => hidden;
export const usePrivacyDisplay = () => useSyncExternalStore(subscribe, snapshot, () => true);
const nativePrint = window.__bizoraNativePrint || window.print.bind(window);
window.__bizoraNativePrint = nativePrint;
window.print = () => { if (!isPrivacyActive()) nativePrint(); };

const verify = async (action, body) => {
  const response = await fetch(`${location.protocol}//${location.hostname}:4000/api/privacy/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Verification failed.');
};

export function PrivacyControls({ email, showActivation = false }) {
  const active = usePrivacyDisplay();
  const [dialog, setDialog] = useState(null);
  const [password, setPassword] = useState('');
  const [identity, setIdentity] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shortcut, setShortcut] = useState(() => {
    try { return localStorage.getItem('bizora-privacy-shortcut') || 'Ctrl+Shift+H'; } catch { return 'Ctrl+Shift+H'; }
  });
  const currentEmail = email || sessionStorage.getItem('bizora-privacy-user') || '';
  useEffect(() => {
    if (email) sessionStorage.setItem('bizora-privacy-user', email);
  }, [email]);
  useEffect(() => {
    const handler = (event) => {
      if (hidden && (event.ctrlKey || event.metaKey) && ['p', 's'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        return;
      }
      const alternate = event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === shortcut.slice(-1).toLowerCase();
      const ctrlT = event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 't';
      if (alternate || ctrlT) { event.preventDefault(); publish(true); }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [shortcut]);
  const open = (kind) => { setDialog(kind); setPassword(''); setError(''); setIdentity(''); };
  const submit = async (event) => {
    event.preventDefault();
    const revision = activationRevision;
    setBusy(true);
    setError('');
    try {
      if (dialog === 'activate') {
        await verify('activate', { password });
        publish(true);
      } else {
        await verify('reveal', { email: currentEmail || identity, password });
        if (revision !== activationRevision) throw new Error('Data was hidden again. Re-authenticate to reveal it.');
        publish(false);
      }
      setDialog(null);
    } catch (failure) {
      setError(failure instanceof TypeError ? 'Verification server unavailable. Data remains hidden if privacy mode is active.' : failure.message);
    } finally {
      setPassword('');
      setBusy(false);
    }
  };
  if (!showActivation && !active && !dialog) return null;
  return <div className="privacy-controls">
    {showActivation && <>
      <button type="button" className="secondary-button small rx-with-icon" onClick={() => publish(true)}><EyeOff size={15} />Hide Data</button>
      <button type="button" className="secondary-button small" onClick={() => open('activate')}>Privacy Mode</button>
    </>}
    {active && <button type="button" className="primary-button small rx-with-icon" onClick={() => open('reveal')}><Eye size={15} />Reveal Data</button>}
    {showActivation && <button type="button" className="rx-icon-button" title="Privacy shortcut settings" aria-label="Privacy shortcut settings" onClick={() => open('shortcut')}><Settings size={15} /></button>}
    {dialog && <div className="rx-modal-backdrop privacy-dialog" role="presentation">
      {dialog === 'shortcut' ? <section className="rx-modal panel privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <div className="rx-modal-head"><h2 id="privacy-title">Privacy shortcut</h2><button type="button" className="rx-icon-button" onClick={() => setDialog(null)} aria-label="Close privacy dialog"><X size={16} /></button></div>
        <label className="privacy-field">Browser shortcut<select value={shortcut} onChange={(event) => { const next = event.target.value; setShortcut(next); localStorage.setItem('bizora-privacy-shortcut', next); }}><option>Ctrl+Shift+H</option><option>Ctrl+Shift+Y</option><option>Ctrl+Shift+U</option></select></label>
        <p>Ctrl+T is reserved by browsers. Use Hide Data or this alternative shortcut. Shortcuts only hide data.</p>
      </section> : <form className="rx-modal panel privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-title" onSubmit={submit}>
        <div className="rx-modal-head"><h2 id="privacy-title">{dialog === 'activate' ? 'Privacy Mode' : 'Reveal Data'}</h2><button type="button" className="rx-icon-button" disabled={busy} onClick={() => { setDialog(null); setPassword(''); }} aria-label="Close privacy dialog"><X size={16} /></button></div>
        <p>{dialog === 'activate' ? 'Enter the privacy activation password.' : 'Re-enter your normal login password to reveal data.'}</p>
        {dialog === 'reveal' && !currentEmail && <label className="privacy-field">Login email<input type="email" required value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="username" /></label>}
        <label className="privacy-field">Password<input type="password" autoFocus required maxLength={256} autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="rx-modal-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => { setDialog(null); setPassword(''); }}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Verifying...' : dialog === 'activate' ? 'Activate Privacy' : 'Reveal Data'}</button></div>
      </form>}
    </div>}
  </div>;
}

export function PrivacyPlaceholder({ page }) {
  return <section className="privacy-placeholder">
    <div className="privacy-banner" role="status"><Lock size={18} /><strong>Privacy mode active — values hidden</strong></div>
    <h2>{page}</h2>
    <div className="privacy-totals">{[['Amount', '₹0'], ['Balance', '₹0'], ['Total', '₹0'], ['Records', '0'], ['Attendance', '0'], ['Percentage', '0%']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="privacy-neutral"><EyeOff size={24} /><strong>Hidden</strong><p>Records, forms, calendars and previews are concealed. Editing, printing and exports are unavailable.</p></div>
  </section>;
}
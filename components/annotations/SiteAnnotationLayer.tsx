'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { reviewCopy } from './copy';
import { anchorFor, currentPage, positionOf, type Anchor } from './anchors';

/**
 * Internal annotation layer (PRD §14) — loaded only in review mode by ReviewLoader.
 * Team members sign in with an email code; every read/write goes through /api/annotations, where
 * Supabase (JWT + RLS) decides. Nothing here grants access: it only displays what the API returns.
 */
interface Note {
  id: string;
  page_path: string;
  section_id: string | null;
  element_selector: string | null;
  anchor_data: { x?: number; y?: number };
  comment: string;
  status: 'open' | 'resolved' | 'archived';
  author_email: string | null;
  created_at: string;
  updated_at: string;
}
type Me = { email: string; role: 'editor' | 'admin' };
type Auth = 'loading' | 'signed_out' | 'not_configured' | Me;

const json = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export default function SiteAnnotationLayer({ onExit }: { onExit: () => void }) {
  const page = useMemo(() => currentPage(), []);
  const locale = page?.locale ?? 'it';
  const t = reviewCopy[locale];
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }), [locale]);

  const [auth, setAuth] = useState<Auth>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [panelOpen, setPanelOpen] = useState(true);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<{ anchor: Anchor; left: number; top: number } | null>(null);
  const [draftText, setDraftText] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [positions, setPositions] = useState<Record<string, { left: number; top: number }>>({});
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);

  const me = typeof auth === 'object' ? auth : null;

  /** Common handling of API answers: session expiry, permission and configuration problems. */
  const check = useCallback(
    (res: Response) => {
      if (res.status === 401) {
        setAuth('signed_out');
        setNotes([]);
        setMessage(t.sessionExpired);
      } else if (res.status === 403) setMessage(t.forbidden);
      else if (res.status === 503) setAuth('not_configured');
      else if (!res.ok) setMessage(t.error);
      return res.ok;
    },
    [t],
  );

  const loadNotes = useCallback(async () => {
    if (!page) return;
    const res = await fetch(`/api/annotations?page=${encodeURIComponent(page.path)}`, { cache: 'no-store' });
    if (!check(res)) return;
    const data = (await res.json()) as { items: Note[] };
    setNotes(data.items ?? []);
  }, [page, check]);

  // Who am I?
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/review/session', { cache: 'no-store' });
        if (res.status === 503) return setAuth('not_configured');
        if (res.status === 403) {
          setMessage(t.notTeam);
          return setAuth('signed_out');
        }
        if (!res.ok) return setAuth('signed_out');
        setAuth((await res.json()) as Me);
      } catch {
        setAuth('signed_out');
      }
    })();
  }, [t]);

  useEffect(() => {
    if (me) void loadNotes();
  }, [me, loadNotes]);

  // Pin positions follow the content (resize, fonts, lazy content…)
  const visible = useMemo(() => notes.filter((n) => filter === 'all' || n.status === 'open'), [notes, filter]);
  const number = useMemo(() => new Map(notes.map((n, i) => [n.id, i + 1])), [notes]);
  useEffect(() => {
    if (!me) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next: Record<string, { left: number; top: number }> = {};
        for (const n of visible) {
          const p = positionOf(n);
          if (p) next[n.id] = p;
        }
        setPositions(next);
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [visible, me]);

  // Escape: cancel picking / drafting / editing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPicking(false);
      setDraft(null);
      setEditing(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function pick(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const el = overlay.current;
    if (!el) return;
    el.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    el.style.pointerEvents = '';
    const anchor = target ? anchorFor(target, e.clientX, e.clientY) : null;
    setPicking(false);
    if (!anchor) return;
    setDraftText('');
    setDraft({ anchor, left: e.clientX + window.scrollX, top: e.clientY + window.scrollY });
  }

  async function saveDraft(e: FormEvent) {
    e.preventDefault();
    if (!draft || !page || !draftText.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/annotations', json({ pagePath: page.path, locale: page.locale, ...draft.anchor, comment: draftText }));
      if (check(res)) {
        const { item } = (await res.json()) as { item: Note };
        setNotes((list) => [...list, item]);
        setDraft(null);
        setSelected(item.id);
        setPanelOpen(true);
      }
    } catch {
      setMessage(t.error);
    }
    setBusy(false);
  }

  async function patch(id: string, body: { comment?: string; status?: Note['status'] }) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/annotations/${id}`, { ...json(body), method: 'PATCH' });
      if (check(res)) {
        const { item } = (await res.json()) as { item: Note };
        setNotes((list) => list.map((n) => (n.id === id ? item : n)));
        setEditing(null);
      }
    } catch {
      setMessage(t.error);
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!window.confirm(t.confirmDelete)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/annotations/${id}`, { method: 'DELETE' });
      if (check(res)) setNotes((list) => list.filter((n) => n.id !== id));
    } catch {
      setMessage(t.error);
    }
    setBusy(false);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!codeSent) {
        const res = await fetch('/api/review/session/start', json({ email }));
        if (res.status === 503) setAuth('not_configured');
        else if (res.ok) setCodeSent(true);
        else setMessage(t.error);
      } else {
        const res = await fetch('/api/review/session/verify', json({ email, code }));
        if (res.ok) {
          setAuth((await res.json()) as Me);
          setCode('');
          setCodeSent(false);
        } else setMessage(res.status === 403 ? t.notTeam : res.status === 401 || res.status === 422 ? t.invalidCode : t.error);
      }
    } catch {
      setMessage(t.error);
    }
    setBusy(false);
  }

  async function signOut() {
    await fetch('/api/review/session', { method: 'DELETE' }).catch(() => undefined);
    setAuth('signed_out');
    setNotes([]);
  }

  const canEdit = (n: Note) => !!me && (me.role === 'admin' || (n.author_email ?? '').toLowerCase() === me.email.toLowerCase());

  return (
    <div data-review-ui className="rv" lang={locale}>
      {/* Pins (document coordinates, so they scroll with the page) */}
      {me ? (
        <div className="rv-pins" aria-hidden={false}>
          {visible.map((n) =>
            positions[n.id] ? (
              <button
                key={n.id}
                type="button"
                className={`rv-pin is-${n.status} ${selected === n.id ? 'is-selected' : ''}`}
                style={{ left: positions[n.id].left, top: positions[n.id].top }}
                aria-label={`${t.note(number.get(n.id) ?? 0)} — ${n.section_id ?? t.page}`}
                onClick={() => {
                  setSelected(n.id);
                  setPanelOpen(true);
                  document.getElementById(`rv-note-${n.id}`)?.scrollIntoView({ block: 'nearest' });
                }}
              >
                {number.get(n.id)}
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      {picking ? (
        <div ref={overlay} className="rv-overlay" onClick={pick} role="presentation">
          <p className="rv-overlay__hint">{t.pickPoint}</p>
        </div>
      ) : null}

      {draft ? (
        <form
          className="rv-draft"
          style={{ left: Math.min(draft.left, window.scrollX + window.innerWidth - 300), top: draft.top + 12 }}
          onSubmit={saveDraft}
        >
          <span className="rv-draft__dot" aria-hidden />
          <label className="sr-only" htmlFor="rv-draft-text">
            {t.placeholder}
          </label>
          <textarea id="rv-draft-text" autoFocus maxLength={2000} rows={3} placeholder={t.placeholder} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
          <p className="rv-draft__meta">
            {t.section}: {draft.anchor.sectionId ?? t.page}
          </p>
          <div className="rv-actions">
            <button type="submit" className="rv-btn rv-btn--primary" disabled={busy || !draftText.trim()}>
              {busy ? t.working : t.save}
            </button>
            <button type="button" className="rv-btn" onClick={() => setDraft(null)}>
              {t.cancel}
            </button>
          </div>
        </form>
      ) : null}

      <aside className={`rv-panel ${panelOpen ? 'is-open' : ''}`} aria-label={t.tool}>
        <header className="rv-panel__head">
          <button type="button" className="rv-panel__toggle" aria-expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)}>
            {t.tool}
            {me ? <span className="rv-count">{notes.filter((n) => n.status === 'open').length}</span> : null}
          </button>
          <button type="button" className="rv-btn rv-btn--ghost" onClick={onExit}>
            {t.exit}
          </button>
        </header>

        {panelOpen ? (
          <div className="rv-panel__body">
            <p className="rv-message" role="status" aria-live="polite">
              {message}
            </p>

            {auth === 'loading' ? <p>{t.working}</p> : null}
            {auth === 'not_configured' ? <p>{t.notConfigured}</p> : null}

            {auth === 'signed_out' ? (
              <form className="rv-signin" onSubmit={signIn}>
                <h2 className="rv-title">{t.signInTitle}</h2>
                <p>{codeSent ? t.codeSent : t.signInText}</p>
                <label className="rv-field">
                  <span>{t.email}</span>
                  <input type="email" autoComplete="email" required value={email} disabled={codeSent} onChange={(e) => setEmail(e.target.value)} />
                </label>
                {codeSent ? (
                  <label className="rv-field">
                    <span>{t.code}</span>
                    <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required value={code} onChange={(e) => setCode(e.target.value.trim())} />
                  </label>
                ) : null}
                <div className="rv-actions">
                  <button type="submit" className="rv-btn rv-btn--primary" disabled={busy}>
                    {busy ? t.working : codeSent ? t.verify : t.sendCode}
                  </button>
                  {codeSent ? (
                    <button type="button" className="rv-btn" onClick={() => setCodeSent(false)}>
                      {t.cancel}
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}

            {me ? (
              <>
                <p className="rv-me">
                  {me.email} · {t.role[me.role]}{' '}
                  <button type="button" className="rv-link" onClick={signOut}>
                    {t.signOut}
                  </button>
                </p>
                <div className="rv-actions">
                  <button type="button" className="rv-btn rv-btn--primary" onClick={() => setPicking(true)} disabled={!page}>
                    {t.annotate}
                  </button>
                  <div className="rv-filter" role="group" aria-label={t.notes}>
                    <button type="button" className="rv-btn" aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>
                      {t.showOpen}
                    </button>
                    <button type="button" className="rv-btn" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                      {t.showAll}
                    </button>
                  </div>
                </div>

                {visible.length === 0 ? <p className="rv-empty">{t.empty}</p> : null}
                <ol className="rv-list">
                  {visible.map((n) => (
                    <li key={n.id} id={`rv-note-${n.id}`} className={`rv-note is-${n.status} ${selected === n.id ? 'is-selected' : ''}`}>
                      <button type="button" className="rv-note__num" onClick={() => setSelected(n.id)} aria-label={t.note(number.get(n.id) ?? 0)}>
                        {number.get(n.id)}
                      </button>
                      <div className="rv-note__body">
                        <p className="rv-note__meta">
                          {n.section_id ?? t.page} · {t.status[n.status]}
                        </p>
                        {editing?.id === n.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (editing.text.trim()) void patch(n.id, { comment: editing.text });
                            }}
                          >
                            <label className="sr-only" htmlFor={`rv-edit-${n.id}`}>
                              {t.edit}
                            </label>
                            <textarea id={`rv-edit-${n.id}`} rows={3} maxLength={2000} value={editing.text} onChange={(e) => setEditing({ id: n.id, text: e.target.value })} />
                            <div className="rv-actions">
                              <button type="submit" className="rv-btn rv-btn--primary" disabled={busy}>
                                {t.save}
                              </button>
                              <button type="button" className="rv-btn" onClick={() => setEditing(null)}>
                                {t.cancel}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="rv-note__text">{n.comment}</p>
                        )}
                        <p className="rv-note__meta">
                          {n.author_email ?? '—'} · <time dateTime={n.created_at}>{fmt.format(new Date(n.created_at))}</time>
                        </p>
                        <div className="rv-actions">
                          {n.status === 'open' ? (
                            <button type="button" className="rv-btn" disabled={busy} onClick={() => patch(n.id, { status: 'resolved' })}>
                              {t.resolve}
                            </button>
                          ) : (
                            <button type="button" className="rv-btn" disabled={busy} onClick={() => patch(n.id, { status: 'open' })}>
                              {t.reopen}
                            </button>
                          )}
                          {n.status !== 'archived' ? (
                            <button type="button" className="rv-btn" disabled={busy} onClick={() => patch(n.id, { status: 'archived' })}>
                              {t.archive}
                            </button>
                          ) : null}
                          {canEdit(n) && editing?.id !== n.id ? (
                            <button type="button" className="rv-btn" onClick={() => setEditing({ id: n.id, text: n.comment })}>
                              {t.edit}
                            </button>
                          ) : null}
                          {me.role === 'admin' ? (
                            <button type="button" className="rv-btn rv-btn--danger" disabled={busy} onClick={() => remove(n.id)}>
                              {t.delete}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

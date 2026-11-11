'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { ServiceUnit, WhatCopy } from '@/content/types';
import { START_HASH } from '@/lib/nav';
import { track } from '@/lib/analytics';
import { ArrowRight, Check, Close, Plus } from './icons';

/**
 * Branches and units of the "Cosa fa Rainmakers" chart. Each unit is a button that opens its description in a popup
 * (2026-10-26, replacing the in-place expansion): lead, services, examples and a CTA to the matching
 * "Come vuoi iniziare?" popup. Escape, a click on the backdrop or the close button shut it; focus is trapped inside
 * and returns to the unit. Without JS the units still show their one-line description.
 */
export function ServiceChart({ structure }: { structure: Pick<WhatCopy['structure'], 'branches' | 'examplesLabel' | 'close'> }) {
  const uid = useId();
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState<{ unit: ServiceUnit; branch: string } | null>(null);

  const close = () => {
    setOpen(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('modal-open');
    dialog.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab' && dialog.current) {
        const focusables = [...dialog.current.querySelectorAll<HTMLElement>('button, a[href]')];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const u = open?.unit;

  return (
    <>
      <ol className="org__branches">
        {structure.branches.map((b, i) => (
          <li key={b.key} className={`org__branch org__branch--${b.key}`} style={{ '--i': i } as CSSProperties}>
            <div className="org__node">
              <strong>{b.name}</strong>
              <span>{b.tagline}</span>
            </div>
            <ul className="org__units">
              {b.units.map((unit, j) => (
                <li key={unit.name} className="org__unit" style={{ '--j': j } as CSSProperties}>
                  <button
                    type="button"
                    className="org__unit-head"
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      returnFocus.current = event.currentTarget;
                      setOpen({ unit, branch: b.key });
                      track('service_expand', { item: `${b.key}-${unit.name}` });
                    }}
                  >
                    <span className="org__unit-title">
                      <strong>{unit.name}</strong>
                      {unit.badge ? <span className="org__unit-badge">{unit.badge}</span> : null}
                    </span>
                    <span className="org__unit-text">{unit.text}</span>
                    <span className="org__unit-toggle" aria-hidden>
                      <Plus />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {open && u ? (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section
            ref={dialog}
            className={`site-modal svc svc--${open.branch}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${uid}-title`}
            tabIndex={-1}
          >
            <button className="site-modal__close" type="button" aria-label={structure.close} onClick={close}>
              <Close aria-hidden />
            </button>
            <h2 id={`${uid}-title`} className="svc__title">
              {u.brand}
              {u.badge ? <span className="org__unit-badge svc__badge">{u.badge}</span> : null}
            </h2>
            <p className="svc__sub">{u.text}</p>
            <p className="svc__lead">{u.lead}</p>
            <ul className="svc__points">
              {u.points.map((p) => (
                <li key={p}>
                  <Check aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {u.examples?.length ? (
              <p className="svc__examples">
                <span className="svc__examples-label">{structure.examplesLabel}</span>
                {u.examples.map((e) => (
                  <span key={e} className="svc__chip">
                    {e}
                  </span>
                ))}
              </p>
            ) : null}
            {/* closes this popup; the hash opens the matching "Come vuoi iniziare?" popup */}
            <a
              className="btn btn--primary svc__cta"
              href={`#${START_HASH[u.cta.path]}`}
              onClick={() => setOpen(null)}
              data-track="community_cta_click"
              data-location={`services_${open.branch}_${u.cta.path}`}
            >
              <span>{u.cta.label}</span>
              <ArrowRight aria-hidden />
            </a>
          </section>
        </div>
      ) : null}
    </>
  );
}

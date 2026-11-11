import Image from 'next/image';
import { logoBox, type LogoImage } from '@/content/data/logos';

/**
 * Scrolling client banner (Figma review 2026-10-15): white logos on a transparent background, each sized to the
 * same visual weight so wide wordmarks and square marks are equally legible. Compositor-only CSS loop (paused on
 * hover, static with reduced motion). The visible copy is duplicated for a seamless loop and hidden from
 * assistive tech; screen readers get one list.
 */
export function LogoMarquee({ logos, reverse = false }: { logos: (LogoImage & { name: string })[]; reverse?: boolean }) {
  if (!logos.length) return null;
  const row = (hidden: boolean) =>
    logos.map((l) => {
      const box = logoBox(l, 9000, 230, 72);
      return (
        <li key={`${hidden ? 'b' : 'a'}-${l.src}`} className="logo-band__item" aria-hidden={hidden || undefined}>
          <Image src={l.src} alt={hidden ? '' : l.name} width={l.width} height={l.height} style={{ width: box.width, height: box.height }} sizes={`${box.width}px`} />
        </li>
      );
    });
  return (
    <div className={`logo-band${reverse ? ' logo-band--reverse' : ''}`}>
      <ul className="logo-band__track">
        {row(false)}
        {row(true)}
      </ul>
    </div>
  );
}

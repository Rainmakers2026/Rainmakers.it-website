import Image from 'next/image';
import { brand } from '@/content/shared';

type Variant = 'white' | 'black' | 'color' | 'squareWhite' | 'squareBlack' | 'squareColor';

/** Rainmakers mark from the official logo artwork supplied for the site. */
export function Logo({ variant = 'white', className = '' }: { variant?: Variant; className?: string }) {
  const square = variant.startsWith('square');
  return (
    <span className={`logo ${className}`}>
      <Image
        src={brand.files.squareWhite}
        alt=""
        aria-hidden="true"
        className={`logo-img logo-img--mark ${square ? 'logo-img--square' : ''}`}
        width={36}
        height={36}
      />
      {square ? <span className="sr-only">Rainmakers</span> : <span className="logo__word">Rainmakers</span>}
    </span>
  );
}

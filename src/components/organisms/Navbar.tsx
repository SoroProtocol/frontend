'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { WalletButton } from '@/components/atoms/WalletButton';
import { ThemeToggle }  from '@/components/atoms/ThemeToggle';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create',    label: 'New Stream' },
  { href: '/docs',      label: 'Docs' },
];

export function Navbar() {
  const pathname   = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◈</span> SoroProtocol
        </Link>

        <ul id="nav-menu" className={`${styles.links} ${open ? styles.open : ''}`}>
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`${styles.link} ${pathname === l.href ? styles.active : ''}`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.right}>
          <ThemeToggle />
          <WalletButton />
          <button
            className={styles.burger}
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="nav-menu"
          >
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}

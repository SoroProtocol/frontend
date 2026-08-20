'use client';
import type { PayrollMode } from './types';
import styles from './payroll.module.css';

interface Props {
  selected: PayrollMode | null;
  onSelect: (mode: PayrollMode) => void;
}

export function ModeStep({ selected, onSelect }: Props) {
  return (
    <div>
      <div className={styles.modeGrid}>
        <button
          type="button"
          className={`${styles.modeCard} ${selected === 'uniform' ? styles.modeCardSelected : ''}`}
          onClick={() => onSelect('uniform')}
        >
          <h3>Uniform Rate</h3>
          <p>Same rate for every recipient</p>
        </button>
        <button
          type="button"
          className={`${styles.modeCard} ${selected === 'custom' ? styles.modeCardSelected : ''}`}
          onClick={() => onSelect('custom')}
        >
          <h3>Custom Amounts</h3>
          <p>Different amount per person</p>
        </button>
      </div>
    </div>
  );
}

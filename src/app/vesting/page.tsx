import styles from './vesting.module.css';

export default function Vesting() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vesting Schedules</h1>
      </div>

      <div className={styles.comingSoon}>
        <p>Vesting isn&apos;t live yet — the backend for it hasn&apos;t shipped.</p>
        <p className={styles.comingSoonSub}>Check back soon, this page will start working once that lands.</p>
      </div>
    </div>
  );
}

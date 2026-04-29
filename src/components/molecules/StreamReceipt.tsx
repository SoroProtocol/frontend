import styles from './StreamReceipt.module.css';

interface StreamReceiptProps {
  streamId:  string;
  sender:    string;
  recipient: string;
  token:     string;
  rate:      bigint;
}

/**
 * Displays a visual NFT receipt card for an active stream.
 * On-chain minting is tracked via the protocol's NFT contract.
 */
export function StreamReceipt({ streamId, sender, recipient, token, rate }: StreamReceiptProps) {
  return (
    <div className={styles.receipt}>
      <div className={styles.header}>
        <span className={styles.logo}>◈ SoroProtocol</span>
        <span className={styles.id}>#{streamId}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.label}>Stream Receipt</p>
        <p className={styles.rate}>
          {(Number(rate) * 86400 / 1e7).toFixed(4)} {token}/day
        </p>
        <p className={styles.flow}>
          {sender.slice(0,5)}... → {recipient.slice(0,5)}...
        </p>
      </div>
      <div className={styles.footer}>
        <span>Stellar Testnet</span>
        <span>Non-transferable</span>
      </div>
    </div>
  );
}

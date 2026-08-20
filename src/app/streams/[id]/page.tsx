'use client';
import { useParams, useRouter } from 'next/navigation';
import { useStream }          from '@/hooks/useStreams';
import { useWallet }          from '@/context/WalletContext';
import { useStreamBalance }   from '@/hooks/useStreamBalance';
import { useToast }           from '@/context/ToastContext';
import { useContract }        from '@/hooks/useContract';
import { streams }            from '@/lib/contracts';
import { ActivityFeed }       from '@/components/organisms/ActivityFeed';
import styles                 from './stream.module.css';

function fmt(stroops: bigint): string {
  return (Number(stroops) / 1e7).toFixed(7);
}

export default function StreamDetail() {
  const { id }                     = useParams<{ id: string }>();
  const router                     = useRouter();
  const { address }                = useWallet();
  const toast                      = useToast();
  const { execute, loading: txLoading, error: txError } = useContract();
  const { stream, loading, error } = useStream(id);

  const { balance, syncing } = useStreamBalance(
    stream?.contractStreamId ?? '',
    address ?? '',
    stream ? BigInt(stream.ratePerSecond) : 0n,
    stream ? BigInt(stream.withdrawn)     : 0n,
    stream?.startTime ?? 0,
    stream?.stopTime  ?? 0,
    200,
    stream?.status === 'active',
  );

  if (loading) return <div className={styles.loading}>Loading stream…</div>;
  if (error || !stream) return (
    <div className={styles.notFound}>
      <p>{error ?? 'Stream not found.'}</p>
      <button onClick={() => router.back()} className={styles.backBtn}>← Go back</button>
    </div>
  );

  const isSender    = address === stream.sender;
  const isRecipient = address === stream.recipient;
  const isActive    = stream.status === 'active';
  const perDay      = (Number(BigInt(stream.ratePerSecond) * 86_400n) / 1e7).toFixed(4);

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
      <h1 className={styles.title}>Stream #{stream.id}</h1>

      <div className={styles.balanceCard}>
        <p className={styles.balanceLabel}>Withdrawable Balance</p>
        <p className={styles.balanceValue}>
          {fmt(balance)} XLM
          {syncing && <span className={styles.syncingBadge}>syncing</span>}
        </p>
        <p className={styles.balanceRate}>{perDay} XLM/day</p>
      </div>

      <div className={styles.details}>
        {[
          ['From',   `${stream.sender.slice(0,6)}...${stream.sender.slice(-4)}`],
          ['To',     `${stream.recipient.slice(0,6)}...${stream.recipient.slice(-4)}`],
          ['Token',  stream.token === 'native' ? 'XLM (Native)' : stream.token],
          ['Status', stream.status.charAt(0).toUpperCase() + stream.status.slice(1)],
          ['TX',     `${stream.txHash.slice(0,10)}...`],
        ].map(([k, v]) => (
          <div key={k} className={styles.detailRow}>
            <span className={styles.detailKey}>{k}</span>
            <span className={styles.detailVal}>{v}</span>
          </div>
        ))}
      </div>

      {isActive && (
        <div className={styles.actions}>
          {txError && <p className={styles.error} role="alert">{txError}</p>}
          {isRecipient && (
            <button
              className={styles.btnWithdraw}
              disabled={balance === 0n || txLoading}
              title={balance === 0n ? 'Nothing to withdraw yet' : undefined}
              onClick={async () => {
                if (!address) return;
                toast.info('Confirm withdrawal in Freighter…');
                const result = await execute(() => streams.withdrawStream(stream.contractStreamId, address));
                if (result) {
                  toast.success(`Withdrawal confirmed! Tx: ${result.hash.slice(0, 12)}…`);
                  router.refresh();
                }
              }}
            >
              {txLoading ? 'Withdrawing…' : `Withdraw ${fmt(balance)} XLM`}
            </button>
          )}
          {isSender && (
            <button
              className={styles.btnCancel}
              disabled={txLoading}
              onClick={async () => {
                if (!address) return;
                toast.info('Confirm cancellation in Freighter…');
                const result = await execute(() => streams.cancelStream(stream.contractStreamId, address));
                if (result) {
                  toast.success(`Stream cancelled! Tx: ${result.hash.slice(0, 12)}…`);
                  router.refresh();
                }
              }}
            >
              {txLoading ? 'Cancelling…' : 'Cancel Stream'}
            </button>
          )}
          {!isSender && !isRecipient && (
            <p className={styles.notParty}>Connect the sender or recipient wallet to take action.</p>
          )}
        </div>
      )}

      <div className={styles.feedSection}>
        <ActivityFeed walletAddress={address ?? undefined} />
      </div>
    </div>
  );
}

'use client';
import { useState, useRef } from 'react';
import type { Recipient, PayrollMode } from './types';
import { ADDRESS_RE, parseCsvAddresses, parseCsvFile } from './types';
import styles from './payroll.module.css';

type InputTab = 'manual' | 'paste' | 'upload';

interface Props {
  mode: PayrollMode;
  recipients: Recipient[];
  onChange: (recipients: Recipient[]) => void;
}

export function RecipientsStep({ mode, recipients, onChange }: Props) {
  const [tab, setTab] = useState<InputTab>('manual');
  const [manualAddr, setManualAddr] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function addManual() {
    if (!ADDRESS_RE.test(manualAddr)) return;
    if (recipients.some(r => r.address === manualAddr)) return;
    onChange([...recipients, { address: manualAddr, amount: '' }]);
    setManualAddr('');
  }

  function handlePaste() {
    const addrs = parseCsvAddresses(pasteText);
    if (addrs.length === 0) {
      setPasteError('No valid Stellar addresses found');
      return;
    }
    setPasteError('');
    const existing = new Set(recipients.map(r => r.address));
    const newRecipients = addrs
      .filter(a => !existing.has(a))
      .map(address => ({ address, amount: '' }));
    onChange([...recipients, ...newRecipients]);
    setPasteText('');
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const parsed = parseCsvFile(content);
      if (parsed.length === 0) return;
      const existing = new Set(recipients.map(r => r.address));
      const newRecipients = parsed.filter(r => !existing.has(r.address));
      onChange([...recipients, ...newRecipients]);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeRecipient(addr: string) {
    onChange(recipients.filter(r => r.address !== addr));
  }

  function updateAmount(addr: string, amount: string) {
    onChange(recipients.map(r => r.address === addr ? { ...r, amount } : r));
  }

  return (
    <div>
      <div className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${tab === 'manual' ? styles.tabActive : ''}`} onClick={() => setTab('manual')}>Manual</button>
        <button type="button" className={`${styles.tab} ${tab === 'paste' ? styles.tabActive : ''}`} onClick={() => setTab('paste')}>Bulk Paste</button>
        <button type="button" className={`${styles.tab} ${tab === 'upload' ? styles.tabActive : ''}`} onClick={() => setTab('upload')}>CSV Upload</button>
      </div>

      {tab === 'manual' && (
        <div className={styles.form}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className={styles.input}
              placeholder="G..."
              value={manualAddr}
              onChange={e => setManualAddr(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManual(); } }}
            />
            <button type="button" className={styles.addBtn} onClick={addManual} style={{ flexShrink: 0 }}>+ Add</button>
          </div>
        </div>
      )}

      {tab === 'paste' && (
        <div className={styles.form}>
          <textarea
            className={styles.input}
            placeholder={"Paste addresses, one per line or comma-separated:\nGABC...DEF\nGHIJK...LMN"}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          {pasteError && <span className={styles.error}>{pasteError}</span>}
          <button type="button" className={styles.addBtn} onClick={handlePaste}>Parse & Add</button>
        </div>
      )}

      {tab === 'upload' && (
        <div className={styles.form}>
          <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
            <p>Click to upload a CSV file</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Format: address,amount (amount optional for uniform mode)</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} />
          </div>
        </div>
      )}

      {recipients.length > 0 && (
        <div className={styles.recipientList} style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</p>
          {recipients.map(r => (
            <div key={r.address} className={styles.recipientRow}>
              <span className={styles.recipientAddr} title={r.address}>{r.address}</span>
              {mode === 'custom' && (
                <input
                  className={`${styles.input} ${styles.recipientAmt}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={r.amount}
                  onChange={e => updateAmount(r.address, e.target.value)}
                />
              )}
              <button type="button" className={styles.removeBtn} onClick={() => removeRecipient(r.address)} aria-label="Remove">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

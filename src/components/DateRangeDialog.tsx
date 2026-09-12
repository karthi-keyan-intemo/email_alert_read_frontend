import { useEffect, useState } from 'react';

interface DateRangeDialogProps {
  title: string;
  confirmLabel: string;
  initialFromDate: string;
  initialToDate: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (fromDate: string, toDate: string) => void;
}

export function DateRangeDialog({ title, confirmLabel, initialFromDate, initialToDate, loading, error, onCancel, onConfirm }: DateRangeDialogProps) {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setFromDate(initialFromDate);
    setToDate(initialToDate);
    setValidationError(null);
  }, [initialFromDate, initialToDate]);

  const confirm = () => {
    if (!fromDate || !toDate) {
      setValidationError('Please select both dates.');
      return;
    }
    if (fromDate > toDate) {
      setValidationError('From date cannot be after to date.');
      return;
    }
    setValidationError(null);
    onConfirm(fromDate, toDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={loading ? undefined : onCancel}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-slate-700">From Date<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} disabled={loading} className="mt-1 rounded border border-slate-300 px-3 py-2" /></label>
          <label className="flex flex-col text-sm font-medium text-slate-700">To Date<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} disabled={loading} className="mt-1 rounded border border-slate-300 px-3 py-2" /></label>
        </div>
        {validationError || error ? <p className="mt-3 text-sm text-rose-700">{validationError || error}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" disabled={loading} onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={loading} onClick={confirm} className="rounded bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? `${confirmLabel}ing...` : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
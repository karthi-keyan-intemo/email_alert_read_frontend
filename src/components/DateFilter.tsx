interface DateFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClear: () => void;
}

export function DateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
}: DateFilterProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <label className="flex flex-1 flex-col text-sm font-medium text-slate-700">
          From Date
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
        </label>

        <label className="flex flex-1 flex-col text-sm font-medium text-slate-700">
          To Date
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
        </label>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

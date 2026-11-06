import type { FC } from 'react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkPrintBarcode: () => void;
  onBulkExport: () => void;
}

export const BulkActionsToolbar: FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkActivate,
  onBulkDeactivate,
  onBulkArchive,
  onBulkDelete,
  onBulkPrintBarcode,
  onBulkExport,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl bg-[#1b1c22]/95 border border-[#292b31] rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
      {/* Selection Count & Clear */}
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#f0442f] text-white text-xs font-bold">
          {selectedCount}
        </span>
        <span className="text-sm font-medium text-white">
          {selectedCount} {selectedCount === 1 ? 'part' : 'parts'} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs text-[#9a9ca6] hover:text-white underline underline-offset-2 ml-1"
        >
          Deselect all
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBulkPrintBarcode}
          className="px-3 py-1.5 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-medium text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print Barcodes</span>
        </button>

        <button
          type="button"
          onClick={onBulkExport}
          className="px-3 py-1.5 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-medium text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={onBulkActivate}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition"
        >
          Activate
        </button>

        <button
          type="button"
          onClick={onBulkDeactivate}
          className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition"
        >
          Deactivate
        </button>

        <button
          type="button"
          onClick={onBulkArchive}
          className="px-3 py-1.5 rounded-xl bg-[#22242b] border border-[#292b31] text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#2b2d35] transition"
        >
          Archive
        </button>

        <button
          type="button"
          onClick={onBulkDelete}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
};


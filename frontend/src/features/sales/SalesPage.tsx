import { useState } from 'react';
import type { FC } from 'react';
import { POSRegister } from './components/POSRegister';
import { InvoiceHistory } from './components/InvoiceHistory';

type SalesTab = 'register' | 'history';

export const SalesPage: FC = () => {
  const [activeTab, setActiveTab] = useState<SalesTab>('register');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales & Billing</h1>
          <p className="text-sm text-zinc-400 mt-1">POS register, billing, and invoice history</p>
        </div>
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-[#14161d] border border-zinc-800 rounded-xl">
          {([
            { id: 'register', label: '🧾 New Sale' },
            { id: 'history', label: '📋 Invoice History' },
          ] as { id: SalesTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-[#eb4826] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'register' ? <POSRegister /> : <InvoiceHistory />}
    </div>
  );
};


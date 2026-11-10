import { useCallback, useEffect, useState } from 'react';
import type { FC } from 'react';
import { invoiceService } from '../../services/invoiceService';
import type { Customer, CustomerCreateInput } from '../../types/invoice.types';

export const CustomersPage: FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerCreateInput>({
    name: '',
    phone: '',
    email: '',
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await invoiceService.getCustomers(searchTerm.trim() || undefined);
      setCustomers(res.items);
      setTotal(res.total);
    } catch {
      showNotification('Unable to fetch customers from database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone?.trim()) {
      showNotification('Customer name and phone number are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await invoiceService.createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
      });
      showNotification(`Customer "${formData.name}" added successfully.`);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '' });
      void loadCustomers();
    } catch {
      showNotification('Failed to create customer in database', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Directory</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Accounts, contact records, and POS billing profiles
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eb4826] hover:bg-[#ff5733] text-white text-sm font-semibold transition-all shadow-lg shadow-[#eb4826]/20"
        >
          <span>+ Add Customer</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-[#17181c] p-3 rounded-2xl border border-[#292b31]">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, phone, or email..."
          className="flex-1 bg-[#121316] border border-[#2a2d36] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#70737f] focus:outline-none focus:border-[#eb4826]"
        />
        <span className="text-xs text-[#8a8d99] px-3 font-medium whitespace-nowrap">
          {total} {total === 1 ? 'Customer' : 'Customers'}
        </span>
      </div>

      {/* Customers Table */}
      <div className="border border-[#292b31] bg-[#17181c] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-[#8a8d99] text-sm animate-pulse">
            Loading customers from database...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-[#8a8d99] text-sm">
            <p className="text-base font-semibold text-white mb-1">No customers registered</p>
            <p className="text-xs text-[#70737f] mb-4">Add your first customer to link sales and track purchases.</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#22242b] hover:bg-[#2c2f38] text-white text-xs font-semibold"
            >
              + Create Customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#25272e] bg-[#141519] text-[11px] font-semibold text-[#8a8d99] uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22242a]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1a1c22] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{c.name}</td>
                    <td className="py-3.5 px-4 text-[#8a8d99] font-mono">{c.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-[#8a8d99]">{c.email || '—'}</td>
                    <td className="py-3.5 px-4 text-right text-xs text-[#8a8d99] whitespace-nowrap">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-LK') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#17181c] border border-[#292b31] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Add New Customer</h2>
            <p className="text-xs text-[#8a8d99] mb-5">Register customer profile directly into backend database</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#c8cbda] mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kasun Motors / Kamal Perera"
                  className="w-full bg-[#121316] border border-[#2a2d36] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c8cbda] mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone ?? ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 077 123 4567"
                  className="w-full bg-[#121316] border border-[#2a2d36] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c8cbda] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. kasun@example.com"
                  className="w-full bg-[#121316] border border-[#2a2d36] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#eb4826]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#22242a]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#22242a] hover:bg-[#2c2f38] text-xs font-semibold text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#eb4826] hover:bg-[#ff5733] text-xs font-bold text-white transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

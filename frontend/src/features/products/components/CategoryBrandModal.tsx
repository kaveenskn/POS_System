import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Brand, Category } from '../../../types/product.types';

interface CategoryBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  brands: Brand[];
  onAddCategory: (name: string, subcategories?: string) => void;
  onAddBrand: (name: string, origin?: string) => void;
}

export const CategoryBrandModal: FC<CategoryBrandModalProps> = ({
  isOpen,
  onClose,
  categories,
  brands,
  onAddCategory,
  onAddBrand,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubs, setNewCatSubs] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('');

  if (!isOpen) return null;

  const handleCreateCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim(), newCatSubs.trim() || undefined);
    setNewCatName('');
    setNewCatSubs('');
  };

  const handleCreateBrand = (e: FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    onAddBrand(newBrandName.trim(), newBrandOrigin.trim() || undefined);
    setNewBrandName('');
    setNewBrandOrigin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#17181c] border border-[#292b31] p-6 shadow-2xl text-left my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292b31] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#f0442f]/10 text-[#f0442f] flex items-center justify-center text-lg">
              🗂️
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Category & Brand Classifications</h3>
              <p className="text-xs text-[#9a9ca6]">Manage spare part catalogs and registered manufacturer brands</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#9a9ca6] hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-[#292b31] pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'categories'
                ? 'bg-[#f0442f] text-white shadow-md'
                : 'bg-[#22242b] text-[#9a9ca6] hover:text-white'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'brands'
                ? 'bg-[#f0442f] text-white shadow-md'
                : 'bg-[#22242b] text-[#9a9ca6] hover:text-white'
            }`}
          >
            Brands ({brands.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {activeTab === 'categories' ? (
            <div>
              {/* Add category form */}
              <form onSubmit={handleCreateCategory} className="p-4 rounded-xl bg-[#121316] border border-[#292b31] mb-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add New Category</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Category Name (e.g. Braking System)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="bg-[#17181c] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
                  />
                  <input
                    type="text"
                    placeholder="Subcategories (comma-separated)"
                    value={newCatSubs}
                    onChange={(e) => setNewCatSubs(e.target.value)}
                    className="bg-[#17181c] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f0442f] text-xs font-bold text-white hover:bg-[#ff5534]"
                  >
                    + Add Category
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="divide-y divide-[#292b31]/60 rounded-xl border border-[#292b31] bg-[#121316] overflow-hidden">
                {categories.map((c) => (
                  <div key={c.id} className="p-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-white">{c.name}</div>
                      {c.subcategories && (
                        <div className="text-xs text-[#9a9ca6] mt-0.5">{c.subcategories}</div>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6f727d] bg-[#22242b] px-2 py-0.5 rounded-md">
                      ID #{c.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Add Brand Form */}
              <form onSubmit={handleCreateBrand} className="p-4 rounded-xl bg-[#121316] border border-[#292b31] mb-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add New Brand</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Brand Name (e.g. Brembo, Motul, DID)"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="bg-[#17181c] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
                  />
                  <input
                    type="text"
                    placeholder="Origin Country (e.g. Japan, Italy, Sri Lanka)"
                    value={newBrandOrigin}
                    onChange={(e) => setNewBrandOrigin(e.target.value)}
                    className="bg-[#17181c] border border-[#292b31] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0442f]"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f0442f] text-xs font-bold text-white hover:bg-[#ff5534]"
                  >
                    + Add Brand
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="divide-y divide-[#292b31]/60 rounded-xl border border-[#292b31] bg-[#121316] overflow-hidden">
                {brands.map((b) => (
                  <div key={b.id} className="p-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-white">{b.name}</div>
                      {b.origin_country && (
                        <div className="text-xs text-[#9a9ca6] mt-0.5">Origin: {b.origin_country}</div>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6f727d] bg-[#22242b] px-2 py-0.5 rounded-md">
                      ID #{b.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#292b31] text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#292b31] bg-[#22242b] text-sm text-[#f3f4f6]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


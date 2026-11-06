import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { productService } from '../../services/productService';
import { generateAutoBarcode, generateAutoSku } from '../../utils/barcodeGenerator';
import type {
  Brand,
  Category,
  Product,
  ProductActivity,
  ProductCreateInput,
  ProductStatistics,
  StockAdjustmentInput,
  StockMovement,
  StockStatus,
} from '../../types/product.types';

import { BarcodePrintModal } from './components/BarcodePrintModal';
import { BulkActionsToolbar } from './components/BulkActionsToolbar';
import { CategoryBrandModal } from './components/CategoryBrandModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PosScanModal } from './components/PosScanModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ProductFilterBar } from './components/ProductFilterBar';
import { ProductFormView } from './components/ProductFormView';
import { ProductImportModal } from './components/ProductImportModal';
import { ProductStatsCards } from './components/ProductStatsCards';
import { ProductTable } from './components/ProductTable';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';

export const ProductsPage: FC = () => {
  // Page mode: 'list' or 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Products Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ProductStatistics>({
    total_products: 0,
    active_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_inventory_value: 0,
    categories_count: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus>('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at-desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection & Bulk State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // UI / Modal States
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [activityHistory, setActivityHistory] = useState<ProductActivity[]>([]);

  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [printBarcodeProducts, setPrintBarcodeProducts] = useState<Product[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCategoryBrandModalOpen, setIsCategoryBrandModalOpen] = useState(false);
  const [isPosScanModalOpen, setIsPosScanModalOpen] = useState(false);

  // Confirm dialogs
  const [confirmDialogState, setConfirmDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      const [cats, brs] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
      ]);
      setCategories(cats || []);
      setBrands(brs || []);
    } catch (err) {
      console.warn('Backend categories/brands fetch error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch products & stats
  const fetchProductsAndStats = async () => {
    setIsLoading(true);
    try {
      const [field, order] = sortBy.split('-');
      const [res, statistics] = await Promise.all([
        productService.getProducts({
          skip: (currentPage - 1) * pageSize,
          limit: pageSize,
          search: search.trim() ? search.trim() : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          brand: brandFilter !== 'all' ? brandFilter : undefined,
          status: productStatusFilter !== 'all' ? productStatusFilter : undefined,
          stock_status: stockStatusFilter !== 'all' ? stockStatusFilter : undefined,
          sort_by: field,
          sort_order: order,
        }),
        productService.getStatistics(),
      ]);

      setProducts(res.items);
      setTotal(res.total);
      setStats(statistics);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Unable to connect to backend server. Ensure backend is running.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, brandFilter, stockStatusFilter, productStatusFilter, sortBy, currentPage, pageSize]);

  // Handlers for Row Selection
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (products.every((p) => selectedIds.includes(p.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  // Create or Update Product
  const handleSaveProduct = async (
    data: ProductCreateInput,
    actionType: 'save' | 'save_and_add' | 'save_and_print'
  ) => {
    try {
      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = await productService.updateProduct(editingProduct.id, data);
        showNotification(`Product "${savedProduct.name}" updated successfully.`);
      } else {
        savedProduct = await productService.createProduct(data);
        showNotification(`Product "${savedProduct.name}" created successfully.`);
      }

      await fetchProductsAndStats();

      if (actionType === 'save_and_add') {
        setEditingProduct(null);
        setViewMode('form');
      } else if (actionType === 'save_and_print') {
        setViewMode('list');
        setPrintBarcodeProducts([savedProduct]);
      } else {
        setViewMode('list');
        setEditingProduct(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving product';
      showNotification(msg, 'error');
      throw err;
    }
  };

  // View Product Details
  const handleOpenDetails = async (product: Product) => {
    setDetailsProduct(product);
    try {
      const [moves, acts] = await Promise.all([
        productService.getStockHistory(product.id),
        productService.getActivityHistory(product.id),
      ]);
      setStockHistory(moves);
      setActivityHistory(acts);
    } catch {
      setStockHistory([]);
      setActivityHistory([]);
    }
  };

  // Adjust Stock
  const handleConfirmStockAdjustment = async (input: StockAdjustmentInput) => {
    if (!adjustingProduct) return;
    try {
      await productService.adjustStock(adjustingProduct.id, input);
      showNotification(`Stock adjusted for "${adjustingProduct.name}".`);
      await fetchProductsAndStats();
      if (detailsProduct?.id === adjustingProduct.id) {
        handleOpenDetails(adjustingProduct);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adjusting stock';
      showNotification(msg, 'error');
      throw err;
    }
  };

  // Duplicate Product
  const handleDuplicateProduct = (product: Product) => {
    const copy: Product = {
      ...product,
      id: 0,
      name: `${product.name} (Copy)`,
      code: generateAutoSku(product.category, product.brand),
      barcode: generateAutoBarcode(),
      quantity: 0,
      opening_stock: 0,
    };
    setEditingProduct(copy);
    setViewMode('form');
    showNotification(`Duplicate template created for "${product.name}". Unique SKU & Barcode generated; stock reset to 0.`);
  };

  // Activate / Deactivate
  const handleToggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setConfirmDialogState({
      isOpen: true,
      title: `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Product?`,
      message: `Are you sure you want to ${
        newStatus === 'active' ? 'activate' : 'deactivate'
      } "${product.name}"? ${
        newStatus === 'inactive'
          ? 'It will be hidden from new POS sales, but historical invoices remain intact.'
          : ''
      }`,
      confirmLabel: newStatus === 'active' ? 'Activate' : 'Deactivate',
      isDestructive: newStatus === 'inactive',
      onConfirm: async () => {
        await productService.updateProduct(product.id, { status: newStatus });
        showNotification(`Product "${product.name}" is now ${newStatus}.`);
        setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
        fetchProductsAndStats();
      },
    });
  };

  // Archive Product
  const handleArchiveProduct = (product: Product) => {
    setConfirmDialogState({
      isOpen: true,
      title: 'Archive Product?',
      message: `Archiving "${product.name}" hides it from active product lists and POS selection while preserving historical sales, purchase history, and stock records.`,
      confirmLabel: 'Archive Product',
      isDestructive: false,
      onConfirm: async () => {
        await productService.updateProduct(product.id, { status: 'archived' });
        showNotification(`Product "${product.name}" archived.`);
        setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
        fetchProductsAndStats();
      },
    });
  };

  // Delete Product
  const handleDeleteProduct = (product: Product) => {
    const hasHistory = product.quantity > 0 || (product.opening_stock && product.opening_stock > 0);

    setConfirmDialogState({
      isOpen: true,
      title: `Delete "${product.name}"?`,
      message: hasHistory
        ? `"${product.name}" (SKU: ${product.code}) has recorded stock or transaction history. Permanent deletion will disrupt audit trails. We recommend Archiving it instead so it is hidden from new sales while preserving historical records.`
        : `Are you sure you want to permanently delete "${product.name}" (SKU: ${product.code})? This action cannot be undone.`,
      confirmLabel: hasHistory ? 'Archive Instead (Recommended)' : 'Delete Permanently',
      cancelLabel: 'Keep Product',
      isDestructive: !hasHistory,
      onConfirm: async () => {
        try {
          if (hasHistory) {
            await productService.updateProduct(product.id, { status: 'archived' });
            showNotification(`Product "${product.name}" has been safely archived to preserve history.`);
          } else {
            await productService.deleteProduct(product.id);
            showNotification(`Product "${product.name}" deleted.`);
          }
          setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
          fetchProductsAndStats();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Cannot delete product with historical records';
          showNotification(msg, 'error');
          setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Bulk Operations
  const handleBulkAction = (action: string) => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      setConfirmDialogState({
        isOpen: true,
        title: `Delete ${selectedIds.length} Selected Products?`,
        message: `Are you sure you want to permanently delete these ${selectedIds.length} items? This action cannot be undone.`,
        confirmLabel: 'Delete All Selected',
        isDestructive: true,
        onConfirm: async () => {
          await productService.bulkAction(selectedIds, 'delete');
          showNotification(`Deleted ${selectedIds.length} products.`);
          setSelectedIds([]);
          setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
          fetchProductsAndStats();
        },
      });
      return;
    }

    if (action === 'archive') {
      setConfirmDialogState({
        isOpen: true,
        title: `Archive ${selectedIds.length} Products?`,
        message: `Move ${selectedIds.length} items to archive storage.`,
        confirmLabel: 'Archive Selected',
        onConfirm: async () => {
          await productService.bulkAction(selectedIds, 'archive');
          showNotification(`Archived ${selectedIds.length} products.`);
          setSelectedIds([]);
          setConfirmDialogState((prev) => ({ ...prev, isOpen: false }));
          fetchProductsAndStats();
        },
      });
      return;
    }

    // Activate / Deactivate
    productService.bulkAction(selectedIds, action).then(() => {
      showNotification(`Updated status for ${selectedIds.length} products.`);
      setSelectedIds([]);
      fetchProductsAndStats();
    });
  };

  // Bulk Print
  const handleBulkPrint = () => {
    const selectedProds = products.filter((p) => selectedIds.includes(p.id));
    if (selectedProds.length > 0) {
      setPrintBarcodeProducts(selectedProds);
    }
  };

  // Bulk Export CSV
  const handleExportCsv = (filteredOnly = false) => {
    const targetProducts =
      filteredOnly || selectedIds.length === 0
        ? products
        : products.filter((p) => selectedIds.includes(p.id));

    const csvData = productService.exportCsvData(targetProducts);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `torqueline_products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${targetProducts.length} products to CSV.`);
  };

  // Import confirmed
  const handleImportConfirmed = async (items: ProductCreateInput[]) => {
    for (const item of items) {
      await productService.createProduct(item);
    }
    await fetchProductsAndStats();
  };

  // POS Sale Checkout
  const handleCompleteSale = async (cartItems: { product: Product; quantity: number }[]) => {
    for (const item of cartItems) {
      await productService.adjustStock(item.product.id, {
        adjustment_type: 'decrease',
        adjustment_quantity: item.quantity,
        reason: 'POS Walk-in Customer Counter Sale',
        user_name: 'Cashier #1',
      });
    }
    await fetchProductsAndStats();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border text-sm animate-in fade-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="hover:opacity-75 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW SWITCH: Form vs List */}
      {viewMode === 'form' ? (
        <ProductFormView
          initialProduct={editingProduct}
          categories={categories}
          brands={brands}
          onSave={handleSaveProduct}
          onCancel={() => {
            setViewMode('list');
            setEditingProduct(null);
          }}
        />
      ) : (
        <>
          {/* Main Page Top Header & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#292b31]">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#9a9ca6] mb-1">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-[#f0442f] font-medium">Products</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Product Management
              </h1>
              <p className="text-xs sm:text-sm text-[#9a9ca6] mt-0.5">
                Complete lifecycle management for motorcycle spare parts, barcodes, pricing, and stock
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* POS Scanner Shortcut */}
              <button
                type="button"
                onClick={() => setIsPosScanModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs sm:text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition flex items-center gap-2"
                title="Open POS barcode scanner register"
              >
                <span>🛒</span>
                <span>POS Scan Register</span>
              </button>

              {/* Barcode shortcut */}
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) setPrintBarcodeProducts([products[0]]);
                }}
                className="px-3 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-xs sm:text-sm font-medium text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
                title="Barcode management & label printing"
              >
                <span>🏷️</span>
                <span>Barcode</span>
              </button>

              {/* Categories & Brands */}
              <button
                type="button"
                onClick={() => setIsCategoryBrandModalOpen(true)}
                className="px-3 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-xs sm:text-sm font-medium text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
              >
                <span>🗂️</span>
                <span>Categories</span>
              </button>

              {/* Import */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-xs sm:text-sm font-medium text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
              >
                <span>📥</span>
                <span>Import</span>
              </button>

              {/* Export */}
              <button
                type="button"
                onClick={() => handleExportCsv(true)}
                className="px-3 py-2.5 rounded-xl border border-[#292b31] bg-[#1b1c22] text-xs sm:text-sm font-medium text-white hover:bg-[#2b2d35] transition flex items-center gap-1.5"
              >
                <span>📤</span>
                <span>Export</span>
              </button>

              {/* Add New Product CTA */}
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setViewMode('form');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#f0442f] text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-950/40 hover:bg-[#ff5534] transition active:scale-95 flex items-center gap-2"
              >
                <span className="text-base leading-none">+</span>
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Dynamic Statistics Cards */}
          <ProductStatsCards
            stats={stats}
            currentStockFilter={stockStatusFilter}
            currentStatusFilter={productStatusFilter}
            onFilterSelect={(type, val) => {
              if (type === 'all') {
                setStockStatusFilter('all');
                setProductStatusFilter('all');
              } else if (type === 'stock') {
                setStockStatusFilter((val as StockStatus) || 'all');
              } else if (type === 'status') {
                setProductStatusFilter(val || 'all');
              }
            }}
          />

          {/* Search and Advanced Filter Bar */}
          <ProductFilterBar
            search={search}
            onSearchChange={setSearch}
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            brand={brandFilter}
            onBrandChange={setBrandFilter}
            stockStatus={stockStatusFilter}
            onStockStatusChange={setStockStatusFilter}
            productStatus={productStatusFilter}
            onProductStatusChange={setProductStatusFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onClearFilters={() => {
              setSearch('');
              setCategoryFilter('all');
              setBrandFilter('all');
              setStockStatusFilter('all');
              setProductStatusFilter('all');
              setSortBy('created_at-desc');
            }}
            categories={categories}
            brands={brands}
            totalResults={total}
          />

          {/* Responsive Data Table */}
          <ProductTable
            products={products}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onViewProduct={handleOpenDetails}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setViewMode('form');
            }}
            onDuplicateProduct={handleDuplicateProduct}
            onPrintBarcode={(p) => setPrintBarcodeProducts([p])}
            onAdjustStock={(p) => setAdjustingProduct(p)}
            onViewStockHistory={handleOpenDetails}
            onToggleStatus={handleToggleProductStatus}
            onArchiveProduct={handleArchiveProduct}
            onDeleteProduct={handleDeleteProduct}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />

          {/* Floating Bulk Actions Toolbar */}
          <BulkActionsToolbar
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onBulkActivate={() => handleBulkAction('activate')}
            onBulkDeactivate={() => handleBulkAction('deactivate')}
            onBulkArchive={() => handleBulkAction('archive')}
            onBulkDelete={() => handleBulkAction('delete')}
            onBulkPrintBarcode={handleBulkPrint}
            onBulkExport={() => handleExportCsv(false)}
          />
        </>
      )}

      {/* Modals & Dialogs */}
      <ProductDetailsModal
        product={detailsProduct}
        isOpen={Boolean(detailsProduct)}
        onClose={() => setDetailsProduct(null)}
        onEdit={(p) => {
          setDetailsProduct(null);
          setEditingProduct(p);
          setViewMode('form');
        }}
        onAdjustStock={(p) => {
          setDetailsProduct(null);
          setAdjustingProduct(p);
        }}
        onPrintBarcode={(p) => {
          setDetailsProduct(null);
          setPrintBarcodeProducts([p]);
        }}
        stockHistory={stockHistory}
        activityHistory={activityHistory}
      />

      <StockAdjustmentModal
        product={adjustingProduct}
        isOpen={Boolean(adjustingProduct)}
        onClose={() => setAdjustingProduct(null)}
        onConfirm={handleConfirmStockAdjustment}
      />

      <BarcodePrintModal
        products={printBarcodeProducts}
        isOpen={printBarcodeProducts.length > 0}
        onClose={() => setPrintBarcodeProducts([])}
      />

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportConfirmed={handleImportConfirmed}
        existingProducts={products}
      />

      <CategoryBrandModal
        isOpen={isCategoryBrandModalOpen}
        onClose={() => setIsCategoryBrandModalOpen(false)}
        categories={categories}
        brands={brands}
        onAddCategory={(name, subs) => {
          setCategories((prev) => [...prev, { id: Date.now(), name, subcategories: subs }]);
          showNotification(`Category "${name}" created.`);
        }}
        onAddBrand={(name, origin) => {
          setBrands((prev) => [...prev, { id: Date.now(), name, origin_country: origin }]);
          showNotification(`Brand "${name}" registered.`);
        }}
      />

      <PosScanModal
        isOpen={isPosScanModalOpen}
        onClose={() => setIsPosScanModalOpen(false)}
        products={products}
        onCompleteSale={handleCompleteSale}
      />

      <ConfirmDialog
        isOpen={confirmDialogState.isOpen}
        title={confirmDialogState.title}
        message={confirmDialogState.message}
        confirmLabel={confirmDialogState.confirmLabel}
        cancelLabel={confirmDialogState.cancelLabel}
        isDestructive={confirmDialogState.isDestructive}
        onConfirm={confirmDialogState.onConfirm}
        onCancel={() => setConfirmDialogState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ProductsPage;

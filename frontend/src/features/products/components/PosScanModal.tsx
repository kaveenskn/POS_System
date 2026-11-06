import { useEffect, useRef, useState } from 'react';
import type { FC, FormEvent } from 'react';
import type { Product } from '../../../types/product.types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface PosScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onCompleteSale: (items: CartItem[]) => Promise<void>;
}

export const PosScanModal: FC<PosScanModalProps> = ({
  isOpen,
  onClose,
  products,
  onCompleteSale,
}) => {
  const [scanQuery, setScanQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScanOrSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const query = scanQuery.trim().toLowerCase();
    if (!query) return;

    // Search barcode, SKU, or exact name
    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        p.code.toLowerCase() === query ||
        p.name.toLowerCase().includes(query)
    );

    if (match) {
      if (match.status !== 'active') {
        setFeedback(`⚠️ Item "${match.name}" is marked as ${match.status} and cannot be sold.`);
        setScanQuery('');
        return;
      }
      if (match.quantity <= 0) {
        setFeedback(`⚠️ Item "${match.name}" is Out of Stock! (0 ${match.unit} available)`);
        setScanQuery('');
        return;
      }

      setLastScanned(match);
      setCart((prev) => {
        const existingIdx = prev.findIndex((item) => item.product.id === match.id);
        if (existingIdx !== -1) {
          const next = [...prev];
          if (next[existingIdx].quantity < match.quantity) {
            next[existingIdx].quantity += 1;
          } else {
            setFeedback(`⚠️ Maximum available stock reached (${match.quantity} ${match.unit})`);
          }
          return next;
        }
        return [...prev, { product: match, quantity: 1 }];
      });

      setFeedback(`✓ Added "${match.name}" (Rs. ${match.selling_price.toLocaleString()})`);
    } else {
      setFeedback(`✕ No product found matching "${scanQuery}"`);
    }

    setScanQuery('');
  };

  const handleUpdateCartQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === id) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.quantity) {
              setFeedback(`⚠️ Cannot exceed stock level (${item.product.quantity})`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await onCompleteSale(cart);
      alert(`POS Sale Completed! Rs. ${cartTotal.toLocaleString()} charged. Inventory stock reduced.`);
      setCart([]);
      onClose();
    } catch {
      alert('Failed to complete sale transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#17181c] border border-[#292b31] p-6 sm:p-8 shadow-2xl text-left my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#292b31] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
              🛒
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                POS Barcode Scanner & Checkout Register
              </h3>
              <p className="text-xs text-[#9a9ca6]">
                Hardware USB barcode reader emulation & instant cashier checkout
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#9a9ca6] hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {/* Scan input bar */}
        <form onSubmit={handleScanOrSubmit} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#f0442f] text-base">
                ⚡
              </span>
              <input
                ref={inputRef}
                type="text"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder="Scan barcode with handheld reader or type barcode/SKU and press Enter..."
                className="w-full bg-[#121316] border border-[#292b31] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#6f727d] font-mono focus:outline-none focus:border-[#f0442f]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#f0442f] text-sm font-bold text-white hover:bg-[#ff5534] transition whitespace-nowrap"
            >
              Scan & Add
            </button>
          </div>
          {feedback && (
            <p
              className={`text-xs mt-2 font-medium ${
                feedback.startsWith('✓')
                  ? 'text-emerald-400'
                  : feedback.startsWith('⚠️')
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {feedback}
            </p>
          )}
        </form>

        {/* Main Grid: Left Scanner History & Quick Select, Right Cart Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
          {/* Left: Quick scan buttons */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase font-bold text-[#9a9ca6] tracking-wider">
              Popular Quick-Scan Test Barcodes
            </h4>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setScanQuery(p.barcode || p.code);
                    setTimeout(() => handleScanOrSubmit(), 50);
                  }}
                  className="p-3 rounded-xl bg-[#121316] border border-[#292b31] hover:border-[#f0442f] text-left transition flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white line-clamp-1">{p.name}</div>
                    <div className="text-[11px] font-mono text-[#f0442f]">
                      Barcode: {p.barcode || p.code}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Rs. {p.selling_price.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-[#9a9ca6]">{p.quantity} in stock</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Cart Summary */}
          <div className="p-4 rounded-xl bg-[#121316] border border-[#292b31] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#292b31] pb-3 mb-3">
                <h4 className="text-xs uppercase font-bold text-white tracking-wider">
                  Active POS Register Cart ({cart.length} items)
                </h4>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-[#9a9ca6] hover:text-rose-400"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {lastScanned && (
                <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center justify-between">
                  <span className="line-clamp-1">Last Scanned: {lastScanned.name}</span>
                  <span className="font-mono font-bold ml-2">Rs. {lastScanned.selling_price.toLocaleString()}</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6f727d]">
                  Cart is empty. Scan an item or click a quick-scan product to start billing.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-lg bg-[#17181c] border border-[#292b31] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-white line-clamp-1">{item.product.name}</div>
                        <div className="text-[#9a9ca6] font-mono">
                          Rs. {item.product.selling_price.toLocaleString()} × {item.quantity}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-[#22242b] text-white flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold font-mono text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-[#22242b] text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right font-mono font-bold text-emerald-400 min-w-[70px]">
                        Rs. {(item.product.selling_price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total & Checkout */}
            <div className="pt-4 border-t border-[#292b31] mt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-white">Total Amount Due</span>
                <span className="text-2xl font-mono font-black text-emerald-400">
                  Rs. {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm shadow-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing Transaction...' : 'Complete Sale & Deduct Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { generateCode128Svg } from '../../../utils/barcodeGenerator';

interface BarcodeBadgeProps {
  value: string | null | undefined;
  format?: string;
  size?: 'compact' | 'medium' | 'large';
  showNumber?: boolean;
  onPrint?: () => void;
  className?: string;
}

export const BarcodeBadge: FC<BarcodeBadgeProps> = ({
  value,
  size = 'compact',
  showNumber = true,
  onPrint,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const cleanValue = value?.trim();

  // Generate SVG with black bars on white label background (standard thermal barcode)
  const svgMarkup = useMemo(() => {
    if (!cleanValue) return null;

    let barHeight = 24;
    let barWidth = 1.2;
    let fontSize = 9;

    if (size === 'medium') {
      barHeight = 36;
      barWidth = 1.6;
      fontSize = 11;
    } else if (size === 'large') {
      barHeight = 50;
      barWidth = 2.0;
      fontSize = 12;
    }

    return generateCode128Svg(cleanValue, {
      barWidth,
      barHeight,
      showText: showNumber,
      fontSize,
      color: '#000000',
      bgColor: '#ffffff',
    });
  }, [cleanValue, size, showNumber]);

  if (!cleanValue || !svgMarkup) {
    return (
      <span className="text-xs text-[#6f727d] italic select-none">
        No barcode
      </span>
    );
  }

  return (
    <div
      className={`inline-block relative group ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={onPrint}
        title={onPrint ? 'Click to print barcode label' : undefined}
        className="block bg-white rounded-lg p-1.5 shadow-sm border border-zinc-300 hover:border-[#f0442f] transition-all hover:scale-105 active:scale-95 cursor-pointer text-left"
      >
        <div
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
          className="flex items-center justify-center overflow-hidden"
        />
      </button>

      {/* Hover preview tooltip */}
      {showTooltip && onPrint && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-40 bg-[#1b1c22] border border-[#292b31] px-2.5 py-1 rounded-md text-[10px] text-white whitespace-nowrap shadow-xl pointer-events-none animate-in fade-in zoom-in-95">
          <span>Click to print label ({cleanValue})</span>
        </div>
      )}
    </div>
  );
};


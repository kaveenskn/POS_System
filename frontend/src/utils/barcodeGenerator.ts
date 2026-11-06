// ISO/IEC 15417 Standard Code-128 & EAN-13 Scannable Barcode Generator

// Code 128 patterns (widths of alternating bars and spaces: b1, s1, b2, s2, b3, s3)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'                                 // 100-106 (106 is STOP)
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes text into Code-128 symbol sequence and calculates modulo 103 checksum.
 */
export function encodeCode128(text: string): number[] {
  const symbols: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // ASCII 32 to 126 maps to symbol values 0 to 94 in Code Set B
    let val = code - 32;
    if (val < 0 || val > 95) val = 0; // fallback to space
    symbols.push(val);
    checkSum += val * (i + 1);
  }

  const checkSymbol = checkSum % 103;
  symbols.push(checkSymbol);
  symbols.push(STOP);
  return symbols;
}

/**
 * Generates an SVG string representation of a scannable Code-128 barcode.
 */
export function generateCode128Svg(
  text: string,
  options: {
    barWidth?: number;
    barHeight?: number;
    showText?: boolean;
    fontSize?: number;
    color?: string;
    bgColor?: string;
  } = {}
): string {
  const {
    barWidth = 2,
    barHeight = 55,
    showText = true,
    fontSize = 13,
    color = '#ffffff',
    bgColor = 'transparent',
  } = options;

  const symbols = encodeCode128(text);
  let totalModules = 20; // 10 module quiet zone left & right

  // Calculate total module width
  for (const sym of symbols) {
    const pattern = CODE128_PATTERNS[sym];
    if (pattern) {
      for (const ch of pattern) {
        totalModules += parseInt(ch, 10);
      }
    }
  }

  const svgWidth = totalModules * barWidth;
  const svgHeight = barHeight + (showText ? fontSize + 10 : 6);

  let currentX = 10 * barWidth; // Left quiet zone
  let rects = '';

  for (let sIdx = 0; sIdx < symbols.length; sIdx++) {
    const sym = symbols[sIdx];
    const pattern = CODE128_PATTERNS[sym];
    if (!pattern) continue;

    let isBar = true;
    for (let pIdx = 0; pIdx < pattern.length; pIdx++) {
      const moduleCount = parseInt(pattern[pIdx], 10);
      const width = moduleCount * barWidth;
      if (isBar) {
        rects += `<rect x="${currentX}" y="2" width="${width}" height="${barHeight}" fill="${color}" />`;
      }
      currentX += width;
      isBar = !isBar;
    }
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${barHeight + fontSize + 4}" fill="${color}" font-family="monospace, monospace" font-size="${fontSize}" font-weight="600" text-anchor="middle" letter-spacing="1.5">${text}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="background-color: ${bgColor}; max-width: 100%; height: auto;">
    <rect width="${svgWidth}" height="${svgHeight}" fill="${bgColor}" />
    ${rects}
    ${textElement}
  </svg>`;
}

/**
 * Generates an automated unique SKU code for motorcycle spare parts.
 * e.g., "TL-BRK-8921" or "TL-ENG-4392"
 */
export function generateAutoSku(category = 'General', brand = 'TL'): string {
  const catPrefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRT') || 'PRT';
  const brandPrefix = brand.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'TL') || 'TL';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${brandPrefix}-${catPrefix}-${randomNum}`;
}

/**
 * Generates a standard Code-128 / EAN compatible unique numeric barcode string.
 */
export function generateAutoBarcode(): string {
  // 12 digit numeric code with checksum
  let code = '200'; // Internal Store Prefix
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  // Compute EAN/Mod10 checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit.toString();
}


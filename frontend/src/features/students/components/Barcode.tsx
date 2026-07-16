import React from 'react';

interface BarcodeProps {
  value: string;
  height?: number;
  className?: string;
}

const CODE39_MAP: Record<string, string> = {
  '0': '101001101101',
  '1': '110100101011',
  '2': '101100101011',
  '3': '110110010101',
  '4': '101001100101',
  '5': '1101001100101',
  '6': '1011001100101',
  '7': '101001011001',
  '8': '1101001011001',
  '9': '1011001011001',
  'A': '110101001011',
  'B': '101101001011',
  'C': '110110100101',
  'D': '101011001011',
  'E': '110101100101',
  'F': '101101100101',
  'G': '101010011011',
  'H': '110101001101',
  'I': '101101001101',
  'J': '101011001101',
  'K': '110101010011',
  'L': '101101010011',
  'M': '110110101001',
  'N': '101011010011',
  'O': '110101101001',
  'P': '101101101001',
  'Q': '101010110011',
  'R': '110101011001',
  'S': '101101011001',
  'T': '101011011001',
  'U': '110010101011',
  'V': '100110101011',
  'W': '110011010101',
  'X': '100101101011',
  'Y': '110010110101',
  'Z': '100110110101',
  '-': '100101011011',
  '.': '110010101101',
  ' ': '100110101101',
  '*': '100101101101',
};

export default function Barcode({ value, height = 40, className = '' }: BarcodeProps) {
  // Code 39 requires start and stop characters '*'
  const upperValue = `*${value.toUpperCase()}*`;
  
  // Build bit pattern
  let bits = '';
  for (let i = 0; i < upperValue.length; i++) {
    const char = upperValue[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP[' '];
    bits += pattern + '0'; // Add narrow space between characters
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="flex items-stretch bg-white p-1 rounded" 
        style={{ height: `${height}px` }}
      >
        {bits.split('').map((bit, idx) => (
          <div
            key={idx}
            className={`w-[1px] h-full ${bit === '1' ? 'bg-black' : 'bg-transparent'}`}
          />
        ))}
      </div>
      <span className="text-[8px] font-mono tracking-widest text-muted-foreground mt-1 select-all">
        {value}
      </span>
    </div>
  );
}

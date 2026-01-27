import React, { useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface OTPInputProps {
    value: string;
    onChange: (val: string) => void;
    length?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 4 }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
      if (inputs.current[0]) {
          inputs.current[0].focus();
      }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    
    // Handle Multi-char entry (Paste or Autocomplete)
    if (val.length > 1) {
        const numbers = val.replace(/\D/g, '').split('');
        if (numbers.length === 0) return;
        
        const chars = value.split('');
        // Ensure array has enough elements
        while (chars.length < length) chars.push('');

        // Fill starting from current index
        numbers.forEach((num, i) => {
            if (index + i < length) {
                chars[index + i] = num;
            }
        });
        onChange(chars.join('').slice(0, length));
        
        // Focus the box after the last inserted char
        const target = (index + numbers.length >= length) ? length - 1 : index + numbers.length;
        inputs.current[target]?.focus();
        return;
    }

    // Standard Single Character Entry
    const char = val.slice(-1); 
    if (!/^\d*$/.test(char)) return;

    const chars = value.split('');
    while (chars.length < length) chars.push('');
    
    chars[index] = char;
    onChange(chars.join('').slice(0, length));

    // Advance focus if a valid character was entered
    if (char && index < length - 1) {
        inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
        e.preventDefault(); 
        const chars = value.split('');
        while (chars.length < length) chars.push('');

        if (chars[index]) {
            // If current box has a value, just delete it, stay focused
            chars[index] = '';
            onChange(chars.join('').slice(0, length));
        } else if (index > 0) {
            // If current box is empty, delete previous and move back
            chars[index - 1] = '';
            onChange(chars.join('').slice(0, length));
            inputs.current[index - 1]?.focus();
        }
    } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      
      if (pastedData) {
          onChange(pastedData);
          // Focus the input after the pasted content or the last one
          const nextIndex = Math.min(pastedData.length, length - 1);
          inputs.current[nextIndex]?.focus();
      }
  };

  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={cn(
              "w-14 h-16 text-center text-2xl font-serif font-bold rounded-xl border transition-all focus:outline-none focus:ring-4 shadow-sm",
              value[i] 
                ? "border-brand-500 bg-white ring-brand-500/20 text-brand-900 shadow-md" 
                : "border-stone-200 bg-stone-50 text-stone-900 focus:border-brand-500 focus:bg-white focus:ring-brand-500/20"
          )}
        />
      ))}
    </div>
  );
};

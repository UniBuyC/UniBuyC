import React from 'react';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../theme';

// Logo de UniBuyC (toldo + U) dibujado como vector, en el verde del tema
export default function BrandLogo({ size = 96 }: { size?: number }) {
  const { colors: c } = useTheme();
  const tint = '#B7EAD9';
  const awning = [0, 1, 2, 3]
    .map((i) => {
      const x = 30 + i * 10;
      return `<path d="M${x} 29 H${x + 10} V35 A5 5 0 0 1 ${x} 35 Z" fill="${i % 2 ? tint : '#FFFFFF'}"/>`;
    })
    .join('');
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${c.primary}"/>${awning}<path d="M41 48 V58 A9 9 0 0 0 59 58 V48" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/></svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

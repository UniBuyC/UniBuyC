import React, { useMemo } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { blobatar } from 'blobatar';

interface Props {
  // Identificador estable del usuario (su id): el mismo id siempre da el mismo avatar
  seed: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

// Avatar generado a partir del id del usuario (blobatar), sin necesidad de subir foto
export default function Avatar({ seed, size = 50, style }: Props) {
  const xml = useMemo(() => blobatar(seed || 'unibyc', { background: 'circle' }), [seed]);

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

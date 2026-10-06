import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
// @ts-ignore
import { Search, X } from 'lucide-react-native';
import { useTheme, useThemedStyles, ThemeColors } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  style?: ViewStyle;
}

export default function SearchBar({ value, onChangeText, placeholder, style }: Props) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.searchBar, style]}>
      {/* @ts-ignore */}
      <Search color={c.textFaint} size={20} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10}>
          {/* @ts-ignore */}
          <X color={c.textFaint} size={18} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.muted,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: c.textSecondary,
  },
});

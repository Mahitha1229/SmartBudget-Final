/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeStore } from '@/app/_lib/useThemeStore';
import { Colors } from '@/constants/theme';

export function useThemeColor<T extends keyof typeof Colors.light & keyof typeof Colors.dark>(
  props: { light?: string; dark?: string },
  colorName: T
): typeof Colors.light[T] {
  const isDarkMode = useThemeStore((state: { isDarkMode: boolean }) => state.isDarkMode);
  const theme = isDarkMode ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps as typeof Colors.light[T];
  } else {
    return Colors[theme][colorName];
  }
}
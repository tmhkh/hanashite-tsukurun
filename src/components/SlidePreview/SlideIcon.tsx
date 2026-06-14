import { icons, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SlideIconProps {
  keyword: string;
  size?: number;
}

/**
 * image_keyword を PascalCase に変換する。
 * 例: "dog" → "Dog", "heart" → "Heart", "file-text" → "FileText"
 */
function toPascalCase(keyword: string): string {
  return keyword
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/**
 * image_keyword に対応する Lucide アイコンを動的にルックアップする。
 * 対応するアイコンが存在しない場合は Star アイコンにフォールバックする。
 */
export function SlideIcon({ keyword, size = 48 }: SlideIconProps) {
  const pascalName = toPascalCase(keyword);
  const IconComponent: LucideIcon =
    (icons as Record<string, LucideIcon>)[pascalName] ?? Star;

  return <IconComponent size={size} aria-label={keyword || 'star'} />;
}

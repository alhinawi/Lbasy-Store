'use client';
import Link from 'next/link';
import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_THEME, findTheme, type ThemeId } from '@/lib/themes';
const ThemeContext = createContext({ theme: findTheme(DEFAULT_THEME), preview: false });
export const useStoreTheme = () => useContext(ThemeContext);
export function ThemeProvider({ children, initialTheme = DEFAULT_THEME }: { children: React.ReactNode; initialTheme?: ThemeId }) {
 const [id, setId] = useState<ThemeId>(initialTheme);
 const [preview, setPreview] = useState(false);
 useEffect(() => {
  const q = new URLSearchParams(window.location.search).get('theme-preview');
  if (q && findTheme(q).id === q) { queueMicrotask(() => { setId(findTheme(q).id); setPreview(true); }); return; }
  fetch('/api/theme', { cache: 'no-store' }).then(r => r.json()).then(v => { if(v.theme) setId(findTheme(v.theme).id); }).catch(() => {});
 }, []);
 const theme = findTheme(id);
 return <ThemeContext.Provider value={{theme,preview}}><div className="storefront" data-theme={theme.id} style={{'--theme-bg':theme.color,'--theme-ink':theme.ink} as React.CSSProperties}>{preview && <div className="theme-preview-bar">معاينة {theme.id} · {theme.ar} <Link href="/admin">العودة للوحة التحكم ←</Link></div>}{children}</div></ThemeContext.Provider>;
}

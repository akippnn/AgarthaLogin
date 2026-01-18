import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

type Translations = Record<string, any>;

interface I18nContextType {
  t: (key: string) => string;
  lang: string;
  setLang: (lang: string) => void;
  loaded: boolean;
}

const I18nContext = createContext<I18nContextType>({
  t: (k) => k,
  lang: 'en',
  setLang: () => { },
  loaded: false
});

export function I18nProvider({ children }: { children: any }) {
  const [lang, setLang] = useState('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simple language detection
    const params = new URLSearchParams(window.location.search);
    const detected = params.get('lang') || navigator.language.split('-')[0] || 'en';
    setLang(detected);
  }, []);

  useEffect(() => {
    fetch(`/locales/${lang}.json`)
      .then(res => res.json())
      .then(data => {
        setTranslations(data);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load translations', err);
        setLoaded(true); // Don't block UI on error
      });
  }, [lang]);

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang, loaded }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

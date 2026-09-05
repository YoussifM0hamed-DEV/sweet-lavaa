import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsService } from '../services/catalogService.js';

const SettingsContext = createContext(null);

/** Sensible defaults so the UI renders correctly before the API responds. */
const FALLBACK = {
  store: {
    name: 'Sweet Lava',
    tagline: 'Handcrafted sweets, baked fresh every morning.',
    description: '',
    logo: { url: '' },
  },
  contact: { phone: '', email: '', address: '', workingHours: '', whatsapp: '' },
  social: {},
  delivery: { info: '', preparationNote: '' },
  announcement: { enabled: false, text: '', link: '/products' },
  commerce: { currency: 'EGP', currencySymbol: 'EGP', minimumOrderAmount: 0, allowCashOnDelivery: true },
  seo: {},
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    settingsService
      .get()
      .then((response) => {
        if (!cancelled) setSettings({ ...FALLBACK, ...response.data.settings });
      })
      .catch(() => {
        /* keep the fallback — the storefront must still render */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      currency: settings.commerce?.currency || 'EGP',
      storeName: settings.store?.name || 'Sweet Lava',
    }),
    [settings, isLoading],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside a SettingsProvider.');
  return context;
};

export default SettingsContext;

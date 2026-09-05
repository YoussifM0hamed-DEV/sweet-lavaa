import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cartService } from '../services/commerceService.js';
import { useAuth } from './AuthContext.jsx';
import { finalPrice, productImage } from '../utils/product.js';

const CartContext = createContext(null);
const GUEST_KEY = 'sl_guest_cart';

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  } catch {
    /* private mode — cart stays in memory for this session */
  }
};

const emptyPricing = { subtotal: 0, discount: 0, deliveryFee: 0, tax: 0, total: 0, currency: 'EGP' };

/**
 * Guest totals are display-only. The server recalculates every figure when the
 * order is placed, so nothing here can influence what a customer is charged.
 */
const guestPricing = (items) => {
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  return { ...emptyPricing, subtotal: Math.round(subtotal * 100) / 100, total: Math.round(subtotal * 100) / 100 };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [pricing, setPricing] = useState(emptyPricing);
  const [coupon, setCoupon] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [bump, setBump] = useState(0);

  const mergedRef = useRef(false);

  const applyServerCart = useCallback((cart) => {
    setItems(cart.items || []);
    setPricing(cart.pricing || emptyPricing);
    setCoupon(cart.coupon || null);
    setDelivery(cart.delivery || null);
    setIssues(cart.issues || []);
  }, []);

  const loadGuestCart = useCallback(() => {
    const guestItems = readGuestCart();
    setItems(guestItems);
    setPricing(guestPricing(guestItems));
    setCoupon(null);
    setDelivery(null);
    setIssues([]);
  }, []);

  /* Load the right cart for the current session, merging a guest cart on sign-in. */
  useEffect(() => {
    if (authLoading) return;

    const load = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          const guestItems = readGuestCart();
          if (guestItems.length && !mergedRef.current) {
            mergedRef.current = true;
            const response = await cartService.merge(
              guestItems.map((item) => ({
                product: item.product,
                quantity: item.quantity,
                variantId: item.variant?.id || undefined,
              })),
            );
            writeGuestCart([]);
            applyServerCart(response.data.cart);
            toast.success('We moved your cart over to your account.');
          } else {
            const response = await cartService.get();
            applyServerCart(response.data.cart);
          }
        } else {
          mergedRef.current = false;
          loadGuestCart();
        }
      } catch {
        toast.error('We could not load your cart.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAuthenticated, authLoading, applyServerCart, loadGuestCart]);

  const triggerBump = () => setBump((value) => value + 1);

  const addItem = useCallback(
    async (product, { quantity = 1, variant = null } = {}) => {
      setIsMutating(true);
      try {
        if (isAuthenticated) {
          const response = await cartService.addItem({
            product: product._id || product.id,
            quantity,
            variantId: variant?._id || undefined,
          });
          applyServerCart(response.data.cart);
          toast.success(response.message || `${product.name} added to your cart.`);
        } else {
          const productId = String(product._id || product.id);
          const variantId = variant?._id ? String(variant._id) : '';
          const unitPrice = finalPrice(product) + Number(variant?.priceModifier || 0);

          const next = readGuestCart();
          const existing = next.find(
            (item) => item.product === productId && String(item.variant?.id || '') === variantId,
          );

          if (existing) {
            existing.quantity = Math.min(99, existing.quantity + quantity);
          } else {
            next.push({
              product: productId,
              name: product.name,
              slug: product.slug,
              image: productImage(product),
              categoryName: product.category?.name || '',
              variant: { id: variant?._id || null, name: variant?.name || '' },
              unitPrice,
              originalPrice: Number(product.price) + Number(variant?.priceModifier || 0),
              quantity: Math.min(99, quantity),
              stock: product.stock,
              trackInventory: product.trackInventory,
            });
          }

          next.forEach((item) => {
            item.lineTotal = Math.round(item.unitPrice * item.quantity * 100) / 100;
          });

          writeGuestCart(next);
          setItems(next);
          setPricing(guestPricing(next));
          toast.success(`${product.name} added to your cart.`);
        }
        triggerBump();
      } catch (error) {
        toast.error(error.message);
        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated, applyServerCart],
  );

  const updateQuantity = useCallback(
    async (item, quantity) => {
      setIsMutating(true);
      try {
        if (isAuthenticated) {
          const response = await cartService.updateItem(item.product, {
            quantity,
            variantId: item.variant?.id || undefined,
          });
          applyServerCart(response.data.cart);
        } else {
          const next = readGuestCart()
            .map((entry) =>
              entry.product === item.product && String(entry.variant?.id || '') === String(item.variant?.id || '')
                ? { ...entry, quantity, lineTotal: Math.round(entry.unitPrice * quantity * 100) / 100 }
                : entry,
            )
            .filter((entry) => entry.quantity > 0);

          writeGuestCart(next);
          setItems(next);
          setPricing(guestPricing(next));
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated, applyServerCart],
  );

  const removeItem = useCallback(
    async (item) => {
      setIsMutating(true);
      try {
        if (isAuthenticated) {
          const response = await cartService.removeItem(item.product, item.variant?.id);
          applyServerCart(response.data.cart);
        } else {
          const next = readGuestCart().filter(
            (entry) =>
              !(entry.product === item.product && String(entry.variant?.id || '') === String(item.variant?.id || '')),
          );
          writeGuestCart(next);
          setItems(next);
          setPricing(guestPricing(next));
        }
        toast.success('Item removed.');
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsMutating(false);
      }
    },
    [isAuthenticated, applyServerCart],
  );

  const clearCart = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (isAuthenticated) {
          const response = await cartService.clear();
          applyServerCart(response.data.cart);
        } else {
          writeGuestCart([]);
          setItems([]);
          setPricing(emptyPricing);
        }
        if (!silent) toast.success('Your cart is empty.');
      } catch (error) {
        toast.error(error.message);
      }
    },
    [isAuthenticated, applyServerCart],
  );

  const applyCoupon = useCallback(
    async (code) => {
      const response = await cartService.applyCoupon(code);
      applyServerCart(response.data.cart);
      toast.success(response.message || 'Coupon applied.');
      return response.data.cart;
    },
    [applyServerCart],
  );

  const removeCoupon = useCallback(async () => {
    const response = await cartService.removeCoupon();
    applyServerCart(response.data.cart);
    toast.success('Coupon removed.');
  }, [applyServerCart]);

  /** Asks the server for the authoritative totals for a zone + coupon. */
  const requestQuote = useCallback(async ({ deliveryZone, couponCode }) => {
    const response = await cartService.quote({ deliveryZone, couponCode });
    setPricing(response.data.pricing);
    setDelivery(response.data.delivery);
    setCoupon(response.data.coupon);
    setIssues(response.data.issues || []);
    return response.data;
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      loadGuestCart();
      return;
    }
    const response = await cartService.get();
    applyServerCart(response.data.cart);
  }, [isAuthenticated, applyServerCart, loadGuestCart]);

  const itemsCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);

  const isInCart = useCallback(
    (productId, variantId = null) =>
      items.some(
        (item) =>
          String(item.product) === String(productId) &&
          String(item.variant?.id || '') === String(variantId || ''),
      ),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      pricing,
      coupon,
      delivery,
      issues,
      itemsCount,
      isLoading,
      isMutating,
      isEmpty: items.length === 0,
      bump,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      requestQuote,
      refresh,
      isInCart,
    }),
    [
      items, pricing, coupon, delivery, issues, itemsCount, isLoading, isMutating, bump,
      addItem, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, requestQuote, refresh, isInCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside a CartProvider.');
  return context;
};

export default CartContext;

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiArrowRight, FiClock } from 'react-icons/fi';
import SmartImage from '../ui/SmartImage.jsx';
import Spinner from '../ui/Spinner.jsx';
import { productService } from '../../services/catalogService.js';
import useDebounce from '../../hooks/useDebounce.js';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import useLocalStorage from '../../hooks/useLocalStorage.js';
import { formatPrice } from '../../utils/format.js';
import { finalPrice, productImage } from '../../utils/product.js';
import { useSettings } from '../../context/SettingsContext.jsx';

const POPULAR = ['Lava cake', 'Cheesecake', 'Brownies', 'Gift box', 'Macarons'];

const SearchOverlay = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { currency } = useSettings();

  const [term, setTerm] = useState('');
  const [results, setResults] = useState({ products: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [recent, setRecent] = useLocalStorage('sl_recent_searches', []);

  const debounced = useDebounce(term, 300);
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setTerm('');
      setResults({ products: [], categories: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults({ products: [], categories: [] });
      return undefined;
    }

    let cancelled = false;
    setIsSearching(true);

    productService
      .suggestions(debounced.trim())
      .then((response) => {
        if (!cancelled) setResults(response.data);
      })
      .catch(() => {
        if (!cancelled) setResults({ products: [], categories: [] });
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const runSearch = (value) => {
    const query = (value ?? term).trim();
    if (!query) return;
    setRecent((current) => [query, ...current.filter((entry) => entry !== query)].slice(0, 5));
    onClose();
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  if (!isOpen) return null;

  const showSuggestions = term.trim().length < 2;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Search products">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-cocoa-900/50 backdrop-blur-sm"
      />

      <div className="relative mx-auto w-full max-w-3xl animate-fade-up px-4 pt-4 sm:mt-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-cream-50 shadow-lift">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
            className="flex items-center gap-3 border-b border-cream-300 px-5 py-4"
          >
            <FiSearch className="shrink-0 text-xl text-cocoa-300" />
            <input
              ref={inputRef}
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search cakes, cookies, gift boxes..."
              className="flex-1 bg-transparent text-base text-cocoa-800 outline-none placeholder:text-cocoa-200"
              aria-label="Search products"
            />
            {isSearching && <Spinner size="sm" className="text-cocoa-300" />}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
            >
              <FiX />
            </button>
          </form>

          <div className="max-h-[60vh] overflow-y-auto p-5">
            {showSuggestions ? (
              <div className="space-y-6">
                {recent.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Recent searches</p>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => runSearch(entry)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3.5 py-1.5 text-xs font-medium text-cocoa-600 transition-colors hover:bg-cream-300"
                        >
                          <FiClock className="text-[0.9em]" /> {entry}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="eyebrow mb-3">Popular right now</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => runSearch(entry)}
                        className="rounded-full border border-cream-400 px-3.5 py-1.5 text-xs font-medium text-cocoa-600 transition-colors hover:border-cocoa-800 hover:bg-cocoa-800 hover:text-cream-100"
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : results.products.length === 0 && results.categories.length === 0 ? (
              <p className="py-10 text-center text-sm text-cocoa-300">
                {isSearching ? 'Searching...' : `No matches for "${term}". Try something else.`}
              </p>
            ) : (
              <div className="space-y-6">
                {results.categories.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {results.categories.map((category) => (
                        <Link
                          key={category._id}
                          to={`/categories/${category.slug}`}
                          onClick={onClose}
                          className="rounded-full bg-cocoa-800 px-3.5 py-1.5 text-xs font-semibold text-cream-100"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {results.products.length > 0 && (
                  <div>
                    <p className="eyebrow mb-3">Products</p>
                    <ul className="space-y-1">
                      {results.products.map((product) => (
                        <li key={product._id}>
                          <Link
                            to={`/products/${product.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-4 rounded-2xl p-2.5 transition-colors hover:bg-cream-200"
                          >
                            <SmartImage
                              src={productImage(product)}
                              alt={product.name}
                              width={120}
                              className="h-14 w-14 shrink-0 rounded-xl"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-cocoa-800">{product.name}</span>
                              <span className="text-sm text-caramel-700">
                                {formatPrice(finalPrice(product), currency)}
                              </span>
                            </span>
                            <FiArrowRight className="shrink-0 text-cocoa-300" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => runSearch()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cream-200 py-3 text-sm font-semibold text-cocoa-700 transition-colors hover:bg-cream-300"
                >
                  See all results <FiArrowRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;

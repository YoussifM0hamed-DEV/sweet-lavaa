import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import Button from '../ui/Button.jsx';
import { miscService } from '../../services/catalogService.js';
import useReveal from '../../hooks/useReveal.js';

const NewsletterSection = () => {
  const ref = useReveal();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await miscService.subscribe(email.trim(), 'homepage');
      toast.success(response.message);
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container-page">
        <div ref={ref} className="reveal overflow-hidden rounded-[2rem] bg-cocoa-gradient px-7 py-14 text-center sm:px-12 sm:py-20">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-caramel-500/20 text-2xl text-caramel-300">
            <FiMail />
          </span>

          <h2 className="mt-6 font-display text-display-sm text-cream-50 text-balance">
            Get sweet deals &amp; new releases
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream-200/70">
            One email a month. New flavours, seasonal collections and the occasional discount code. No noise.
          </p>

          {subscribed ? (
            <p className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-300">
              <FiCheckCircle /> You are on the list. Talk soon.
            </p>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-full border border-cocoa-600 bg-cocoa-700/40 px-5 py-3.5 text-sm text-cream-100 outline-none transition-colors placeholder:text-cream-300/40 focus:border-caramel-400"
              />
              <Button type="submit" variant="accent" isLoading={isSubmitting} loadingText="Joining…">
                Subscribe
              </Button>
            </form>
          )}

          <p className="mt-4 text-xs text-cream-300/45">Unsubscribe any time. We never share your address.</p>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;

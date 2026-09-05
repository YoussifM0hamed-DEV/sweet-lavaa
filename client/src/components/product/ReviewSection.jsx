import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import Rating, { RatingInput } from '../ui/Rating.jsx';
import Button from '../ui/Button.jsx';
import Input, { Textarea } from '../ui/Input.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Spinner from '../ui/Spinner.jsx';
import { reviewService } from '../../services/catalogService.js';
import { orderService } from '../../services/commerceService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate, initials } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const ReviewCard = ({ review }) => (
  <article className="border-b border-cream-300 py-6 last:border-b-0">
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-300 font-display text-sm font-semibold text-cocoa-600">
        {review.user?.avatar?.url ? (
          <img src={review.user.avatar.url} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          initials(`${review.user?.firstName || ''} ${review.user?.lastName || ''}`) || 'SL'
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-semibold text-cocoa-800">
            {review.user?.firstName} {review.user?.lastName?.[0]}.
          </p>
          {review.isVerifiedPurchase && (
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-600">
              <FiCheckCircle /> Verified purchase
            </span>
          )}
          <span className="text-xs text-cocoa-300">{formatDate(review.createdAt)}</span>
        </div>

        <Rating value={review.rating} size="xs" showValue={false} className="mt-1.5" />

        {review.title && <h4 className="mt-2 font-semibold text-cocoa-700">{review.title}</h4>}
        <p className="mt-1.5 text-sm leading-relaxed text-cocoa-500">{review.comment}</p>

        {review.adminReply?.message && (
          <div className="mt-3 rounded-xl border-l-2 border-caramel-400 bg-cream-200/70 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-caramel-700">Sweet Lava replied</p>
            <p className="mt-1 text-sm text-cocoa-500">{review.adminReply.message}</p>
          </div>
        )}
      </div>
    </div>
  </article>
);

const ReviewForm = ({ productId, onCreated, onCancel }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});

    if (comment.trim().length < 5) {
      setErrors({ comment: 'Please write at least a few words.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await reviewService.create({ product: productId, rating, title, comment });
      toast.success(response.message || 'Thank you for your review!');
      onCreated(response.data.review);
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel space-y-4">
      <div>
        <p className="label">Your rating</p>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <Input
        label="Headline"
        placeholder="Sum it up in a few words"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={120}
      />

      <Textarea
        label="Your review"
        placeholder="What did you think of the taste, texture and packaging?"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={errors.comment}
        required
        rows={4}
      />

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting} loadingText="Posting…">
          Post review
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

/** Ratings summary, review list and the gated review form. */
const ReviewSection = ({ product }) => {
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(
    async (targetPage) => {
      setIsLoading(true);
      try {
        const response = await reviewService.forProduct(product._id, { page: targetPage, limit: 5 });
        setReviews((current) => (targetPage === 1 ? response.data.reviews : [...current, ...response.data.reviews]));
        setDistribution(response.data.distribution);
        setMeta(response.meta);
      } catch {
        /* the empty state covers a failed load */
      } finally {
        setIsLoading(false);
      }
    },
    [product._id],
  );

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  /* Only customers who received this product may write a review. */
  useEffect(() => {
    if (!isAuthenticated) {
      setCanReview(false);
      return;
    }
    orderService
      .reviewable()
      .then((response) => {
        setCanReview(response.data.products.some((entry) => String(entry.product) === String(product._id)));
      })
      .catch(() => setCanReview(false));
  }, [isAuthenticated, product._id]);

  const totalReviews = meta.total || 0;
  const maxCount = Math.max(1, ...distribution.map((entry) => entry.count));

  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="text-display-sm">Customer reviews</h2>

          <div className="mt-5 flex items-end gap-4">
            <span className="font-display text-5xl font-semibold text-cocoa-800">
              {(product.ratingAverage || 0).toFixed(1)}
            </span>
            <div className="pb-1.5">
              <Rating value={product.ratingAverage} size="sm" showValue={false} />
              <p className="mt-1 text-xs text-cocoa-300">{totalReviews} review{totalReviews === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {distribution.map((entry) => (
              <div key={entry.stars} className="flex items-center gap-3">
                <span className="w-8 text-xs font-semibold text-cocoa-400">{entry.stars}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-300">
                  <div
                    className="h-full rounded-full bg-gold-400 transition-all duration-700"
                    style={{ width: `${(entry.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-cocoa-300">{entry.count}</span>
              </div>
            ))}
          </div>

          {canReview && !showForm && (
            <Button variant="outline" size="sm" className="mt-6" onClick={() => setShowForm(true)}>
              Write a review
            </Button>
          )}
          {isAuthenticated && !canReview && (
            <p className="mt-6 rounded-xl bg-cream-200 px-4 py-3 text-xs leading-relaxed text-cocoa-400">
              You can review this product once your order has been delivered.
            </p>
          )}
        </div>

        <div>
          {showForm && (
            <div className="mb-8">
              <ReviewForm
                productId={product._id}
                onCancel={() => setShowForm(false)}
                onCreated={(review) => {
                  setShowForm(false);
                  setCanReview(false);
                  setReviews((current) => [review, ...current]);
                  setMeta((current) => ({ ...current, total: current.total + 1 }));
                }}
              />
            </div>
          )}

          {isLoading && reviews.length === 0 ? (
            <div className="flex justify-center py-12 text-cocoa-300">
              <Spinner />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={FiMessageSquare}
              title="No reviews yet"
              message="Be the first to tell everyone what you thought."
            />
          ) : (
            <>
              <div className={cn('divide-y divide-cream-300', isLoading && 'opacity-60')}>
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>

              {page < meta.totalPages && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isLoading}
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      load(next);
                    }}
                  >
                    Load more reviews
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;

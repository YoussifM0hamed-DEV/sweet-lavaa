import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiStar, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import Rating, { RatingInput } from '../../components/ui/Rating.jsx';
import Button from '../../components/ui/Button.jsx';
import { Textarea } from '../../components/ui/Input.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { reviewService } from '../../services/catalogService.js';
import { orderService } from '../../services/commerceService.js';
import { formatDate } from '../../utils/format.js';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ rating: 5, comment: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    Promise.allSettled([reviewService.mine(), orderService.reviewable()]).then(([mineResult, reviewableResult]) => {
      const mine = mineResult.status === 'fulfilled' ? mineResult.value.data.reviews : [];
      const reviewable = reviewableResult.status === 'fulfilled' ? reviewableResult.value.data.products : [];

      setReviews(mine);
      // Only surface products the customer received but has not reviewed yet.
      const reviewed = new Set(mine.map((review) => String(review.product?._id)));
      setPending(reviewable.filter((entry) => !reviewed.has(String(entry.product))));
      setIsLoading(false);
    });
  };

  useEffect(load, []);

  const saveEdit = async (reviewId) => {
    if (draft.comment.trim().length < 5) {
      toast.error('Please write at least a few words.');
      return;
    }

    setIsSaving(true);
    try {
      await reviewService.update(reviewId, draft);
      toast.success('Your review has been updated.');
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    try {
      await reviewService.remove(deleteTarget);
      toast.success('Your review has been removed.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl text-cocoa-800">My reviews</h1>
        <p className="mt-1 text-sm text-cocoa-400">Your honest opinion helps everyone order better.</p>
      </div>

      {pending.length > 0 && (
        <section className="card mb-6 p-6">
          <h2 className="font-display text-lg text-cocoa-800">Waiting for your review</h2>
          <p className="mt-1 text-sm text-cocoa-400">You received these. Tell everyone what you thought.</p>

          <ul className="mt-5 space-y-3">
            {pending.map((item) => (
              <li key={item.product} className="flex items-center gap-4 rounded-xl bg-cream-200/60 p-3">
                <SmartImage src={item.image} alt={item.name} width={120} className="h-14 w-14 shrink-0 rounded-lg" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-cocoa-700">{item.name}</p>
                <Button to="/account/orders" size="sm" variant="outline">
                  Find the order
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-card" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiStar}
            title="You have not written any reviews yet"
            message="Once an order has been delivered, you can review anything in it."
            actionLabel="Browse products"
            actionTo="/products"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review._id} className="card p-5">
              <div className="flex gap-4">
                <Link to={`/products/${review.product?.slug}`} className="shrink-0">
                  <SmartImage
                    src={review.product?.images?.[0]?.url}
                    alt={review.product?.name || ''}
                    width={140}
                    className="h-16 w-16 rounded-xl"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${review.product?.slug}`}
                        className="font-medium text-cocoa-800 transition-colors hover:text-caramel-700"
                      >
                        {review.product?.name}
                      </Link>
                      <p className="text-xs text-cocoa-300">Reviewed {formatDate(review.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {review.status !== 'approved' && (
                        <Badge tone={review.status === 'pending' ? 'warning' : 'danger'}>{review.status}</Badge>
                      )}
                      {editing === review._id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(review._id)}
                            disabled={isSaving}
                            aria-label="Save review"
                            className="rounded-full p-2 text-emerald-600 transition-colors hover:bg-emerald-50"
                          >
                            <FiCheck />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(null)}
                            aria-label="Cancel editing"
                            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200"
                          >
                            <FiX />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(review._id);
                              setDraft({ rating: review.rating, comment: review.comment });
                            }}
                            aria-label="Edit review"
                            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-cream-200 hover:text-cocoa-700"
                          >
                            <FiEdit2 className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(review._id)}
                            aria-label="Delete review"
                            className="rounded-full p-2 text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editing === review._id ? (
                    <div className="mt-3 space-y-3">
                      <RatingInput
                        value={draft.rating}
                        onChange={(rating) => setDraft((c) => ({ ...c, rating }))}
                        size="md"
                      />
                      <Textarea
                        value={draft.comment}
                        onChange={(event) => setDraft((c) => ({ ...c, comment: event.target.value }))}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <>
                      <Rating value={review.rating} size="xs" showValue={false} className="mt-2" />
                      {review.title && <p className="mt-2 font-semibold text-cocoa-700">{review.title}</p>}
                      <p className="mt-1 text-sm leading-relaxed text-cocoa-500">{review.comment}</p>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete this review?"
        message="It will be removed from the product page and the rating recalculated."
        confirmLabel="Delete review"
      />
    </div>
  );
};

export default Reviews;

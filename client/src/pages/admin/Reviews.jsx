import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiTrash2, FiMessageSquare, FiStar } from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Rating from '../../components/ui/Rating.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Select, Textarea } from '../../components/ui/Input.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminReviewService } from '../../services/adminService.js';
import { formatDateTime, initials } from '../../utils/format.js';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_TONE = { approved: 'success', pending: 'warning', rejected: 'danger' };

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState('all');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [replyTarget, setReplyTarget] = useState(null);
  const [reply, setReply] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setIsLoading(true);
    adminReviewService
      .list({ status, rating: rating || undefined, page, limit: 10 })
      .then((response) => {
        setReviews(response.data.reviews);
        setMeta(response.meta);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [status, rating, page]);

  const moderate = async (review, nextStatus, adminReply) => {
    setIsSaving(true);
    try {
      await adminReviewService.moderate(review._id, { status: nextStatus, ...(adminReply ? { adminReply } : {}) });
      toast.success(adminReply ? 'Reply posted.' : `Review ${nextStatus}.`);
      setReplyTarget(null);
      setReply('');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminReviewService.remove(deleteTarget._id);
      toast.success('Review deleted.');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Reviews" description={`${meta.total} review${meta.total === 1 ? '' : 's'} from customers.`}>
        <Select
          value={rating}
          onChange={(event) => {
            setRating(event.target.value);
            setPage(1);
          }}
          className="w-auto py-2 text-sm"
          aria-label="Filter by rating"
          options={[
            { value: '', label: 'All ratings' },
            { value: '5', label: '5 stars' },
            { value: '4', label: '4 stars' },
            { value: '3', label: '3 stars' },
            { value: '2', label: '2 stars' },
            { value: '1', label: '1 star' },
          ]}
        />
      </AdminPageHeader>

      <Tabs
        tabs={TABS}
        active={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-card" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiStar}
            title="No reviews here"
            message="Try another tab or rating filter."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <SmartImage
                    src={review.product?.images?.[0]?.url}
                    alt={review.product?.name || ''}
                    width={120}
                    className="h-14 w-14 shrink-0 rounded-xl"
                  />

                  <div className="min-w-0">
                    <Link
                      to={`/products/${review.product?.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-cocoa-800 hover:text-caramel-700"
                    >
                      {review.product?.name}
                    </Link>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Rating value={review.rating} size="xs" showValue={false} />
                      <span className="text-xs text-cocoa-300">
                        {review.user?.firstName} {review.user?.lastName} · {formatDateTime(review.createdAt)}
                      </span>
                      {review.isVerifiedPurchase && <Badge tone="success">Verified</Badge>}
                    </div>
                  </div>
                </div>

                <Badge tone={STATUS_TONE[review.status] || 'neutral'}>{review.status}</Badge>
              </div>

              {review.title && <h3 className="mt-4 font-semibold text-cocoa-700">{review.title}</h3>}
              <p className="mt-1.5 text-sm leading-relaxed text-cocoa-500">{review.comment}</p>

              {review.adminReply?.message && (
                <div className="mt-4 rounded-xl border-l-2 border-caramel-400 bg-cream-200/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-caramel-700">Our reply</p>
                  <p className="mt-1 text-sm text-cocoa-500">{review.adminReply.message}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-cream-300 pt-4">
                {review.status !== 'approved' && (
                  <Button size="sm" variant="outline" icon={FiCheck} onClick={() => moderate(review, 'approved')}>
                    Approve
                  </Button>
                )}
                {review.status !== 'rejected' && (
                  <Button size="sm" variant="outline" icon={FiX} onClick={() => moderate(review, 'rejected')}>
                    Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={FiMessageSquare}
                  onClick={() => {
                    setReplyTarget(review);
                    setReply(review.adminReply?.message || '');
                  }}
                >
                  {review.adminReply?.message ? 'Edit reply' : 'Reply'}
                </Button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(review)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-cocoa-300 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </article>
          ))}

          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} className="pt-6" />
        </div>
      )}

      <Modal isOpen={Boolean(replyTarget)} onClose={() => setReplyTarget(null)} title="Reply to this review">
        <p className="rounded-xl bg-cream-200/70 p-4 text-sm italic text-cocoa-500">
          &ldquo;{replyTarget?.comment}&rdquo;
        </p>

        <Textarea
          label="Your reply"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Thank them, or address the issue directly. This is public."
          rows={4}
          className="mt-5"
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setReplyTarget(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => moderate(replyTarget, replyTarget.status, reply)}
            isLoading={isSaving}
            disabled={!reply.trim()}
          >
            Post reply
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete this review?"
        message="The product rating will be recalculated. Reject it instead if you only want to hide it."
        confirmLabel="Delete review"
      />
    </div>
  );
};

export default Reviews;

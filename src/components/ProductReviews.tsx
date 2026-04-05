import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, CheckCircle, ThumbsUp, Loader, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import reviewService from '../services/review.service';
import { ProductReview } from '../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState<{ canReview: boolean; reason?: string } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
    if (user) {
      checkReviewEligibility();
    }
  }, [productId, user]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getProductReviews(productId),
        reviewService.getReviewStats(productId)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReviewEligibility = async () => {
    setCheckingEligibility(true);
    try {
      const response = await reviewService.canReviewProduct(productId);
      setCanReview(response);
    } catch (error) {
      console.error('Failed to check review eligibility:', error);
      setCanReview({ canReview: false, reason: 'error' });
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Please login to leave a review');
      return;
    }

    if (!newReview.comment.trim()) {
      showError('Please write a review');
      return;
    }

    setSubmitting(true);
    const loadingToast = showLoading('Submitting review...');

    try {
      await reviewService.createReview({
        productId,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: []
      });
      dismissToast(loadingToast);
      showSuccess('Review submitted successfully!');
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', comment: '' });
      loadReviews();
      checkReviewEligibility();
    } catch (error: any) {
      dismissToast(loadingToast);
      const errorMessage = error.response?.data?.message || 'Failed to submit review';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size: number = 4, interactive: boolean = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onStarClick?.(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}`}
          >
            <Star
              className={`w-${size} h-${size} ${
                star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Stats Summary */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">{renderStars(Math.round(stats.averageRating))}</div>
            <div className="text-sm text-gray-500 mt-1">Based on {stats.totalReviews} reviews</div>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[5 - rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-8">{rating} ★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12">{count}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowReviewForm(true)}
            disabled={!canReview?.canReview}
            className={`px-6 py-2.5 rounded-xl font-semibold transition ${
              canReview?.canReview
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Write a Review
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      {review.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(review.createdAt)}
                </div>
              </div>
              {review.title && (
                <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
              )}
              <p className="text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
              <button
                className="flex items-center gap-1 mt-3 text-sm text-gray-400 hover:text-red-600 transition"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpfulCount})
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
              <button onClick={() => setShowReviewForm(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Title (Optional)</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
                <textarea
                  rows={4}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
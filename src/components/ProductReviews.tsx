import React, { useState, useEffect } from 'react';
import { Star, StarHalf, ThumbsUp, Flag, User, Calendar, CheckCircle, Camera, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import reviewService from '../services/review.service';
import { ProductReview, ReviewStats } from '../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

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

  const getSortedReviews = () => {
    let filtered = [...reviews];
    
    if (filterRating) {
      filtered = filtered.filter(r => r.rating === filterRating);
    }
    
    switch(sortBy) {
      case 'helpful':
        return filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
      case 'highest':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return filtered.sort((a, b) => a.rating - b.rating);
      case 'recent':
      default:
        return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        images: newReview.images
      });
      dismissToast(loadingToast);
      showSuccess('Review submitted successfully!');
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', comment: '', images: [] });
      loadReviews();
    } catch (error) {
      dismissToast(loadingToast);
      showError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    if (!user) {
      showError('Please login to mark as helpful');
      return;
    }
    
    try {
      await reviewService.markHelpful(reviewId);
      loadReviews();
    } catch (error) {
      showError('Failed to mark as helpful');
    }
  };

  const renderStars = (rating: number, size: number = 5, showNumber: boolean = false) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-${size} h-${size} ${
                i < fullStars ? 'text-yellow-400 fill-yellow-400' :
                i === fullStars && hasHalfStar ? 'text-yellow-400 fill-yellow-400' :
                'text-gray-200'
              }`}
            />
          ))}
        </div>
        {showNumber && (
          <span className="text-sm font-medium text-gray-700 ml-2">{rating.toFixed(1)}</span>
        )}
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Stats Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">{renderStars(stats.averageRating, 5, false)}</div>
            <div className="text-sm text-gray-500 mt-1">Based on {stats.totalReviews} reviews</div>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[5 - rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className="w-full flex items-center gap-3 group"
                >
                  <span className="text-sm w-8">{rating} ★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${filterRating === rating ? 'bg-red-600' : 'bg-yellow-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12">{count}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md shadow-red-200"
          >
            Write a Review
          </button>
        </div>
      </div>

      {/* Filters */}
      {reviews.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {filterRating && (
              <button
                onClick={() => setFilterRating(null)}
                className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm flex items-center gap-1"
              >
                {filterRating} ★
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {getSortedReviews().length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {filterRating ? `No ${filterRating}-star reviews yet` : 'No reviews yet. Be the first to review this product!'}
            </p>
          </div>
        ) : (
          getSortedReviews().map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-100 to-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{review.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, 4)}
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
                <h4 className="font-semibold text-gray-900 mt-3 text-lg">{review.title}</h4>
              )}
              <p className="text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
              
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:scale-105 transition cursor-pointer"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
              
              <button
                onClick={() => handleMarkHelpful(review.id)}
                className="flex items-center gap-1 mt-4 text-sm text-gray-500 hover:text-red-600 transition group"
              >
                <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition" />
                Helpful ({review.helpfulCount})
              </button>
            </div>
          ))
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating })}
                      className="focus:outline-none transition-transform hover:scale-110"
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
                <textarea
                  rows={4}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
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
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Star, MessageSquare, User, Calendar, Loader2, Smile, Frown, Meh } from 'lucide-react';
import { motion } from 'framer-motion';

const ReviewsList = ({ queueId }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await api.get(`/api/vendor/${queueId}/reviews`);
        setReviews(data);
      } catch (error) {
        console.error('Failed to fetch reviews');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [queueId]);

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const avg = getAverageRating();

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-6">
        <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex flex-col items-center justify-center text-amber-500 mb-4">
                <span className="text-3xl font-black">{avg}</span>
                <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-2 h-2 ${s <= Math.round(avg) ? 'fill-amber-500' : 'text-amber-200'}`} />
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Customer Satisfaction</h3>
                <p className="text-xs text-slate-500 mt-1">Based on {reviews.length} reviews</p>
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 w-full">
            <div className="flex-1 min-w-[100px] bg-emerald-50 px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 text-emerald-600">
                <Smile className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm">{reviews.filter(r => r.rating >= 4).length}</span>
            </div>
            <div className="flex-1 min-w-[100px] bg-red-50 px-4 py-3 rounded-2xl flex items-center justify-center space-x-2 text-red-600">
                <Frown className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm">{reviews.filter(r => r.rating <= 2).length}</span>
            </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-10 text-center text-slate-400 italic text-sm">
            No feedback yet.
          </div>
        ) : (
          reviews.map((review, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={review._id} 
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{review.userId?.name || 'Anonymous'}</h4>
                    <div className="flex shrink-0">
                      {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-100'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {review.feedback && (
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 text-xs italic flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{review.feedback}</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[9px] text-slate-300 uppercase tracking-widest font-bold">Counter: {review.calledByCounter || 'N/A'}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsList;

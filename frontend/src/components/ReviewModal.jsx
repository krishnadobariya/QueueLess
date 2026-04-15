import React, { useState } from 'react';
import { Star, X, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const ReviewModal = ({ entry, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating');

    setIsSubmitting(true);
    try {
      await api.patch(`/api/customer/entries/${entry._id}/review`, { rating, feedback });
      toast.success('Thank you for your feedback!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition text-slate-400"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Rate your visit</h2>
          <p className="text-slate-500">How was your experience at {entry.queueId.name}?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Star Rating */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform active:scale-90"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  className={`w-12 h-12 transition-colors ${
                    (hover || rating) >= star 
                      ? 'fill-amber-400 text-amber-400' 
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest">Your Comments</label>
            <textarea
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] transition"
              placeholder="What could we do better?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>SUBMIT FEEDBACK</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ReviewModal;

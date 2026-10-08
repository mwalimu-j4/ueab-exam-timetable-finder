import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Star, X, CheckCircle } from 'lucide-react';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (stars: number, comment?: string) => Promise<void>;
  onDismiss: () => void;
}

const EMOJI_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const EMOJI_ICONS = ['😞', '😐', '🙂', '😊', '🤩'];

export function RatingDialog({ open, onOpenChange, onSubmit, onDismiss }: RatingDialogProps) {
  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleSubmit = async () => {
    if (selectedStars === null) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedStars, comment.trim() || undefined);
      setShowThankYou(true);
      setTimeout(() => {
        onOpenChange(false);
        setShowThankYou(false);
        setSelectedStars(null);
        setComment('');
      }, 2000);
    } catch (error) {
      console.error('Rating submission error:', error);
      setIsSubmitting(false);
    }
  };

  const handleMaybeLater = () => {
    onDismiss();
    onOpenChange(false);
  };

  const displayStars = hoveredStars ?? selectedStars ?? 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[200]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] bg-white dark:bg-[#1E1633] rounded-2xl shadow-xl max-w-md w-[90vw] p-6"
          aria-describedby="rating-dialog-description"
        >
          {showThankYou ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Thank you!
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your feedback helps us improve
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                  How was your experience?
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              <p id="rating-dialog-description" className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                We'd love to hear about your experience using the UEAB Exam Timetable Finder
              </p>

              {/* Star rating */}
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(stars => (
                  <button
                    key={stars}
                    onClick={() => setSelectedStars(stars)}
                    onMouseEnter={() => setHoveredStars(stars)}
                    onMouseLeave={() => setHoveredStars(null)}
                    onFocus={() => setHoveredStars(stars)}
                    onBlur={() => setHoveredStars(null)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded"
                    aria-label={`${stars} star${stars !== 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        stars <= displayStars
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Emoji label */}
              {selectedStars !== null && (
                <div className="text-center mb-6">
                  <span className="text-3xl mb-1 block">{EMOJI_ICONS[selectedStars - 1]}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {EMOJI_LABELS[selectedStars - 1]}
                  </span>
                </div>
              )}

              {/* Optional comment */}
              <div className="mb-6">
                <label htmlFor="rating-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Any comments? (optional)
                </label>
                <textarea
                  id="rating-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 300))}
                  placeholder="Tell us what you think..."
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none bg-white dark:bg-[#140E24] text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {comment.length}/300
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleMaybeLater}
                  disabled={isSubmitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Maybe later
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedStars === null || isSubmitting}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-brand-gradient text-white rounded-xl font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

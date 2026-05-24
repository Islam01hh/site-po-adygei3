import React, { useState } from "react";
import { Review, UserProfile } from "../types";
import { Star, MessageSquare, Trash2, Calendar, User, EyeOff } from "lucide-react";

interface ReviewListProps {
  sightId: string;
  reviews: Review[];
  currentUser: UserProfile | null;
  onAddReview: (rating: number, text: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

export default function ReviewList({
  sightId,
  reviews,
  currentUser,
  onAddReview,
  onDeleteReview,
}: ReviewListProps) {
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const sightReviews = reviews.filter((r) => r.sightId === sightId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    setIsSubmitting(true);
    setErrorLocal(null);

    try {
      await onAddReview(rating, reviewText);
      setReviewText("");
      setRating(5);
    } catch (err: any) {
      console.error(err);
      setErrorLocal(err.message || "Ошибка отправки отзыва. Пожалуйста, убедитесь, что вы авторизованы.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id={`review_section_${sightId}`} className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <MessageSquare className="w-5 h-5 text-teal-600" />
        <h3 className="font-display font-bold text-base text-slate-800">
          Отзывы путешественников ({sightReviews.length})
        </h3>
      </div>

      {/* Write review form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3" id="review_submit_form">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Ваша оценка:</span>
            
            {/* Interactive Stars select */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="transition focus:outline-none"
                  id={`review_star_selector_${star}`}
                >
                  <Star
                    className={`w-6 h-6 transition ${
                      star <= (hoverRating ?? rating)
                        ? "text-amber-400 fill-amber-400 scale-110"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              {rating} / 5
            </span>
          </div>

          <div>
            <textarea
              required
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Поделитесь вашим впечатлением об этой локации: как добирались, что больше всего зацепило..."
              className="w-full bg-white border border-slate-200 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              maxLength={1500}
              id="review_input_textarea"
            />
          </div>

          {errorLocal && (
            <p className="text-xs text-red-500 font-semibold bg-red-50 p-2 rounded-lg">
              ⚠️ {errorLocal}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={currentUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                alt=""
                className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs text-slate-500 font-medium">От имени {currentUser.displayName}</span>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !reviewText.trim()}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition"
              id="btn_publish_review"
            >
              {isSubmitting ? "Публикация..." : "Отправить отзыв"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-2xl text-center">
          <EyeOff className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500">
            Войдите в аккаунт или включите демонстрационный доступ администратора, чтобы написать отзыв.
          </p>
        </div>
      )}

      {/* Reviews list feed */}
      {sightReviews.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          Пока никто не оставил отзывов об этой локации. Будьте первыми!
        </div>
      ) : (
        <div className="space-y-3.5">
          {sightReviews.map((rev) => {
            const isAuthor = currentUser && rev.userId === currentUser.uid;
            const formattedDate = rev.createdAt 
              ? new Date(rev.createdAt).toLocaleDateString("ru-RU", { month: "long", day: "numeric" })
              : "Недавно";

            return (
              <div
                key={rev.id}
                className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition duration-200"
                id={`review_item_${rev.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {rev.userName}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5" title={`${rev.rating} звёзд`}>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Star
                          key={num}
                          className={`w-3.5 h-3.5 ${
                            num <= rev.rating 
                              ? "text-amber-400 fill-amber-400" 
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    {isAuthor && rev.id && (
                      <button
                        onClick={() => onDeleteReview(rev.id!)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition ml-1"
                        title="Удалить мой отзыв"
                        id={`delete_own_review_${rev.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-xs md:text-sm leading-relaxed mt-2.5 whitespace-pre-line pl-0.5">
                  {rev.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

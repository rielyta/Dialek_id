import { useState } from "react";

export default function FeedbackCard({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating === 0 && !comment.trim()) {
      setErrorMessage("Rating bintang dan komentar wajib diisi terlebih dahulu.");
      return;
    }

    if (rating === 0) {
      setErrorMessage("Silakan pilih rating bintang terlebih dahulu.");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Silakan tuliskan komentar ulasan terlebih dahulu.");
      return;
    }

    setErrorMessage("");
    if (onSubmit) {
      onSubmit({
        rating,
        comment: comment.trim(),
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full bg-[#e9f5ee]/85 backdrop-blur-sm rounded-3xl shadow-md px-6 py-12 sm:px-14 sm:py-16 flex flex-col items-center justify-center gap-7"
    >
      {/* 5 Bintang Rating */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoveredRating || rating);
            return (
              <button
                key={star}
                type="button"
                aria-label={`Beri ${star} bintang`}
                onClick={() => {
                  setRating(star);
                  if (errorMessage) setErrorMessage("");
                }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform duration-150 hover:scale-110 focus:outline-none cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-11 h-11 sm:w-14 sm:h-14 transition-colors duration-150"
                  fill={isActive ? "#facc15" : "none"}
                  stroke="#234d36"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          if (errorMessage) setErrorMessage("");
        }}
        placeholder="Tuliskan komentar"
        rows={4}
        required
        className="w-full max-w-md rounded-2xl bg-[#c2ded7] border border-[#2b543e] px-5 py-4 text-sm sm:text-base text-gray-800 placeholder:text-gray-600/80 resize-none focus:outline-none focus:ring-2 focus:ring-green-700"
      />

      {/* Validasi */}
      {errorMessage && (
        <p className="text-sm font-medium text-red-700 text-center -mt-3">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        className="bg-gradient-to-b from-[#6ab054] to-[#236332] hover:from-[#5ea149] hover:to-[#1b5027] text-white font-semibold text-base sm:text-lg px-12 py-2.5 rounded-xl shadow-md transition cursor-pointer"
      >
        Kirim
      </button>
    </form>
  );
}
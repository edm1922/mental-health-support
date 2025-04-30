"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { quotes } from "@/lib/quotes";
import { useUser } from "@/utils/useUser";

export default function QuoteBubble({ onClose }) {
  const [quote, setQuote] = useState("");
  const { profile } = useUser();
  const userName = profile?.display_name?.split(' ')[0] || '';

  useEffect(() => {
    // Get a random quote when the component mounts
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  return (
    <motion.div
      className="w-64 bg-white text-gray-800 text-sm rounded-2xl shadow-2xl p-5 z-40 border border-indigo-100 transition-opacity duration-700 ease-in-out pointer-events-auto"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: [1, 1.02, 1],
        boxShadow: [
          "0 4px 6px rgba(0, 0, 0, 0.1)",
          "0 8px 20px rgba(91, 104, 246, 0.3)",
          "0 4px 6px rgba(0, 0, 0, 0.1)"
        ]
      }}
      exit={{ opacity: 0, y: 5, scale: 0.98 }}
      transition={{
        duration: 0.7,
        scale: {
          duration: 1.2,
          repeat: 1,
          repeatType: "reverse"
        },
        boxShadow: {
          duration: 1.5,
          repeat: 1,
          repeatType: "reverse"
        }
      }}
      onClick={onClose}
    >
      {/* Speech bubble triangle pointing down to the assistant icon */}
      <div className="after:absolute after:bottom-[-8px] after:right-6 after:w-4 after:h-4 after:bg-white after:rotate-45 after:border-r after:border-b after:border-indigo-100"></div>

      <div className="flex items-start mb-2">
        <svg className="w-5 h-5 text-indigo-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L9.758 4.03c0 0-.218.052-.597.144C8.97 4.222 8.737 4.278 8.472 4.345c-.271.05-.56.187-.882.312C7.272 4.799 6.904 4.895 6.562 5.123c-.344.218-.741.4-1.091.692C5.132 6.116 4.723 6.377 4.421 6.76c-.33.358-.656.734-.909 1.162C3.219 8.33 3.02 8.778 2.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C2.535 17.474 4.338 19 6.5 19c2.485 0 4.5-2.015 4.5-4.5S8.985 10 6.5 10zM17.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L20.758 4.03c0 0-.218.052-.597.144-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162C14.219 8.33 14.02 8.778 13.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C13.535 17.474 15.338 19 17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10z" />
        </svg>
        <p className="italic font-serif text-indigo-800 leading-relaxed text-base">
          {userName ? `Hi ${userName}, remember: ` : ''}{quote}
        </p>
      </div>
    </motion.div>
  );
}

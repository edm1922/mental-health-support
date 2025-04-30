"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "This platform has been a lifeline for me. The daily check-ins help me track my progress, and the community support is incredible. I don't feel alone anymore.",
    author: "Sarah J.",
    role: "Member for 8 months",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg"
  },
  {
    quote: "As someone dealing with anxiety, having access to professional counselors and resources has made a huge difference. I've learned so many coping strategies that actually work.",
    author: "Michael T.",
    role: "Member for 1 year",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg"
  },
  {
    quote: "The community here is so supportive and understanding. It's a safe space where I can share my struggles without judgment and get advice from people who truly understand.",
    author: "Emily R.",
    role: "Member for 6 months",
    avatar: "https://randomuser.me/api/portraits/women/17.jpg"
  },
  {
    quote: "I was skeptical at first, but the counseling sessions have been transformative. My counselor really listens and has helped me develop practical strategies for managing my depression.",
    author: "David L.",
    role: "Member for 9 months",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg"
  },
  {
    quote: "The daily check-ins have helped me identify patterns in my mood that I never noticed before. Now I can take proactive steps when I see warning signs.",
    author: "Jessica M.",
    role: "Member for 3 months",
    avatar: "https://randomuser.me/api/portraits/women/45.jpg"
  }
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };
  
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Hear from Our Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real stories from people who have found support on their mental health journey
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 -mt-6 -ml-6 h-24 w-24 rounded-full bg-blue-200 opacity-50 blur-xl"></div>
          <div className="absolute bottom-0 right-0 -mb-6 -mr-6 h-24 w-24 rounded-full bg-indigo-200 opacity-50 blur-xl"></div>
          
          {/* Testimonial card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative z-10 border border-blue-100"
            key={activeIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center">
              <div className="mb-6">
                <svg className="h-12 w-12 text-blue-300" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
              </div>
              
              <p className="text-xl md:text-2xl text-gray-700 text-center mb-8 italic">
                "{testimonials[activeIndex].quote}"
              </p>
              
              <div className="flex items-center">
                <img 
                  src={testimonials[activeIndex].avatar} 
                  alt={testimonials[activeIndex].author} 
                  className="h-14 w-14 rounded-full object-cover border-2 border-blue-200"
                />
                <div className="ml-4 text-left">
                  <p className="font-semibold text-gray-900">{testimonials[activeIndex].author}</p>
                  <p className="text-gray-500 text-sm">{testimonials[activeIndex].role}</p>
                </div>
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="absolute bottom-6 right-6 flex space-x-2">
              <button 
                onClick={prevTestimonial}
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Previous testimonial"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextTestimonial}
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                aria-label="Next testimonial"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
          
          {/* Testimonial indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-3 w-3 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-blue-600' : 'bg-blue-200'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CounselorRecruitmentCTA from './CounselorRecruitmentCTA';

// Simple landing page navbar with minimal navigation
const LandingNavbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex-shrink-0">
            <span className="text-white text-xl font-bold">Mental Health Support</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-6">
            <Link
              href="/account/signin"
              className="text-white hover:text-blue-200 transition-colors px-3 py-2 text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/account/signup"
              className="ml-2 bg-white text-blue-700 hover:bg-blue-50 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Hero section with strong CTA
const Hero = () => (
  <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 text-white pt-24">
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-10">
      <svg className="h-full w-full" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    {/* Decorative circles */}
    <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
    <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-96 w-96 rounded-full bg-indigo-600 opacity-20 blur-3xl"></div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          className="text-center lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-4">
            Your Mental Health Matters
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Take a Step Toward <span className="text-blue-300">Feeling Better</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto lg:mx-0">
            Talk to a counselor, check in with yourself, or connect with others who care. Your journey to better mental health starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/account/signup"
              className="px-8 py-3 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-center"
            >
              Start Your Journey
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3 rounded-xl bg-blue-700/30 backdrop-blur-sm text-white font-semibold hover:bg-blue-700/50 transition-colors border border-white/20 text-center"
            >
              Learn More
            </a>
          </div>

          <p className="mt-4 text-blue-200 text-sm">
            No credit card required. Start your journey today.
          </p>
        </motion.div>

        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-3xl blur-xl transform scale-95"></div>
            <img
              src="/images/hero-illustration.svg"
              alt="Mental health support illustration"
              className="relative z-10 w-full h-auto max-w-lg mx-auto"
            />
          </div>
        </motion.div>
      </div>
    </div>

    {/* Wave divider */}
    <div className="relative bottom-0 left-0 right-0">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
        <path
          fill="#ffffff"
          fillOpacity="1"
          d="M0,192L60,197.3C120,203,240,213,360,208C480,203,600,181,720,181.3C840,181,960,203,1080,208C1200,213,1320,203,1380,197.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        ></path>
      </svg>
    </div>
  </div>
);

// Features section
const Features = () => {
  const features = [
    {
      icon: "🧠",
      title: "Daily Check-ins",
      description: "Track your mood and mental well-being with our easy-to-use daily check-in tool."
    },
    {
      icon: "👥",
      title: "Supportive Community",
      description: "Connect with others who understand what you're going through."
    },
    {
      icon: "👩‍⚕️",
      title: "Professional Counseling",
      description: "Book sessions with licensed mental health professionals."
    },
    {
      icon: "📚",
      title: "Resource Library",
      description: "Access guides and tools for managing anxiety, depression, and stress."
    },
    {
      icon: "🛡️",
      title: "Crisis Support",
      description: "Get immediate help during difficult moments with our crisis resources."
    },
    {
      icon: "🔒",
      title: "Privacy & Security",
      description: "Your mental health journey is private and secure with us."
    }
  ];

  return (
    <section className="py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Your Mental Health Journey
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform provides comprehensive tools and resources to support your mental well-being
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// How it works section
const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description: "Create your free account in less than a minute. No credit card required."
    },
    {
      number: "02",
      title: "Complete Your Profile",
      description: "Tell us a bit about yourself so we can personalize your experience."
    },
    {
      number: "03",
      title: "Start Your Check-ins",
      description: "Begin tracking your mental well-being with our simple daily check-ins."
    },
    {
      number: "04",
      title: "Connect & Grow",
      description: "Access resources, join the community, or book a session with a counselor."
    }
  ];

  return (
    <section className="py-20 bg-gray-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting started is easy - begin your mental health journey in just a few steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {/* Step number */}
              <div className="text-6xl font-bold text-blue-100 mb-4">{step.number}</div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 right-0 w-full h-0.5 bg-blue-100 transform translate-x-1/2">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-blue-300"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/account/signup"
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50"
          >
            Start Your Journey Today
          </Link>
        </div>
      </div>
    </section>
  );
};

// Testimonials section
const Testimonials = () => {
  const testimonials = [
    {
      quote: "This platform has been a lifeline for me during difficult times. I don't feel alone anymore.",
      author: "Sarah J."
    },
    {
      quote: "As someone dealing with anxiety, having access to these resources has made a huge difference.",
      author: "Michael T."
    },
    {
      quote: "The community here is so supportive and understanding. It's a safe space where I can share.",
      author: "Emily R."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Members Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real stories from people who have found support on their mental health journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="mb-4 text-blue-400">
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
              <p className="font-semibold text-gray-900">— {testimonial.author}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA section
const FinalCTA = () => (
  <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Mental Health Journey?</h2>
      <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
        Join thousands of others who have taken the first step toward better mental well-being.
      </p>
      <Link
        href="/account/signup"
        className="px-8 py-4 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-lg"
      >
        Sign Up Free
      </Link>
      <p className="mt-4 text-blue-200 text-sm">
        No credit card required. Start your journey today.
      </p>
    </div>
  </section>
);

// Footer
const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Mental Health Support</h3>
          <p className="text-sm">
            Your partner on the journey to better mental well-being.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4">COMPANY</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Our Team</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4">LEGAL</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4">CONNECT</h4>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-gray-800 text-sm">
        <p>© {new Date().getFullYear()} Mental Health Support. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// Main landing page component
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CounselorRecruitmentCTA />
      <Footer />
    </div>
  );
}

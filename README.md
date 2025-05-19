# Healmate Platform

A comprehensive web application for mental health support, counseling, and community engagement. This platform connects users with counselors, provides mental health check-ins, and offers a supportive community forum.

## Features

- **User Authentication**: Secure login and registration system
- **User Dashboard**: Personalized dashboard for users to track their mental health journey
- **Counselor Portal**: Dedicated interface for counselors to manage sessions and patients
- **Admin Dashboard**: Comprehensive admin tools for platform management
- **Mental Health Check-ins**: Regular mood tracking and journaling
- **Counseling Sessions**: Schedule and conduct video or text-based counseling sessions
- **Community Forum**: Moderated discussion space for peer support
- **Real-time Messaging**: Secure communication between users and counselors
- **AI Assistant**: Emotion-aware AI assistant powered by DeepSeek-V3
- **Inspirational Quotes**: Periodic motivational quotes for mental wellness
- **Would You Rather Game**: Interactive mental health-themed game for self-reflection

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Video Calls**: Daily.co API integration
- **AI Integration**: DeepSeek-V3 via GitHub AI API
- **Deployment**: Vercel-ready configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/edm1922/healmate.git
cd healmate
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GITHUB_TOKEN=your_github_token_for_deepseek_api
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Database Setup

Refer to the [SUPABASE-SETUP.md](./SUPABASE-SETUP.md) file for detailed instructions on setting up your Supabase database.

## Deployment

### Deploying to Vercel

This project is configured for easy deployment on Vercel:

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy

Alternatively, you can use the Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel
```

### Manual Deployment

To build the application for production:

```bash
npm run build
npm start
```

## Documentation

- [Database Schema](./docs/database-schema.md)
- [Database Management](./docs/database-management.md)
- [Authentication Fix](./AUTHENTICATION_FIX.md)

## AI Features

### Emotion AI Assistant

The platform includes an AI assistant powered by DeepSeek-V3 that can:
- Detect emotions in user messages
- Provide empathetic responses based on detected emotions
- Offer mental health support and resources
- Launch the "Would You Rather" game on request

### Inspirational Quotes

Periodic motivational quotes appear to users:
- Quotes are displayed in speech bubbles near the assistant icon
- Quotes appear on page load and at regular intervals
- Each quote is designed to provide encouragement and support

### Would You Rather Game

An interactive game that helps users reflect on their mental health preferences:
- Presents users with two self-care or mental health options
- Shows community statistics after selection
- Provides insights about what choices might reveal about coping styles
- Can be launched from the AI assistant or appears periodically

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React Framework
- [TailwindCSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Supabase](https://supabase.io/) - The open source Firebase alternative
- [Framer Motion](https://www.framer.com/motion/) - A production-ready motion library for React
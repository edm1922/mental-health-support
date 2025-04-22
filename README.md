# Mental Health Support Platform

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

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Video Calls**: Daily.co API integration
- **Deployment**: Vercel-ready configuration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/edm1922/mental-health-support.git
cd mental-health-support
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React Framework
- [TailwindCSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Supabase](https://supabase.io/) - The open source Firebase alternative
- [Framer Motion](https://www.framer.com/motion/) - A production-ready motion library for React
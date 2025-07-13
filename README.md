# Qentai - Next.js Anime & Movie Streaming Platform

Qentai is a modern, feature-rich streaming platform template built with the latest web technologies. It provides a complete solution for creating a high-performance, aesthetically pleasing, and easy-to-manage anime and movie streaming website. This script is perfect for developers looking to launch their own streaming service with a robust admin panel and AI-powered features.

## ✨ Key Features

- **Modern Tech Stack**: Built with Next.js 15 (App Router), React, and TypeScript.
- **Sleek UI/UX**: Styled with Tailwind CSS and ShadCN UI for a beautiful, responsive, and customizable user interface.
- **Powerful Admin Panel**: A comprehensive dashboard to manage content, users, spotlight features, and site-wide theme settings.
- **AI-Powered Recommendations**: Integrated with Google's Genkit to provide intelligent anime recommendations to users.
- **Flexible Content Management**:
    - Import content directly from TMDB (The Movie Database).
    - Manually add and edit anime, movies, episodes, and video sources.
- **User Authentication & Profiles**: Secure user login/registration system using Firebase Authentication, with customizable user profiles.
- **Dynamic Content**:
    - Featured content carousels and spotlight sliders on the homepage.
    - Advanced browsing and filtering by genre, type, and more.
- **Ready for Deployment**: Optimized for deployment on Vercel or any Node.js supported hosting.

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- Node.js (v18.x or later)
- npm or yarn
- A Firebase project for authentication, Firestore database, and storage.
- A TMDB API key for importing content.
- A Google AI API Key for Genkit features.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/qentai.git
    cd qentai
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add the necessary Firebase and API keys. You can use the `.env` file as a template.

    ```env
    # Firebase Configuration (replace with your project's credentials)
    NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=1:...
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-...

    # TMDB API Key (for importing content)
    NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

    # Google AI API Key (for Genkit)
    GOOGLE_API_KEY=your_google_ai_api_key

    # Admin Account Email (for owner role)
    NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@example.com
    ```

### Running the Application

1.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

2.  **Run the Genkit development server (for AI features):**
    In a separate terminal, run:
    ```bash
    npm run genkit:watch
    ```

## 📦 Deployment

This project is optimized for deployment on Vercel, the platform from the creators of Next.js.

-   **Automatic Deployment**: Simply connect your Git repository to Vercel, and it will automatically deploy your project.
-   **Environment Variables**: Make sure to add all the environment variables from your `.env.local` file to the Vercel project settings.

For other Node.js hosting providers, you can use the following standard Next.js commands:

1.  **Build the application:**
    ```bash
    npm run build
    ```

2.  **Start the production server:**
    ```bash
    npm run start
    ```

---
Happy streaming!

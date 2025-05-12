# **App Name**: AniStream

## Core Features:

- Anime Carousel: Display Trending, Popular, and Recently Added anime using horizontal scrolling carousels with Framer Motion or GSAP for smooth transitions. Auto-scroll with manual arrow navigation and hover animations.
- Real-Time Search: Implement a real-time fuzzy search bar with anime title auto-suggestions, highlighting keywords in results. Search works across anime name, genre, and year.
- Anime Details Page: Display anime details including title, banner, cover image, year, genre(s), status (Ongoing/Completed), synopsis, average rating, and user actions: Add to Watchlist and Add to Favorites.
- Advanced premium Video Player: Implement an HTML5-based custom video player with video quality switcher (480p, 720p, 1080p), subtitle toggle (.vtt), fullscreen toggle, episode auto-play and next/prev controls, and optional picture-in-picture mode. Or you can use plyr.io library for player.
- AI Recommendation Engine: A tool that uses AI to analyze user watch history and generate personalized anime recommendations, displayed in a “Recommended for You” section on the homepage or profile.
- User System: Implement Firebase Authentication with Email/Password and Google OAuth. Logged-in users can save to Watchlist, mark Favorites, track Watch History, view personalized recommendations, and edit profile and avatar.
- Admin Panel: Admin panel fully modern for adding anime with its details and we can use image link for banner and thumbnail or we can upload and how many seasons and how much episodes which will play on the player page and in episode we will put multiple server videos link which will use iframe on the player page or we can use normal mp4,.m3u8 which will work with plyr.io and we can manage users delete id or something

## Style Guidelines:

- Background: Deep black (#000000)
- Accent: Neon green (#39FF14)
- UI Contrast: Use gray shades (#1a1a1a, #2d2d2d) for containers
- Text: Light gray/white with green hover highlights
- Modern sans-serif fonts (e.g., Inter, DM Sans)
- Large headings, readable paragraph spacing
- Emphasis on contrast and legibility in dark mode
- Mobile-first, grid-based layout using Tailwind CSS
- Sticky navbars, bottom tabs for mobile, collapsible menus
- Reusable components: AnimeCard, SeasonTabs, EpisodeList, PlayerWrapper
- Use GSAP or Framer Motion for page transitions, hover/focus interactions, lazy load effects and skeleton loaders, smooth modal and dropdown animations
- Clean, minimalist SVG icons (from Heroicons or Lucide)
- Accessible button sizes and tooltips
- Clear loading indicators and feedback states
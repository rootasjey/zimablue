
# zima blue

A modern image gallery application built with Nuxt.js and NuxtHub (Cloudflare Workers), providing fast and efficient image hosting and management. This "borderless artistic space" offers a sophisticated platform for organizing, sharing, and discovering visual content.

![zima blue screenshot](./screenshots/zimablue-screenshot-dark-2.png)

[Go to website ↗ 🌓](https://zimablue.jerem-dev.workers.dev/)

## Features

### 🖼️ Image Management
- **Drag & drop uploads** with automatic processing and variant generation
- **Multiple image variants** automatically created (xxs, xs, sm, md, lg, original)
- **Grid-based layout** with draggable and resizable image positioning
- **Image modal viewer** with smooth navigation controls
- **Statistics tracking** for views, likes, and downloads
- **Tagging system** for advanced image organization
- **Bulk operations** for efficient image management

### 📚 Collections System
- **Create and manage collections** to organize related images
- **Public/private visibility** controls for collection sharing
- **Collection cover images** and rich metadata support
- **Easy add/remove** images from collections
- **Collection analytics** and performance tracking

### 👤 User System
- **Secure authentication** with session management
- **Rich user profiles** with biography, job, location, and social links
- **Role-based access control** (user/admin permissions)
- **Personal galleries** and collection management

### 🎨 Modern UI/UX
- **Fully responsive design** optimized for all devices
- **Dark/light theme support** with smooth transitions
- **View transitions** and smooth animations
- **Customizable grid layout** (draggable, resizable components)
- **Modern component library** with consistent design system
- **Accessibility-first** approach

### ⚡ Performance & Infrastructure
- **Edge deployment** on Cloudflare Workers for global performance
- **Automatic image optimization** and CDN delivery
- **Server-side rendering** for optimal SEO
- **Progressive enhancement** with client-side interactivity

## Architecture

### Frontend Stack
- **[Nuxt.js 3](https://nuxt.com/)** - Vue.js framework with SSR/SSG capabilities
- **[UnaUI](https://unaui.com/)** - Modern, accessible component library
- **[UnoCSS](https://unocss.dev/)** - Atomic CSS framework for rapid styling
- **[Pinia](https://pinia.vuejs.org/)** - Intuitive state management
- **TypeScript** - Full type safety and enhanced developer experience

### Backend & Infrastructure
- **[NuxtHub](https://hub.nuxt.com/)** - Cloudflare Workers edge platform
- **Cloudflare D1** - Distributed SQLite database at the edge
- **Cloudflare R2** - Object storage for image assets
- **Cloudflare KV** - Key-value storage for caching and sessions
- **Cloudflare Cache** - Global edge caching for optimal performance

### Image Processing
- **[Jimp](https://github.com/jimp-dev/jimp)** - Server-side image manipulation
- **Automatic variant generation** in multiple optimized sizes
- **Custom image provider** for intelligent delivery
- **Grid layout positioning** system with persistence

## Database Schema

The application uses a well-structured SQLite database with the following key tables:

### Images Table
- **Core metadata**: name, description, slug, pathname
- **Grid positioning**: x, y coordinates with width/height
- **Statistics**: views, likes, downloads tracking
- **Variants**: JSON array of generated image sizes
- **User association**: linked to user accounts

### Collections Table
- **Collection metadata**: name, description, slug
- **Visibility controls**: public/private settings
- **Cover image**: customizable collection thumbnails
- **Statistics**: comprehensive analytics tracking

### Users Table
- **Profile information**: biography, job, location
- **Authentication**: secure password handling
- **Social links**: JSON array of social media profiles
- **Role management**: user/admin permissions

### Junction Tables
- **Collection-Image relationships**: many-to-many associations
- **Positioning**: custom ordering within collections

## Tech Stack

### Core Technologies
- **[Nuxt.js 3](https://nuxt.com/)** - The Vue.js framework for production-ready applications
- **[Vue.js 3](https://vuejs.org/)** - Progressive JavaScript framework with Composition API
- **[TypeScript](https://www.typescriptlang.org/)** - Typed JavaScript for enhanced development experience

### UI & Styling
- **[UnaUI](https://unaui.com/)** - Modern, accessible component library
- **[UnoCSS](https://unocss.dev/)** - Instant on-demand atomic CSS engine
- **[Iconify](https://iconify.design/)** - Unified icon framework with extensive icon sets

### State Management & Data
- **[Pinia](https://pinia.vuejs.org/)** - Intuitive, type-safe state management
- **[Nuxt Auth Utils](https://github.com/Atinux/nuxt-auth-utils)** - Authentication utilities for Nuxt

### Infrastructure & Deployment
- **[NuxtHub](https://hub.nuxt.com/)** - Full-stack platform on Cloudflare
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Serverless execution environment
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** - Serverless SQL database
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - Object storage compatible with S3
- **[Cloudflare KV](https://developers.cloudflare.com/kv/)** - Global key-value data store

### Image Processing & Optimization
- **[Jimp](https://github.com/jimp-dev/jimp)** - JavaScript image processing library
- **[Nuxt Image](https://image.nuxt.com/)** - Optimized image component with lazy loading
- **Custom image provider** - Tailored for Cloudflare R2 integration

### Development Tools
- **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)** - CLI for Cloudflare Workers development
- **[Grid Layout Plus](https://www.npmjs.com/package/grid-layout-plus)** - Advanced grid layout system

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Cloudflare & NuxtHub account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rootasjey/zimablue.git
```

2. Install dependencies:
```bash
cd zimablue
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Run development server:
```bash
npm run dev
```

### Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Sabil

### A Guided Islamic Transformation Platform

---

> *"Islamic learning should not feel like content consumption — it should feel like guided transformation."*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3-green)](https://supabase.com/)

---

## 🚀 Hero Section

<p align="center">
  <img src="./screenshots/hero.png" alt="Sabil Dashboard" width="100%" />
</p>

**Sabil** is a structured 365-day Islamic learning platform that guides Muslims through Quran, Seerah, reflection, and spiritual growth — not through passive content consumption, but through intentional transformation.

Built with Next.js 14, Supabase, and a deep commitment to quality Islamic education.

---

## 📖 What is Sabil?

Sabil is NOT another Quran reading app or lecture archive.

It is a **guided Islamic transformation platform** designed for:

- ✅ **Curious beginners** who want structured Islamic foundations
- ✅ **Reconnecting Muslims** returning to faith with depth
- ✅ **Serious learners** tired of surface-level content
- ✅ **Seekers** exploring Islam with an open heart

### The Core Problem We Solve

| Problem | Sabil's Solution |
|---------|------------------|
| Overwhelm: "Where do I start?" | Structured 365-day curriculum with clear daily progression |
| Knowledge doesn't stick | Reflection-first learning that connects knowledge to life |
| Learning feels passive | Guided journey with milestones, streaks, and spiritual tracking |
| No clear path | Seerah-first narrative spine that weaves Quran, Hadith, and context together |

---

## 📸 Screenshots

### Landing Page

<p align="center">
  <img src="./screenshots/landing.png" alt="Landing Page" width="100%" />
</p>

### Guided Journey Dashboard

<p align="center">
  <img src="./screenshots/dashboard.png" alt="Dashboard" width="100%" />
</p>

### Immersive Lesson Experience

<p align="center">
  <img src="./screenshots/lesson.png" alt="Lesson View" width="100%" />
</p>

### Quran with Tafsir Integration

<p align="center">
  <img src="./screenshots/quran.png" alt="Quran Reader" width="100%" />
</p>

### Reflection System

<p align="center">
  <img src="./screenshots/reflection.png" alt="Reflection" width="100%" />
</p>

### Mobile Experience

<p align="center">
  <img src="./screenshots/mobile.png" alt="Mobile" width="100%" />
</p>

---

## ✨ Key Features

### Core Experience
- 📚 **Structured Journey System** — Daily lessons that build understanding progressively
- 🎯 **Reflection-First Learning** — Questions that connect knowledge to lived experience
- 📖 **Immersive Quran** — Arabic, transliteration, multiple translations, audio recitation
- 📝 **Tafsir Integration** — Scholarly interpretation woven into verse study
- 🙏 **Hadith Connection** — Authentic hadith linked to relevant topics
- 🎬 **Audio Recitation** — Multiple reciters with synchronized highlighting

### Progress & Growth
- 📊 **Progress Tracking** — See how far you've come on your transformation journey
- 🔥 **Streak System** — Build consistency with daily momentum markers
- ⭐ **Milestone Recognition** — Celebrate genuine spiritual growth
- 📅 **Daily Intentions** — Rotating reflection prompts for heart-work

### Spiritual Atmosphere
- 🌙 **Calming UI** — Warm gold accents, subtle gradients, focused typography
- 🎯 **Focus Mode** — Distraction-free reading for deep engagement
- 📱 **Mobile-First** — Beautiful native experience on phones
- ♿ **Accessibility** — Screen reader support, high contrast, keyboard navigation

### Technical Features
- 🔐 **Supabase Auth** — Secure authentication with Google OAuth
- 🌐 **API Routes** — Cached Quran data from Al-Quran Cloud API
- 💾 **Progress Persistence** — Sync your journey across devices
- ⚡ **Performance** — Server-side rendering, optimized loading

---

## 🎯 Why It's Different

### Not a Quran Reader

Sabil is not an endless scroll of verses with no context. Every Quran passage is taught through its historical and spiritual context.

### Not a Content Library

We do not give you 1,000 videos and hope you figure it out. Every lesson exists within a structured curriculum designed by educators.

### Not Social Media

No engagement metrics, no viral content, no dopamine scrolling. We want you to **finish**, not just start.

### Instead

| Traditional Apps | Sabil |
|------------------|-------|
| Random content browsing | Structured daily curriculum |
| Information consumption | Heart-centered transformation |
| Passive reading | Active reflection |
| Isolated features | Unified learning experience |

---

## 📚 Curriculum Philosophy

### The Seerah-First Approach

Unlike traditional Islamic education that teaches Quran and Hadith in isolation, Sabil weaves them together through **Seerah** — the life of Prophet Muhammad ﷺ.

```
Seerah Event → Quran Revelation → Tafsir Explanation → Hadith Connection → Reflection
```

**Example:** When studying Surah Al-Fatiha, you learn about the Makkan period when Muslims recited it secretly — and how its meaning transformed when they moved to Madinah and recited it publicly.

### Non-Madhab Foundation

Sabil teaches universal Islamic foundations:
- ✅ Quran with full contextual understanding
- ✅ Seerah as living history
- ✅ Authentic Hadith from verified collections
- ✅ Tafsir based on early scholarly consensus
- ✅ Spiritual development and moral growth

**Phase 3 (Future):** Madhab-specific paths for those who want deeper jurisprudential study.

### Core Sources

| Area | Sources |
|------|---------|
| **Seerah** | Ibn Ishaq, Ibn Hisham, Ibn Kathir, Martin Lings |
| **Quran & Tafsir** | Ibn Kathir, Al-Qurtubi, At-Tabari, As-Sa'di, Jalalayn |
| **Hadith** | Sahih al-Bukhari, Sahih Muslim, Riyadh as-Salihin |
| **Aqidah** | Ibn Taymiyyah, Ibn al-Qayyim, Ash-Shatibi |

> 📖 **Detailed authoring methodology:** See [author_plan.pdf](author_plan.pdf)

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** — App Router, Server Components, Static Generation
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **CSS Variables** — Theme system with dark/light mode

### Backend & Database
- **Supabase** — Authentication, Database, Real-time
- **PostgreSQL** — User data, progress, reflections
- **Row Level Security** — Secure data access

### APIs & Services
- **Al-Quran Cloud API** — Quran verses, translations, audio
- **Quran.com API** — Chapter metadata, verse data

### Infrastructure
- **Vercel** — Deployment and hosting
- **Edge Runtime** — Fast global access

---

## 📂 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/              # Authenticated app routes
│   │   ├── (admin)/            # Admin dashboard
│   │   ├── api/                # API routes
│   │   └── auth/               # Auth pages
│   ├── components/             # React components
│   │   ├── journey/            # Journey-specific components
│   │   ├── quran/              # Quran reader components
│   │   └── ui/                # Shared UI components
│   ├── lib/                    # Utilities and helpers
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript definitions
├── public/                     # Static assets
└── supabase/                   # Database migrations
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_QURAN_API_KEY=your_alquran_cloud_api_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sabil.git
cd sabil

# Install dependencies
npm install

# Run development server
npm run dev
```

### Database Setup

1. Create a Supabase project
2. Run migrations from `supabase/migrations/`
3. Enable Google OAuth in Supabase Auth settings
4. Configure Row Level Security policies

### Quran API Setup

1. Get a free API key from [Al-Quran Cloud](https://alquran.cloud/api)
2. Add to environment variables

---

## 🎨 Vision & Roadmap

> *"Not content consumption. Guided transformation."*

For the complete vision and long-term roadmap, see:

- **[VISION.md](VISION.md)** — Full product vision, philosophy, and 5-year roadmap
- **[author_plan.pdf](author_plan.pdf)** — Curriculum architecture and authoring methodology

### Roadmap Highlights

**Phase 2 (Next 6 months):**
- Full 365-day curriculum expansion
- Additional translation languages (Urdu, Arabic, Turkish)
- AI-powered reflection assistance
- Advanced authoring dashboard
- Scholar review workflow system

**Phase 3 (Year 2):**
- Multiple learning paths (Beginner, Revert, Youth, Advanced)
- Madhab-specific fiqh education
- Community circles and mentorship
- Mobile app (iOS & Android)

**Phase 4+:**
- Gamified spiritual milestone systems
- Personalization engine
- International expansion

---

## 💡 Team Philosophy

### What We Believe

**Islamic education should transform hearts, not just transfer information.**

We believe:
- Learning requires **curriculum, not chaos**
- Reflection is more valuable than information
- Spiritual growth needs **structure and patience**
- Technology should serve spiritual development, not distract from it
- Everyone deserves **access to quality Islamic education**

### Our Commitment

- **Quality over quantity** — Every lesson is crafted with care
- **Authenticity first** — All content verified against primary sources
- **User dignity** — No dark patterns, no manipulation, no engagement bait
- **Long-term thinking** — This is a decades-long project, not a weekend hack

### The Vision

We envision a Muslim opening Sabil in the morning, reading a reflection prompt that makes them pause and think — really think — about their relationship with Allah. Then opening a lesson that feels relevant to that struggle. Then carrying that question through their day.

**That is transformation.**

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Al-Quran Cloud** — For providing Quranic API access
- **Quran.com** — For comprehensive Quran data
- **The Islamic Scholarly Community** — For preserving and transmitting knowledge across centuries

---

<div align="center">

**Sabil — Learn. Reflect. Transform. One day at a time.**

*Built with intention. Designed for transformation.*

</div>
# Sabil Site Map

> A visual overview of all pages and routes in the Sabil platform.

---

## Public Routes

### Landing & Marketing

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Landing Page** | Hero section, feature overview, journey preview |
| `/login` | **Sign In** | Authentication with Google or email |
| `/register` | **Sign Up** | New user registration |

---

## Authenticated App

### Primary Experience

| Route | Page | Description |
|-------|------|-------------|
| `/journey` | **Your Path** | Dashboard with daily lesson, progress, daily intention |
| `/journey/[day]` | **Lesson View** | Immersive lesson with Quran, Tafsir, Hadith, reflections |
| `/journey/reflections` | **Reflections** | Personal journal and past reflections |

### Knowledge Library

| Route | Page | Description |
|-------|------|-------------|
| `/quran` | **Quran Reader** | Full Quran with chapter navigation |
| `/quran/[id]` | **Surah View** | Individual surah with verses and translations |
| `/tafsir` | **Tafsir Browser** | Scholarly interpretation of Quran verses |
| `/hadith` | **Hadith Browser** | Authentic hadith collections |
| `/search` | **Search** | Search verses, hadith, and lessons |
| `/bookmarks` | **Bookmarks** | Saved verses and content |

### User Settings

| Route | Page | Description |
|-------|------|-------------|
| `/settings` | **Settings** | Preferences, translation, reciter selection |

### Onboarding

| Route | Page | Description |
|-------|------|-------------|
| `/onboarding` | **Welcome Flow** | Initial setup for new users |

---

## Admin Dashboard

### Curriculum Management

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | **Admin Home** | Overview and quick actions |
| `/admin/journey` | **Lesson List** | All published and draft lessons |
| `/admin/journey/new` | **Create Lesson** | New lesson authoring |
| `/admin/journey/[id]/edit` | **Edit Lesson** | Modify existing lesson content |

---

## Site Structure Visualization

```
sabil.app
│
├── 🌐 Public
│   ├── / (Landing Page)
│   ├── /login (Sign In)
│   └── /register (Sign Up)
│
├── 📚 Authenticated App
│   │
│   ├── 🎯 Primary Experience
│   │   ├── /journey (Your Path - Dashboard)
│   │   │   └── /journey/[day] (Lesson View)
│   │   └── /journey/reflections (Personal Reflections)
│   │
│   ├── 📖 Knowledge Library
│   │   ├── /quran (Quran Reader)
│   │   │   └── /quran/[id] (Surah View)
│   │   ├── /tafsir (Tafsir Browser)
│   │   ├── /hadith (Hadith Browser)
│   │   ├── /search (Search)
│   │   └── /bookmarks (Saved Content)
│   │
│   └── ⚙️ Settings
│       └── /settings (User Preferences)
│
├── 🚶 Onboarding
│   └── /onboarding (Welcome Flow)
│
└── 🔧 Admin
    ├── /admin (Admin Home)
    ├── /admin/journey (Lesson List)
    ├── /admin/journey/new (Create Lesson)
    └── /admin/journey/[id]/edit (Edit Lesson)
```

---

## Page Categories

### 📱 User-Facing Pages (7)
- Landing, Journey, Lesson, Reflections, Quran, Tafsir, Hadith

### 🔍 Utility Pages (3)
- Search, Bookmarks, Settings

### 🚪 Auth Pages (2)
- Login, Register

### 🎯 Onboarding (1)
- Onboarding Flow

### ⚙️ Admin Pages (4)
- Admin Home, Journey List, New Lesson, Edit Lesson

---

## URL Patterns

### Dynamic Routes

| Pattern | Example | Description |
|---------|---------|-------------|
| `/journey/[day]` | `/journey/1` | Individual lesson day |
| `/quran/[id]` | `/quran/1` | Individual surah |
| `/admin/journey/[id]/edit` | `/admin/journey/abc/edit` | Edit specific lesson |

---

## Navigation Flow

```
Landing → Register → Onboarding → Journey Dashboard
                                      ↓
                            Lesson → Reflections
                                      ↓
                            Quran ← Search ← Header Nav
                                      ↓
                            Tafsir, Hadith, Bookmarks
                                      ↓
                            Settings (anywhere via sidebar)
```

---

## Accessibility

All pages support:
- Keyboard navigation
- Screen reader compatibility
- Focus indicators
- ARIA labels
- Reduced motion preference

---

<div align="center">

**Sabil — Learn. Reflect. Transform. One day at a time.**

</div>
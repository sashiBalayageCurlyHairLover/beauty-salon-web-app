# Beauty Salon Web App

A Vite-powered multi-page application (MPA) scaffold for a Beauty Salon website.

## Current Pages

- `/` → Home (`src/index.html`)
- `/profile/` → Profile (`src/profile/index.html`)

## Tech Stack

- Vite (MPA setup)
- Vanilla JavaScript (ES Modules)
- Bootstrap 5
- Bootstrap Icons

## Project Structure

```text
beauty-salon-web-app/
├── src/
│   ├── components/
│   │   ├── header/
│   │   │   ├── header.html
│   │   │   ├── header.css
│   │   │   └── header.js
│   │   └── footer/
│   │       ├── footer.html
│   │       ├── footer.css
│   │       └── footer.js
│   ├── pages/
│   │   ├── index/
│   │   │   ├── index.js
│   │   │   └── index.css
│   │   └── profile/
│   │       ├── profile.js
│   │       └── profile.css
│   ├── index.html
│   └── profile/
│       └── index.html
├── package.json
└── vite.config.js
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Notes

- Navigation is shared via reusable `header` and `footer` components.
- Active nav link highlighting is handled in `src/components/header/header.js`.
- Vite is configured as an MPA in `vite.config.js`.

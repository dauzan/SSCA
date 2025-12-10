# SSCA Dashboard

**Description:** A modern Next.js app serving the SSCA dashboard UI. This repository contains the app source, configuration, and build artifacts for development and production.

**Quick Overview**
- **Framework:** Next.js (App Router)
- **Language:** JavaScript / React
- **Styling:** CSS (global styles in `app/globals.css`)

**Prerequisites**
- **Node.js:** v16.8+ recommended (use the active LTS from nodejs.org).
- **Package manager:** npm (bundled with Node) or yarn.

**Getting Started (Development)**
1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Run the development server:

	 ```bash
	 npm run dev
	 ```

3. Open the app in your browser at `http://localhost:3000` (default Next.js port).

**Build & Production**
- Create a production build:

	```bash
	npm run build
	```

- Start the production server locally:

	```bash
	npm run start
	```

**Available NPM Scripts**
- `dev`: Runs Next.js in development mode (hot reloading).
- `build`: Builds the app for production.
- `start`: Starts the Next.js production server using the built output.
- `lint` (if present): Runs project linters (check `package.json`).

**Environment Variables**
- Local env: put sensitive or environment-specific values in `.env.local` at the project root.
- Common variables to document here (examples):
	- `NEXT_PUBLIC_API_URL` — URL for the backend API.
	- `NODE_ENV` — `development` or `production` (handled by npm scripts normally).

**Project Structure (important files)**
- `app/` : Next.js App Router files
	- `app/page.jsx` — main landing page
	- `app/layout.jsx` — root layout for the app
	- `app/globals.css` — global styles
- `.next/` : Next.js build artifacts (auto-generated, usually ignored in git)
- `postcss.config.mjs` : PostCSS configuration
- `package.json` : project metadata and scripts

## 📝 License

This project is part of the SSCA (Supply Chain Carbon Analytics) initiative.

## 📧 Support

For issues, questions, or contributions, please contact the development team.

---

**Last Updated**: December 2025  
**Version**: 1.0.0


- run the dev server and report any runtime errors.


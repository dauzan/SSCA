# SSCA Dashboard

Dashboard frontend built with Next.js 16 (App Router), React 19, Tailwind CSS, and Recharts.

## Stack

- Next.js 16, React 19
- Tailwind CSS, PostCSS, Autoprefixer
- Recharts for charts
- Framer Motion for animations
- lucide-react for icons

## Requirements

- Node.js 18 or 20 (LTS)
- npm, yarn, or pnpm

## Setup

```bash
git clone <repo-url>
cd ssca-dashboard
npm install
```

Create `.env.local` in the project root and set the required variables. Do not commit this file.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server at http://localhost:3000 |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run Next.js lint |

`npm run test` is not implemented yet.

## Project Structure

- `app/`: routes, layouts, and global styles
- `public/`: static assets
- `postcss.config.mjs`: PostCSS configuration

## License

ISC

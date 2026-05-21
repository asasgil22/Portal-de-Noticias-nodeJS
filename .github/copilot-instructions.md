# Copilot Instructions for Portal de Noticias

## Project Overview
- Node.js/Express news portal with admin panel, configurable carousel, and editable branding.
- Data is stored in JSON files under `data/` (noticias, enquetes, jogos, config, plantoes).
- Static assets and HTML templates are in `public/`.
- SEO meta tags are injected server-side for all main pages.

## Key Files & Structure
- `server.js`: Main Express server, all routes and API logic.
- `data/`: Persistent data (JSON files). Schema is implicit in usage.
- `public/`: Static HTML, CSS, JS, and uploaded images (`uploads/`).
- `lib/seo.js`: SEO meta tag generation and helpers.

## Developer Workflows
- **Start locally:**
  ```bash
  npm install
  npm start
  # Access http://localhost:3000 (admin: /admin.html, login: /login.html)
  ```
- **Environment:**
  - Use `.env` for `PORT`, `SITE_URL`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD`.
  - `siteUrl` in `data/config.json` overrides env for SEO links.
- **No build step**: Pure Node.js/Express, no transpilation.
- **No test suite**: Manual testing via browser and API.

## Patterns & Conventions
- **Data access:** Use async helpers (`lerJSON`, `salvarJSON`) for all file I/O.
- **Authentication:** Session-based, only `/admin.html` and API routes require login.
- **SEO:** All HTML templates have a `<!-- PORTAL_SEO -->` placeholder for meta tags.
- **Uploads:** Images are stored in `public/uploads/` via Multer.
- **Routes:**
  - `/api/*` for admin/data APIs (see `server.js`).
  - `/noticia/:slug`, `/categoria/:slug` for public content.
  - Old URLs (`noticia.html?slug=...`) redirect to new format.
- **Configurable UI:** Most homepage and branding options are in `data/config.json`.
- **Widget layouts, carrossel models, and icons**: See sets in `server.js` for valid values.

## External Dependencies
- Express, Multer, express-session, CORS.
- No database; all persistence is file-based.

## Examples
- To add a new homepage widget, update `data/config.json` and ensure the UI reads from it.
- To add a new admin API, follow the pattern in `server.js` (protect with `exigirLoginAPI`).

## References
- See `README.md` for user-facing setup and environment details.
- See `server.js` for all business logic and conventions.

---
If you add new features, document any new conventions or workflows here.

# PrimeFinds Canada — Static Shop

This is a small static website that lists curated products and includes a lightweight admin panel to add/edit/delete products locally in the browser. The site reads `products.json` from the repository root and renders product cards on the public site.

This repository is already configured for static hosting. Below are instructions to:

- Use the admin panel to manage products
- Host the site on GitHub Pages
- Connect the repo to Netlify for continuous deployment

---

Quick local test
1. From the project root run a simple static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

2. Open the site in your browser.

Admin panel (add/edit products)
1. Open the Admin panel by visiting `http://localhost:8000/#admin` or click the Admin controls in the page.
2. Click "Add New Product" to open the modal and fill in product details.
   - Image(s): enter a single emoji or one or more image URLs separated by commas. Example:
     `https://example.com/1.jpg, https://example.com/2.jpg`
3. Save — products are saved to browser `localStorage` and will render on the public site.

Persisting changes back to the repo
- Manual: Click Export JSON to download `products.json`, then replace the file in the repo and commit & push.
- From the Admin UI (client-side): the Admin includes a GitHub upload feature that can create/update `products.json` in a repository using a GitHub Personal Access Token (PAT). To use it from the UI you must provide a PAT with repository rights. For convenience there is a code-level default (see `GITHUB_DEFAULT` in `index.html`) where you can paste a PAT and repo (for testing only).

Security note: Never store long-lived PATs in public client-side code. Embedding a PAT in `index.html` is insecure and only suitable for quick testing. For production, use a server-side flow (or GitHub Actions) to commit files safely.

Host on GitHub Pages (project site)
1. Commit and push this repository to GitHub (owner/repo).
2. In the repository on GitHub go to Settings → Pages.
3. Under "Build and deployment" choose branch `main` and folder `/ (root)` (or `gh-pages` if you prefer deploying to that branch). Save.
4. GitHub Pages will publish the static site. Your `index.html` and `products.json` in the repo root will be served.

Notes:
- If you update `products.json` (manually or via API), the site will show the new products on next load. GitHub's Pages deployments may take a few seconds to a minute to update.

Connect to Netlify (optional, for continuous deploys)
1. Create a Netlify account and click "Add new site" → "Import from Git".
2. Connect your GitHub account and select this repository.
3. Build settings: this is a static site — there is no build command.
   - Leave "Build command" empty.
   - Set "Publish directory" to `.` (root) or leave blank depending on Netlify UI. A `netlify.toml` file is included that sets `publish = "."`.
4. Deploy site. Netlify will serve the site and trigger new builds when you push to the repo.

Included files to make Netlify serve the project correctly
- `netlify.toml` — config that sets the publish directory to repository root
- `.nojekyll` — prevents GitHub Pages from running Jekyll processing on files (useful if you use files/folders starting with `_`)

Advanced / automated workflows (recommended)
- For safe automated updates of `products.json` without exposing a PAT client-side, consider one of these:
  - GitHub Actions workflow that reads a JSON from a secure place and commits to the repo.
  - A small server-side script (Node/Express) you run locally or host that accepts authenticated requests and writes `products.json` to the repo via git or the GitHub API.

If you want, I can:
- Add a small Node script that converts an exported JSON file into `products.json` and commits it to the repo (you run locally). This avoids exposing PATs in the browser.
- Add a GitHub Actions workflow scaffold for safe commits.

---

If you'd like, I can now create the optional Node helper script or a GitHub Actions workflow to automate pushing `products.json` from a safe environment. Which would you prefer?

— End

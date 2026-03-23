# Deployment (GitHub Actions)

This repo supports manual deploys to one or more servers via GitHub Actions.

## One-Time Setup

1) Add an SSH key to your GitHub repo secrets:
- Secret name: `DEPLOY_SSH_KEY`
- Value: private key that can SSH into your servers (recommended: a deploy-only key).

2) Add a host list secret:
- Secret name: `DEPLOY_HOSTS`
- Value: newline-separated hosts (examples):
  - `root@1.2.3.4`
  - `deploy@1.2.3.4`

3) Ensure each server has:
- `node`, `npm`, `pm2`, `curl`
- Target directory exists (workflow creates it): default `/var/www/peng-ip-website`
- A local `.env` and DB files as needed (workflow never syncs these)

## Deploy

GitHub -> Actions -> "Deploy (Prod)" -> Run workflow:
- `ref`: branch/tag/sha
- `app_dir`: remote dir
- `pm2_name`: pm2 process name
- `health_url`: optional (empty to skip)

## Safety

- Rsync excludes `.env*`, `*.db*`, `public/uploads/`, `node_modules/`, `.next/`.
- Remote script runs `npm ci` only when `package-lock.json` changes.
- Remote script runs `prisma generate` but does NOT migrate DB.

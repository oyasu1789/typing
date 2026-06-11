# Security

## Supported version

Security fixes are applied to the latest commit on the `main` branch.

## Reporting a vulnerability

Do not include exploit details or sensitive information in a public issue. Use GitHub's private vulnerability reporting feature when it is enabled for the repository.

## Deployment requirements

Serve the game only over HTTPS. The repository includes `_headers` for static hosting providers that support this format, including Cloudflare Pages and Netlify.

After deployment, verify that the response includes:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy`

GitHub Pages does not support repository-defined custom response headers. When using GitHub Pages, enable **Enforce HTTPS** in the repository Pages settings and retain the CSP and referrer-policy meta tags in `index.html`.


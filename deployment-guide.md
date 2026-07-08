# USize Frontend — AWS Deployment Guide

> This guide covers only the frontend static site. For the backend API and widget SDK, see their own `deployment-guide.md` in their respective project folders, or the full-stack overview at the monorepo root `deployment-guide.md`.

> **Replace every placeholder** (`yourdomain.com`, `your-frontend-bucket`, `YOUR_ACCOUNT_ID`, etc.) with your own values before running any command. Nothing here will work verbatim.

> **New to AWS?** This guide doubles as study material for the **AWS Certified Cloud Practitioner (CLF-C02)** exam — every acronym is expanded on first use, and there's a glossary plus exam-relevant callouts (marked 📘) at the exact points in this guide where each concept concretely shows up. Start with the [AWS Concepts Glossary](#aws-concepts-glossary-study-companion) below.

---

## Table of Contents

0. [AWS Concepts Glossary (study companion)](#aws-concepts-glossary-study-companion)
1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Build](#3-build)
4. [Create the S3 Bucket](#4-create-the-s3-bucket)
5. [CloudFront Distribution](#5-cloudfront-distribution)
6. [Domain & SSL](#6-domain--ssl)
7. [Deploy / Sync](#7-deploy--sync)
8. [Cache Invalidation](#8-cache-invalidation)
9. [Post-Deployment Verification](#9-post-deployment-verification)
10. [Cost Estimate](#10-cost-estimate)
11. [Troubleshooting](#11-troubleshooting)

---

## AWS Concepts Glossary (study companion)

This frontend deploy only touches a handful of AWS services, but they're a genuinely good slice of the **Cloud Technology and Services** and **Security and Compliance** domains on the CLF-C02 exam — a static site is one of the simplest real architectures you can build, so it's a clean way to learn these services without a database/compute layer muddying the picture.

### Service acronyms used in this guide

| Acronym | Full name | What it actually is | Where it shows up here |
|---|---|---|---|
| **S3** | **S**imple **S**torage **S**ervice | Object storage — files ("objects") live in "buckets," not a filesystem or database. No server to patch or manage; AWS handles durability and scaling for you | Holds the built `build/` folder — every HTML/CSS/JS file this app ships is just an object in one S3 bucket ([Section 4](#4-create-the-s3-bucket)) |
| **CloudFront** | (a CDN — Content Delivery Network; not itself an acronym) | Caches your content at edge locations physically close to visitors worldwide, and terminates HTTPS, so a shopper in Tokyo isn't fetching your JS bundle from a server in Virginia | Sits in front of the S3 bucket, serving the app over HTTPS with edge caching and the `/api/*` path-routing behavior ([Section 5](#5-cloudfront-distribution)) |
| **OAC** | **O**rigin **A**ccess **C**ontrol | The mechanism that lets a *private* S3 bucket be read only by *your specific* CloudFront distribution — not the public internet, not even you directly via a bucket URL | The reason the S3 bucket in [Section 4](#4-create-the-s3-bucket) can have zero public access yet still serve the site through CloudFront |
| **Route 53** | (named for DNS's port **53**, not an acronym) | AWS's DNS service — translates `app.yourdomain.com` into the actual CloudFront distribution it should route to | Owns the `app.yourdomain.com` alias record pointed at CloudFront ([Section 6](#6-domain--ssl)) |
| **ACM** | AWS **C**ertificate **M**anager | Issues and auto-renews free TLS/SSL certificates — no manual renewal, unlike a self-managed Let's Encrypt cert | Provides the certificate CloudFront uses to serve `https://app.yourdomain.com` ([Section 6](#6-domain--ssl)) |
| **CLI** | **C**ommand **L**ine **I**nterface | A terminal program (`aws ...`) that does anything the AWS Console does, scriptably | Every `aws s3`/`aws cloudfront`/`aws acm`/`aws route53` command in this guide |
| **TLS / SSL** | **T**ransport **L**ayer **S**ecurity / **S**ecure **S**ockets **L**ayer (SSL is the deprecated predecessor name; "SSL cert" colloquially still means a TLS cert) | The encryption protocol behind `https://` | What the ACM certificate in [Section 6](#6-domain--ssl) enables |
| **CDN** | **C**ontent **D**elivery **N**etwork | A geographically distributed network of caching servers ("edge locations") that sit between your origin and your visitors | What CloudFront *is* — see above |

### Core cloud concepts you'll actually see applied here

- **Regional vs. Global services** — the S3 bucket is **regional** (you pick `us-east-1` or wherever, and it only exists there). CloudFront, by contrast, is **global**: one distribution, but it *runs* at edge locations on every continent. The one quirk that trips people up: the ACM certificate for CloudFront must be requested in **`us-east-1` specifically**, even if your bucket lives in a different region — see the callout in [Section 5](#5-cloudfront-distribution).
- **Durability vs. Availability** — S3 is built for **11 nines (99.999999999%) durability**, meaning the odds of losing an object are vanishingly small because AWS stores redundant copies across multiple facilities. That's a different promise than *availability* (can you reach it right now) — a private bucket with zero public access, as configured in [Section 4](#4-create-the-s3-bucket), is still exactly as durable; only *how* it's reachable changed.
- **CDN / edge caching** — the entire reason [Section 5](#5-cloudfront-distribution) exists instead of just pointing the domain straight at S3: CloudFront caches your fingerprinted static assets at edge locations near each visitor, so repeat page loads are fast regardless of where in the world the visitor is, without you running any extra infrastructure.
- **Pricing models** — every cost in [Section 10](#10-cost-estimate) is **On-Demand** — no reserved capacity, no upfront commitment, pay only for what's actually stored/served. There's no compute here to reserve in the first place (no EC2/RDS), which is a big part of why this piece of the stack is so cheap.
- **CapEx vs. OpEx** — no server was bought to serve this site; you're paying a small, usage-based operating cost (S3 storage + CloudFront requests) instead of a capital purchase. This is the classic "why cloud" pitch in its simplest possible form, since there's no compute layer to add nuance.
- **Well-Architected Framework pillars** — two show up clearly in this guide: *Security* (private S3 bucket + OAC instead of the legacy public "static website hosting" bucket policy, [Section 4](#4-create-the-s3-bucket)) and *Cost Optimization* (CloudFront's free tier is generous and *perpetual*, not a 12-month trial like most AWS free tiers — see [Section 2](#2-prerequisites)).

---

## 1. Overview

This app is a Create React App (CRA) static build — a folder of HTML/CSS/JS with no server-side rendering. It's deployed the same way any static site is: a **private S3 bucket** (no public bucket policy, no "static website hosting" feature) serving as CloudFront's origin via **Origin Access Control (OAC)**, with CloudFront handling TLS termination, caching, and — critically for this app — path-based routing of `/api/*` requests through to the backend so relative API calls resolve correctly in production.

```
                     ┌─────────────────────────┐
                     │        Route 53         │
                     │   (yourdomain.com zone)  │
                     └───────────┬─────────────┘
                                 │
                          app.yourdomain.com
                                 │
                                 ▼
                       ┌───────────────────┐
                       │    CloudFront      │
                       │  two behaviors:    │
                       │  *      → S3       │
                       │  /api/* → backend  │
                       └─────────┬──────────┘
                     ┌───────────┴───────────┐
                     ▼                       ▼
           ┌───────────────────┐   ┌──────────────────────┐
           │   S3 (private,    │   │   Backend API origin  │
           │ OAC, static build)│   │ (see backend's own     │
           └───────────────────┘   │ deployment-guide.md)   │
                                    └──────────────────────┘
```

### Why this architecture

- **Private S3 + CloudFront OAC**, not the legacy public-bucket "static website hosting" feature — the bucket itself is never publicly reachable; only CloudFront can read it. This is the current AWS-recommended pattern for static sites.
- **CloudFront `/api/*` behavior pointing at the backend** — see the accuracy note in [Section 3](#3-build) for why this matters here specifically.
- **`HashRouter`** (`src/App/App.js`) — deliberate, so this static bundle needs no server-side route handling. CloudFront custom error responses (403/404 → `/index.html`) are configured anyway as a safety net (see [Section 5](#5-cloudfront-distribution)), even though hash-fragment routes never actually hit the server.

---

## 2. Prerequisites

```bash
# AWS CLI v2
aws --version                 # aws-cli/2.x
aws configure                 # Access Key ID, Secret Key, default region
aws sts get-caller-identity    # confirms credentials work

# Node.js
node --version                 # v20+ (this project's package.json requires >=20)
npm --version                  # >=11
```

- An existing or planned deployment of the backend (`Nestjs-for-Usize-Project/`) to point the `/api/*` CloudFront behavior at — see that project's own `deployment-guide.md` for how to stand it up. You need its public HTTPS origin (e.g. an Elastic Beanstalk environment domain) before finishing [Section 5](#5-cloudfront-distribution).
- A domain with a Route 53 hosted zone (see [Section 6](#6-domain--ssl)).
- IAM permissions: `AmazonS3FullAccess` (or scoped to your bucket), `CloudFrontFullAccess`, `AmazonRoute53FullAccess`, `AWSCertificateManagerFullAccess`. For a portfolio/solo project, an IAM user with `AdministratorAccess` is a reasonable shortcut — just don't use root credentials for day-to-day deploys.

**Free tier:** S3 gives 5 GB storage + 20,000 GET / 2,000 PUT requests free for 12 months. CloudFront's free tier (50 GB data transfer out + 2,000,000 requests/month) is **not** time-limited — it applies indefinitely, on every account. For a portfolio-traffic site, this piece of the stack (S3 + CloudFront) will likely cost **$0–2/month** even after the 12-month S3 free tier expires — see [Section 10](#10-cost-estimate).

---

## 3. Build

### A real accuracy note before you build

`src/context/AuthContext.js` calls the backend using a **hardcoded relative path**:

```js
const API = '/api/v1';
```

(Verified current in the source as of this writing — if you've since patched this constant, adjust the steps below to match.)

This works in local dev only because CRA's `"proxy"` field in `package.json` forwards `/api/*` to `http://localhost:3001` — but `proxy` is a **dev-server-only** feature; it does nothing in a production build. Once this static build is served from `app.yourdomain.com`, a relative `/api/v1/...` request resolves to `app.yourdomain.com/api/v1/...`, not your backend, unless you handle this one of two ways:

**Option A — CloudFront path routing (recommended, zero source changes).** Add the backend as a second CloudFront origin on this same distribution, with a `/api/*` cache behavior forwarding to it. The browser then sees everything as same-origin (`app.yourdomain.com`), so the relative path just works unmodified — and you don't even need CORS between frontend and backend for this traffic. This is what [Section 5](#5-cloudfront-distribution) sets up below, and is what the rest of this guide assumes.

**Option B — patch the constant and use an absolute URL.**

```js
const API = process.env.REACT_APP_API_URL || '/api/v1';
```

Set `REACT_APP_API_URL=https://api.yourdomain.com/api/v1` in a `.env.production` file at the project root, then rebuild. This needs the backend's `CORS_ORIGINS` allowlist to include `https://app.yourdomain.com` (a config change on the backend side, not covered here). Slightly simpler CloudFront config, at the cost of one source edit and a dependency on CORS being configured correctly.

If you go with Option B, skip the `/api/*` behavior in [Section 5](#5-cloudfront-distribution) and set the env var before building:

```bash
echo "REACT_APP_API_URL=https://api.yourdomain.com/api/v1" > .env.production
```

### Build

```bash
npm install
npm run build
# produces build/ — static HTML/CSS/JS, ready to upload as-is
```

---

## 4. Create the S3 Bucket

```bash
aws s3 mb s3://your-frontend-bucket --region us-east-1

aws s3api put-public-access-block \
  --bucket your-frontend-bucket \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

This bucket has **no public access** at all — CloudFront's Origin Access Control (configured in the next section) is the only thing allowed to read it. Do not attach a public bucket policy or enable the legacy "static website hosting" feature.

> 📘 **CCP tip — Security pillar in practice:** older tutorials have you flip on S3 "static website hosting" and attach a public-read bucket policy. This guide deliberately doesn't — a private bucket readable only via OAC has a strictly smaller attack surface (no direct public S3 URL exists at all), which is exactly the kind of "default to the more secure option unless there's a reason not to" reasoning the exam expects for the Well-Architected Framework's Security pillar.

---

## 5. CloudFront Distribution

1. **CloudFront → Create distribution.**
2. **Origin domain:** select your bucket (`your-frontend-bucket.s3.us-east-1.amazonaws.com`). The console will offer to create an **Origin Access Control (OAC)** for you — accept it, and accept the offer to auto-update the bucket policy so only this distribution can read the bucket.
3. **Default root object:** `index.html`.
4. **Viewer protocol policy:** Redirect HTTP to HTTPS.
5. **Alternate domain name (CNAME):** `app.yourdomain.com`.
6. **Custom SSL certificate:** request this in ACM first — see [Section 6](#6-domain--ssl). **Must be in `us-east-1`**, regardless of which region the rest of your stack lives in — CloudFront only accepts certs from that region.

   > 📘 **CCP tip — regional vs. global:** this is the single most-tested "gotcha" version of the regional/global distinction. CloudFront itself is global, but the ACM certificate it uses must specifically be requested in the `us-east-1` region — request it anywhere else and it simply won't show up in CloudFront's certificate picker, even though your S3 bucket can happily live in a completely different region.
7. **Error pages** — configured as a safety net, even though `HashRouter` client-side routes (fragments after `#`) never reach the server, so this isn't strictly required for routing to work:
   - HTTP error code `403` → Response page path `/index.html`, HTTP response code `200`.
   - HTTP error code `404` → Response page path `/index.html`, HTTP response code `200`.
8. **Add a second behavior for `/api/*`** (skip this step entirely if you went with Option B in [Section 3](#3-build)):
   - Add a second **origin**: your backend's public HTTPS domain (e.g. an Elastic Beanstalk environment URL — see the backend's own `deployment-guide.md` for how that gets deployed and its TLS listener configured).
   - Add a **behavior**: path pattern `/api/*`, origin = the backend origin, viewer protocol policy = HTTPS only, **cache policy = CachingDisabled**, **origin request policy = AllViewer** (forwards auth headers, cookies, and query strings through untouched — needed for the `Authorization: Bearer` header `apiFetch` sends).
   - Leave the **default (`*`) behavior** pointed at the S3 origin with a caching-enabled policy.
9. Create the distribution and wait for status **Deployed** (typically 10–20 minutes on first creation).

---

## 6. Domain & SSL

### Request the ACM certificate (must be `us-east-1`)

```bash
aws acm request-certificate \
  --domain-name app.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### Validate via DNS

```bash
aws acm describe-certificate --certificate-arn <arn> --region us-east-1 \
  --query "Certificate.DomainValidationOptions"
```

In the ACM console, each pending certificate has a **"Create records in Route 53"** button that adds the required validation CNAME automatically — use it instead of copying values by hand. Validation typically completes in 5–30 minutes; the certificate must show **Issued** before it will appear in CloudFront's certificate picker.

### Route 53 alias record

```bash
aws route53 change-resource-record-sets --hosted-zone-id Z0123456789ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "dxxxxxxxxxxxxx.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

`Z2FDTNDATAQYW2` is CloudFront's fixed, global alias hosted-zone ID — the same value for every CloudFront distribution, in every AWS account.

Verify:

```bash
dig app.yourdomain.com
```

---

## 7. Deploy / Sync

Upload the build, splitting cache headers between `index.html` (must always revalidate, since it references CRA's fingerprinted asset filenames) and the fingerprinted `static/` assets (safe to cache for a year, immutably):

```bash
aws s3 cp build/index.html s3://your-frontend-bucket/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

aws s3 sync build/static s3://your-frontend-bucket/static \
  --cache-control "public, max-age=31536000, immutable"

aws s3 sync build/ s3://your-frontend-bucket/
```

> **Warning:** Note there is no `--delete` flag on that last `sync` command. Re-run this same command after every rebuild; files removed from a new build will simply be left behind (harmless, just unused). If you want to prune stale files, first review what would be removed with a dry run:
>
> ```bash
> aws s3 sync build/ s3://your-frontend-bucket/ --dryrun --delete
> ```
>
> Only add `--delete` for a real run after confirming the dry-run output only lists files you actually expect to be gone — `--delete` removes anything in the bucket that isn't present locally, which is destructive if you ever sync from the wrong directory or an incomplete build.

---

## 8. Cache Invalidation

Because `index.html` is `no-cache`, most deploys are visible immediately. But CloudFront's own edge cache can still serve a stale `index.html` briefly, or you may want to force an immediate refresh of everything after a deploy:

```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

Run this after every `s3 sync` if you want changes to appear at all edge locations immediately rather than waiting for TTLs to expire naturally.

---

## 9. Post-Deployment Verification

```bash
curl -I https://app.yourdomain.com
# HTTP/2 200, valid cert (no browser warning)
```

- [ ] `curl -I https://app.yourdomain.com` → `200`
- [ ] Open `https://app.yourdomain.com` in a browser → no blank page, no console errors
- [ ] Dev tools → Network tab → confirm requests to `/api/v1/...` resolve to `200`/`401` (not CORS errors, not DNS failures, not 403/404 from CloudFront)
- [ ] Register a new account through the UI → confirm redirect to `#/dashboard`
- [ ] Log out, log back in → confirm the login flow round-trips through the CloudFront `/api/*` behavior (or your Option B absolute URL) correctly
- [ ] Navigate directly to a deep link, e.g. `https://app.yourdomain.com/#/pricing` → confirm it loads (validates `HashRouter` works with no server-side routing, as designed)

---

## 10. Cost Estimate

Approximate **us-east-1** monthly cost for just this component (S3 + CloudFront), assuming low/portfolio-level traffic:

| Resource | Free tier (first 12 months) | After free tier |
|---|---|---|
| S3 (one bucket, low storage/requests) | Mostly $0 (5 GB / 20k GET free) | ~$0.50–1/mo |
| CloudFront (one distribution, low traffic) | $0 (50 GB out + 2M requests free, indefinitely) | Likely still $0–1/mo unless traffic grows significantly |
| Route 53 hosted zone (if not already counted against the backend) | Not free | $0.50/mo + ~$0.40 per million queries |
| ACM certificate | Always free | Always free |
| **Estimated total** | **~$0–1/mo** | **~$1–3/mo** |

No EC2 or RDS is needed for this piece — those costs belong to the backend's deployment, not this one.

> 📘 **CCP tip — On-Demand pricing, and why this is so cheap:** there's no reserved capacity or commitment anywhere in this bill — you're billed purely for GB stored and requests served, which is why a low-traffic static site costs next to nothing. This is the simplest possible illustration of AWS's core billing idea: pay for what you actually use, not for capacity you provisioned "just in case."

---

## 11. Troubleshooting

**Blank page after deploy, but the app works locally**
- Open dev tools → Console. A blank page with no errors usually means `index.html` was uploaded but references asset paths that don't exist in `static/` — re-run the full `s3 sync build/ s3://your-frontend-bucket/` (not just the `index.html` copy) to make sure everything from the latest build actually made it up.

**CORS or "Failed to fetch" errors on `/api/v1/...` calls**
- Almost always means the CloudFront `/api/*` behavior (Option A, [Section 5](#5-cloudfront-distribution)) isn't wired up, or you patched `AuthContext.js` for Option B but forgot to rebuild/redeploy with `REACT_APP_API_URL` set in `.env.production` before `npm run build`.
- If using Option B, confirm the backend's `CORS_ORIGINS` allowlist actually includes `https://app.yourdomain.com` (exact scheme + host, no trailing slash).

**Stale JS/CSS served after a new deploy**
- Almost always a caching issue, not a deploy failure. Confirm `index.html` was uploaded with `--cache-control "no-cache, no-store, must-revalidate"` (not synced with the default cache headers), and run a CloudFront invalidation (`aws cloudfront create-invalidation --distribution-id ... --paths "/*"`, [Section 8](#8-cache-invalidation)) after the sync.

**Hash-routed URLs (e.g. `/#/dashboard`) 404 on direct load**
- Should not happen with `HashRouter`, since the browser only ever requests `/` or `/index.html` from the server — everything after `#` is resolved client-side. If you do see a 404, it's more likely CloudFront's default root object isn't set to `index.html`, or the custom error responses from [Section 5](#5-cloudfront-distribution) aren't configured. This scenario is exactly what those error-response rules exist to catch as a safety net.

**ACM certificate stuck in "Pending validation"**
- Confirm the CNAME record ACM asked for actually exists in the *correct* Route 53 hosted zone — easy to add to the wrong zone if you manage multiple domains. Use the ACM console's "Create records in Route 53" button rather than typing the record by hand.
- Remember the CloudFront cert must be requested in **`us-east-1`** specifically — a cert requested in any other region simply won't appear in CloudFront's certificate picker, regardless of where the rest of your stack (including the backend) is deployed.

# GEONOS Vietnam — COOL:TRACE Cooling Intelligence

> **Turn cooling data into verified climate action.**

COOL:TRACE is an evidence-first cooling intelligence service from GEONOS Vietnam. This static corporate site introduces the service, its Vietnam climate context, and an interactive demonstration of the workflow used to screen cooling portfolios, prioritize action, test capital and climate constraints, and prepare measurement and verification.

## Live Site

<https://geonos-ai.github.io/vietnam-cooltrace/>

The site uses client-side hash routes so each section works from a GitHub Pages project URL without server-side routing:

- Home: `#/`
- Services: `#/services`
- COOL:TRACE portfolio: `#/cooltrace/portfolio`
- COOL:TRACE assets: `#/cooltrace/assets`
- COOL:TRACE capital plan: `#/cooltrace/capital`
- COOL:TRACE climate stress: `#/cooltrace/climate`
- Vietnam Insights: `#/insights`
- About: `#/about`

## Services and Demonstration

The site presents four connected services:

- cooling portfolio screening;
- action and capital planning;
- climate stress assessment; and
- measurement and verification.

The COOL:TRACE demonstration includes facility and asset selection, an evidence-linked action view, deterministic capital optimization across five comparable actions, a bounded heat-sensitivity test, a metadata-only local data-intake preview, and access to the public competition dossier.

## Evidence Boundary

The interface uses reproducible demonstration facility records and source-linked public climate and policy data. It does not represent customer or pilot measurements and does not claim verified emissions reductions. The current release does not process document contents, run an AI or machine-learning model, persist customer data, or diagnose refrigerant leaks.

## Local Development

```bash
npm ci
npm run dev
```

Run the production and code checks with:

```bash
npm test
npm run lint
```

## Publish with GitHub Desktop

1. Add this folder as a local repository in GitHub Desktop.
2. Commit the files to the `main` branch.
3. Select **Publish repository**.
4. Use owner `geonos-ai` and repository name `vietnam-cooltrace`.
5. Make the repository public, then publish it.
6. On GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source.
7. The included workflow builds and deploys the site after every push to `main`.

The production base path is derived automatically from the GitHub repository name. Compiled assets, hash routes, and the public dossier therefore work from the project Pages URL.

## Public Repository Scope

This repository contains only the public website source and public review assets. Internal application answers, partner outreach drafts, budgets, workroom archives, and owner-confirmation materials are excluded.

# GEONOS Infrastructure — COOL:TRACE

> **Trace the evidence. Prioritize cooling action. Prove what changed.**

COOL:TRACE is a static, interactive demonstration of an evidence-first operating workflow for climate-resilient cooling portfolios in Vietnam. It connects deterministic demonstration records with public climate and policy context to show how facility teams could prioritize cooling actions, test capital constraints, and preserve measurement-and-verification boundaries.

## Live Site

After the repository is published and GitHub Pages is enabled, the site will be available at:

<https://geonos-ai.github.io/vietnam-cooltrace/>

## Demonstrated Capabilities

- portfolio and facility-level cooling action views;
- source-linked evidence and explicit claim states;
- deterministic capital optimization across five comparable actions;
- bounded heat-sensitivity testing;
- a metadata-only data-intake preview; and
- access to a pre-generated public competition dossier.

The current release does not process document contents, run an AI or machine-learning model, persist customer data, diagnose refrigerant leaks, or claim verified emissions reductions. Facility records are reproducible demonstration scenarios, not customer or pilot measurements.

## Local Development

```bash
npm ci
npm run dev
```

Validation:

```bash
npm test
npm run lint
```

## Publish with GitHub Desktop

1. Add this folder as a local repository in GitHub Desktop.
2. Commit all files to the `main` branch.
3. Select **Publish repository**.
4. Use owner `geonos-ai` and repository name `vietnam-cooltrace`.
5. Make the repository public, then publish it.
6. On GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source.
7. The included workflow builds and deploys the site after every push to `main`.

The production base path is derived automatically from the GitHub repository name, so compiled assets and the public dossier work correctly from a project Pages URL.

## Public Evidence Boundary

This repository intentionally contains only the public website source and public review assets. Internal application answers, partner outreach drafts, budgets, workroom archives, and owner-confirmation materials are excluded from this deployment repository.

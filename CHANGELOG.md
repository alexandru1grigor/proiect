# Changelog

All notable changes to the News app are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

### Changed

### Fixed

---

## [0.2.0] - 2026-09-16

### Added

- A "Super Heavy" load simulation profile: 1024 requests with ~3s of client-side work and 8,000 DOM
  rows.

### Changed

### Fixed

---

## [0.1.0] - 2026-09-16

### Added

- Hacker News reader: six feeds (`top`, `new`, `best`, `ask`, `show`, `job`) with URL-driven
  pagination, and a story detail page with metadata, author karma, body text and comment thread.
- Same-origin API layer under `/api/news/*` that reads `NEWS_API_URL` server-side at request time,
  paginates the engine's un-paginated feeds, and budgets the comment-tree fan-out.
- Sticky top navigation with a "Simulate load" control (light/moderate/heavy) that loads the pod, the
  main thread and the DOM at once, with a live progress panel.
- Anonymous visitor/session correlation ids, plus structured logging of every page view, data fetch,
  feed switch, story open, outbound click, Core Web Vital, uncaught error and load simulation.
- Prometheus metrics at `/api/metrics` (requests, engine calls, client actions, simulated load) and a
  `/api/health` probe endpoint.
- Production Docker image, CI validation, container publishing, and automated semantic releases.
  The Helm chart is deliberately absent, writing it is the workshop exercise.

### Changed

### Fixed

[Unreleased]: https://github.com/mtdtechnology-net/learning-news/compare/0.2.0...HEAD
[0.2.0]: https://github.com/mtdtechnology-net/learning-news/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/mtdtechnology-net/learning-news/releases/tag/0.1.0

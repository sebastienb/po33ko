# PO-33 KO Trainer

A portable, browser-based trainer for learning PO-33-style sampling, beatmaking,
sequencing, pattern chaining, and punch-in effects.

Open the trainer:

- `po33-primer.html` — guided lessons
- `po33-studio.html` — playable practice studio

Official PO-33 guide:
https://teenage.engineering/guides/po-33/en

## iPhone

Deploy over HTTPS, then open the site in Safari and choose **Share > Add to Home
Screen**. The app includes a web manifest and service worker so the lessons and
studio can be cached after first load.

Mic recording works best from an HTTPS URL because browser audio recording APIs
require a secure context.

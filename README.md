# DRIP — Hydration Protocol

A static multi-page front end for the DRIP "liquid asset" brand. No build step — open `index.html` in a browser, or serve the folder with any static server.

## Structure

```
drip-site/
├── index.html      Home — hero with 3D chrome can, manifesto/spec/drops teasers
├── drops.html      Full drop catalog with live/upcoming/sold-out filtering
├── protocol.html   Manifesto, spec sheet, payload table, lifecycle, FAQ
├── acquire.html    Allowlist signup form with validation + terminal log
├── 404.html        Not-found page
├── css/
│   └── style.css   Shared stylesheet (design system + all components)
└── js/
    ├── main.js     Nav, scroll reveals, drop filters, form handling
    └── scene.js    Three.js scroll-choreographed can (home page only)
```

## Notes

- Fonts (Unbounded, Space Mono) load from Google Fonts; three.js r128 from cdnjs — internet required.
- All forms are front-end only (no backend); submissions show a simulated confirmation.
- Respects `prefers-reduced-motion` and works down to mobile widths (burger nav under 860px).

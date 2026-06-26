# ABC — the RAND0M classroom

> An 11-lesson path from "what is this?" to "I just shipped a change."  
> For curious users, tinkerers, and contributors. Practical and example-driven —
> read in order, or jump to what you need.

---

## How to use this

Each lesson is short, has a **Try it** to make it real, and ends pointing at the
next one. You can do the first half (Lessons 1–6) entirely in your browser at
**rand0m.ai**. The second half (7–11) is for people who want to run and contribute.

---

### Lesson 1 — What RAND0M is
RAND0M is a single living globe at **rand0m.ai** that turns real environmental data
into one readable picture of the planet's health, with a crew of agents to explore
it through.  
**Try it:** open rand0m.ai, find the Earth globe, give it a spin.

### Lesson 2 — The Planet Health Score
One number, per region and for the whole planet, that says how healthy things look
now. It's built from nine domains and stamped with the methodology version it was
computed under.  
**Try it:** open a region and read its score; note that it's a blend, not a single
measurement.

### Lesson 3 — The nine domains
Land cover, fire, air, ocean warming, ocean acidification, cryosphere (ice),
biodiversity, conservation, and human pressure (the Anthroposphere). Some are
benefits (more is healthier), some are burdens (more is worse). The human-pressure
domain is grounded on the Global Human Modification index.  
**Try it:** toggle domains and watch how the score and colors respond.

### Lesson 4 — The six spheres
Atmosphere, hydrosphere, cryosphere, biosphere, lithosphere, anthroposphere. The
globe can be filtered and colored by each.  
**Try it:** switch the sphere filter and see the planet re-color.

### Lesson 5 — The live data layers
Wind, temperature, and storm energy from global forecast models; air quality from
CAMS; ocean temperature and currents; active fire; and **aggregated** movement
(flights/boats as density, never individual tracking).  
**Try it:** turn on the wind layer and watch it flow; switch to sea-surface
temperature.

### Lesson 6 — The agents
`rand0m`, `dai1y`, `knight1y`, `aut0mate` — a small crew, one active at a time,
that you talk to and explore the data through.  
**Try it:** set your active agent and notice the home view reflect it.

### Lesson 7 — Reading the globe like a pro
2D vs 3D, projections, the value key/scale bar, and how to tell a data layer from
a score overlay.  
**Try it:** switch between the 3D globe and the 2D map; read the scale bar on an
active layer.

### Lesson 8 — Fork & run it locally
Get the app running on your own machine: install the toolchain, fetch
dependencies, run the web build, and open it in your browser. (You won't have the
private data keys, but the app runs and degrades gracefully without them.)  
**Try it:** build the web app locally and load it.

### Lesson 9 — How data becomes a layer
The path from a public scientific source → a fetch/refresh job → a governed,
**aggregated, identity-free** data object → a layer on the globe. Governance
first: no tracking, no precise sensitive exposure.  
**Try it:** pick one layer and trace, in your head, source → globe.

### Lesson 10 — Contribute & test
File a clear request or bug, pick up a good-first issue, and run the checks before
proposing a change. See **[123 — Requests & Testing Center](https://github.com/random-knights/123)** for the
templates and the flow.  
**Try it:** file one real bug or feature using a template.

### Lesson 11 — How a change ships
Small change → automated validation → staging world → a deliberate,
human-approved release to rand0m.ai. Continuous delivery, with a human on the final
"go."  
**Try it:** follow a release note from "merged" to "live."

---

## Where next

- Ask, report, or test: **[123 — Requests & Testing Center](https://github.com/random-knights/123)**
- Earth research and data: **[xyz-earth](https://github.com/random-knights/xyz-earth)**
- Contribution ground rules: see `CONTRIBUTING.md` in this repo

# Labs

Hands-on labs for the c1assr00m lessons. Each numbered lab (01..11) is the
practice half of the matching lesson in `../lessons/`; work the lesson first,
then the lab.

Labs 01 through 10 are Markdown-only. Lab 11 is the one labeled exception: its
reproducible Python asset lives under `../assets/python/l3-agent-tool-routing/`
and reads provider keys from the environment.

## The labs

- `01-classroom-orientation.md` .. `11-agent-tool-routing-and-observability.md` - the guided
  path, one lab per lesson.
- `sandbox.md` - a free space to experiment.
- `render-media-composition.md` - the media/render composition lab.

## A note on the runnable tools

Earlier versions of this folder also held two runnable Node prototypes (a job
scorer and a nonprofit mailer). Those needed a package manager and an API key,
which is exactly the toolchain this classroom is meant to stay free of, so they
were moved to a separate, non-public tooling repo. The classroom keeps only the
lessons and labs. Lab 11 keeps its runnable implementation in `assets/python`
because provider routing and trace evidence cannot be taught honestly as a
Markdown-only exercise.

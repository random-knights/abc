# Labs

Hands-on labs for the c1assr00m lessons. Each numbered lab (01..11) is the
practice half of the matching lesson in `../lessons/`; work the lesson first,
then the lab.

Labs 01 through 10 are Markdown-only. Two self-contained Python courses live in
numbered folders: `00/agent-evals/` teaches general tool routing and evaluation,
and `01/email-evals/` applies the same architecture to draft-only campaigns.
Both read provider keys from the environment.

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
lessons and labs. The runnable courses stay isolated because provider routing
and trace evidence cannot be taught honestly as Markdown-only exercises. The
email course uses a labeled synthetic fixture and has no send tool.

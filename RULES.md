# SNOTE project rules

- SNOTE is a student study app. Keep the current modular monolith: React/Vite client, Express/TypeScript API, PostgreSQL/Prisma.
- Preserve feature modules, API contracts, request validation, and per-user ownership checks. Avoid new architecture layers without a concrete need.
- Check the existing stack and browser/Node APIs before adding a dependency. Prefer tools already in use and remove redundant ones when safe.
- Keep shared frontend enums/contracts in `packages/shared/src`; backend types currently come from Prisma.
- For interface work, use `.agents/skills/ux-ui-pro/SKILL.md` and consult `.agents/skills/ui-ux-pro-max/SKILL.md` for focused UX guidance. Reuse React, CSS, and Lucide before adding UI libraries.
- Update `ARCHITECTURE.md` when commands or system boundaries change. Do not create checklists or AI memory files unless requested.
- Never commit secrets or local `.env` files.

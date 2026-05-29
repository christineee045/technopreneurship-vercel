Monorepo apps wrappers

- `apps/admin` — wrapper that installs and builds the existing Frontend Admin project located at `Frontend Admin/`.
- `apps/user` — wrapper that installs and builds the root frontend (this repo's root `package.json` + `src/`).

Deploy tips:

- In Vercel, create two projects and set their root to `apps/admin` and `apps/user` respectively.
- Alternatively, from the repository root run `npm run build:all` to build both locally.

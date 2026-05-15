# AGENTS

## Non-negotiable

- Zero failing/flaky tests
- Zero compiler errors or warnings
- Use `bun` for everything
- Run `bun compile` before and after changes
- Run `bun oxlint --fix` after changes
- Run `bun oxfmt --write` after changes
- Follow existing code and tests codestyle
- Search docs related to your task inside `.repos/*`

## Read the docs

- For local project docs read from `rfc/` folder
- Libraries docs, code and examples specific for your task inside `.repos/`
- Files under `.repos/` are read-only
- Check `.repos/` for up-to-date documentation
- Check `bun` docs `node_modules/bun-types/docs/**.mdx`

## RFC Workflow

- Use `0000-rfcs.md` as base
- Decisions are inmmutable
- Checks are for you to audit RFC status
- Checks passing marks status as `done`

## Typescript

- Use `@/*` aboslute paths
- Never use `as`, `any` or any other type holes
- Zero unused/dead types or exports
- Do not add speculative type aliases
- Export only symbols used outside the file
- Remove dead types/exports in the same change that makes them unused

## Effect code

- Make tiny, composable programs
- Use `effect-best-practices` skill
- Find `.repos/effect` docs related to your task
- No globals in app logic, use injected services
- Write idiomatic effect code taken from doc examples

## Testing

**CRITICAL**

- Tests can never pollute console output
- Spies are forbidden `spyOn|mock` and such
- Lifecycle hooks are forbidden `before<All|Each>|after<All|Each>`

**RULES**

- Use TDD approach
- Write tests **first**
- Then write code to **make them pass**
- Use `bun test` to run tests
- Use `tests/effect.test.ts` as an example

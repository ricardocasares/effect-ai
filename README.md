# Effect AI Starter

Simple starter project for building a terminal AI chat app with:

- `effect`
- `@effect/ai`
- `@effect/ai-openai`
- Bun runtime

## Environment

Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=INFO
LOG_PRETTY=false
```

## Install

```bash
bun install
```

## Start

```bash
bun run src/index.ts
```

Type `/exit` to quit.

## Validate

```bash
bun compile
```

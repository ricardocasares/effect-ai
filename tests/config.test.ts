import { expect, test } from "bun:test";
import { ConfigProvider, Effect, LogLevel, Redacted } from "effect";
import { AppConfig } from "@/config";

const withEnv = <A>(env: Record<string, string>, effect: Effect.Effect<A, unknown>) =>
  effect.pipe(Effect.withConfigProvider(ConfigProvider.fromMap(new Map(Object.entries(env)))));

test("config defaults", async () => {
  const result = await Effect.runPromise(withEnv({ OPENAI_API_KEY: "k" }, AppConfig));
  expect(result.logPretty).toBe(false);
  expect(result.logLevel).toBe(LogLevel.Info);
  expect(result.openAiApiUrl).toBe("https://api.openai.com/v1");
  expect(result.openAiModel).toBe("gpt-4o-mini");
});

test("config parses LOG_PRETTY=true", async () => {
  const result = await Effect.runPromise(
    withEnv({ OPENAI_API_KEY: "k", LOG_PRETTY: "true" }, AppConfig),
  );
  expect(result.logPretty).toBe(true);
});

test("config parses LOG_LEVEL", async () => {
  const result = await Effect.runPromise(
    withEnv({ OPENAI_API_KEY: "k", LOG_LEVEL: "DEBUG" }, AppConfig),
  );
  expect(result.logLevel).toBe(LogLevel.Debug);
});

test("config reads OPENAI_API_KEY, OPENAI_API_URL and OPENAI_MODEL", async () => {
  const result = await Effect.runPromise(
    withEnv(
      {
        OPENAI_API_KEY: "abc",
        OPENAI_API_URL: "http://localhost:11434/v1",
        OPENAI_MODEL: "gpt-4o-mini",
      },
      AppConfig,
    ),
  );

  expect(Redacted.value(result.openAiApiKey)).toBe("abc");
  expect(result.openAiApiUrl).toBe("http://localhost:11434/v1");
  expect(result.openAiModel).toBe("gpt-4o-mini");
});

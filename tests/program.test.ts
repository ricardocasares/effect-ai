import { expect, test } from "bun:test";
import { Array, ConfigProvider, Effect, Layer, Ref } from "effect";
import * as Console from "effect/Console";
import { ConfigService } from "@/config";
import { InputService, program } from "@/program";

const testConfigProvider = ConfigProvider.fromMap(
  new Map([
    ["OPENAI_API_KEY", "test"],
    ["OPENAI_API_URL", "https://api.openai.com/v1"],
    ["OPENAI_MODEL", "gpt-4o-mini"],
    ["LOG_LEVEL", "INFO"],
    ["LOG_PRETTY", "false"],
  ]),
);

const TestConsole = (linesRef: Ref.Ref<string[]>) =>
  Effect.gen(function* () {
    const baseConsole = yield* Effect.console;
    return Console.setConsole({
      ...baseConsole,
      log: (...args: ReadonlyArray<unknown>) =>
        Ref.update(linesRef, (lines) =>
          Array.appendAll(
            lines,
            args.map((value) => `${value}`),
          ),
        ),
    });
  }).pipe(Layer.unwrapEffect);

test("program exits on /exit", async () => {
  const [calls, lines] = await Effect.runPromise(
    Effect.gen(function* () {
      const countRef = yield* Ref.make(0);
      const linesRef = yield* Ref.make(Array.empty<string>());

      yield* program.pipe(
        Effect.provide(
          Layer.succeed(InputService, {
            readLine: () =>
              Ref.updateAndGet(countRef, (n) => n + 1).pipe(Effect.map(() => "/exit")),
          }),
        ),
        Effect.provide(ConfigService.Default),
        Effect.withConfigProvider(testConfigProvider),
        Effect.provide(TestConsole(linesRef)),
      );

      const calls = yield* Ref.get(countRef);
      const lines = yield* Ref.get(linesRef);
      return [calls, lines] as const;
    }),
  );

  expect(calls).toBe(1);
  expect(lines).toEqual(["simple ai chat. type /exit to quit.", "bye."]);
});

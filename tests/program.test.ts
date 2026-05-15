import { expect, test } from "bun:test";
import { Array, Effect, Layer, Mailbox, Ref, Scope, Stream } from "effect";
import { Terminal } from "@effect/platform";
import { Chat, LanguageModel } from "@effect/ai";
import { program } from "@/program";

const TestTerminal = (countRef: Ref.Ref<number>, linesRef: Ref.Ref<string[]>) =>
  Layer.succeed(Terminal.Terminal, {
    columns: Effect.succeed(80),
    rows: Effect.succeed(24),
    isTTY: Effect.succeed(true),
    readInput: Effect.gen(function* () {
      yield* Scope.Scope;
      return yield* Mailbox.make<Terminal.UserInput>();
    }),
    readLine: Ref.updateAndGet(countRef, (n) => n + 1).pipe(Effect.map(() => "/exit")),
    display: (text: string) => Ref.update(linesRef, (lines) => Array.appendAll(lines, [text])),
  });

const chatLayer = Effect.gen(function* () {
  const languageModel = yield* LanguageModel.make({
    generateText: () => Effect.succeed([]),
    streamText: () => Stream.empty,
  });
  const chat = yield* Chat.empty.pipe(
    Effect.provide(Layer.succeed(LanguageModel.LanguageModel, languageModel)),
  );
  return Layer.mergeAll(
    Layer.succeed(Chat.Chat, chat),
    Layer.succeed(LanguageModel.LanguageModel, languageModel),
  );
}).pipe(Layer.unwrapEffect);

test("program exits on /exit", async () => {
  const [calls, lines] = await Effect.runPromise(
    Effect.gen(function* () {
      const countRef = yield* Ref.make(0);
      const linesRef = yield* Ref.make(Array.empty<string>());

      yield* program.pipe(
        Effect.provide(chatLayer),
        Effect.provide(TestTerminal(countRef, linesRef)),
      );

      const calls = yield* Ref.get(countRef);
      const lines = yield* Ref.get(linesRef);
      return [calls, lines] as const;
    }),
  );

  expect(calls).toBe(1);
  expect(lines).toEqual(["simple ai chat. type /exit to quit.\n", "you> ", "bye.\n"]);
});

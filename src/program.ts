import { Chat } from "@effect/ai";
import { Terminal } from "@effect/platform";
import { Effect, Stream } from "effect";

const ask = (prompt: string) =>
  Effect.gen(function* () {
    const chat = yield* Chat.Chat;
    const terminal = yield* Terminal.Terminal;

    yield* terminal.display("\nai> ");
    yield* chat
      .streamText({ prompt })
      .pipe(
        Stream.runForEach((part) => {
          if (part.type === "text-delta") {
            return terminal.display(part.delta);
          }

          if (part.type === "finish") {
            return terminal.display("\n");
          }

          return Effect.void;
        }),
      )
      .pipe(
        Effect.catchTags({
          HttpRequestError: () => terminal.display("network error, please retry.\n"),
          HttpResponseError: () => terminal.display("openai request failed.\n"),
          MalformedInput: () => terminal.display("invalid input sent to model.\n"),
          MalformedOutput: () => terminal.display("invalid response from model.\n"),
          UnknownError: () => terminal.display("unexpected ai error.\n"),
        }),
      );
  });

const chatLoop = Effect.gen(function* () {
  const terminal = yield* Terminal.Terminal;

  while (true) {
    yield* terminal.display("you> ");
    const inputLine = yield* terminal.readLine.pipe(
      Effect.catchTag("QuitException", () => Effect.succeed("/exit")),
    );
    const trimmed = inputLine.trim();

    if (trimmed === "/exit") {
      yield* terminal.display("bye.\n");
      return;
    }

    yield* ask(trimmed);
  }
});

export const program = Effect.gen(function* () {
  const terminal = yield* Terminal.Terminal;

  yield* terminal.display("simple ai chat. type /exit to quit.\n");
  yield* chatLoop;
});

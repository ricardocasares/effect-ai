import { Chat } from "@effect/ai";
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai";
import { FetchHttpClient } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { Console, Context, Effect, Layer, Stream } from "effect";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ConfigService } from "@/config";

export class InputService extends Context.Tag("@/InputService")<
  InputService,
  {
    readonly readLine: (label: string) => Effect.Effect<string | null>;
  }
>() {}

const InputLive = Layer.succeed(InputService, {
  readLine: (label: string) =>
    Effect.acquireUseRelease(
      Effect.sync(() => createInterface({ input, output })),
      (rl) => Effect.promise(() => rl.question(label)),
      (rl) => Effect.sync(() => rl.close()),
    ),
});

const ask = (prompt: string) =>
  Effect.gen(function* () {
    const chat = yield* Chat.Chat;

    yield* Effect.sync(() => process.stdout.write("ai> "));
    yield* chat.streamText({ prompt }).pipe(
      Stream.runForEach((part) => {
        if (part.type === "text-delta") {
          return Effect.sync(() => process.stdout.write(part.delta));
        }

        if (part.type === "finish") {
          return Effect.sync(() => process.stdout.write("\n"));
        }

        return Effect.void;
      }),
    );
  }).pipe(
    Effect.catchTags({
      HttpRequestError: () => Console.error("network error, please retry."),
      HttpResponseError: () => Console.error("openai request failed."),
      MalformedInput: () => Console.error("invalid input sent to model."),
      MalformedOutput: () => Console.error("invalid response from model."),
      UnknownError: () => Console.error("unexpected ai error."),
    }),
  );

const chatLoop = Effect.gen(function* () {
  const input = yield* InputService;

  while (true) {
    const line = yield* input.readLine("you> ");
    const trimmed = (line ?? "").trim();

    if (trimmed === "/exit") {
      yield* Console.log("bye.");
      return;
    }

    yield* ask(trimmed);
  }
});

const aiLayer = Effect.gen(function* () {
  const config = yield* ConfigService;
  return Layer.mergeAll(
    Layer.succeed(Chat.Chat, yield* Chat.empty),
    OpenAiLanguageModel.layer({ model: config.openAiModel }).pipe(
      Layer.provideMerge(
        OpenAiClient.layer({
          apiKey: config.openAiApiKey,
          apiUrl: config.openAiApiUrl,
        }).pipe(Layer.provideMerge(BunContext.layer), Layer.provideMerge(FetchHttpClient.layer)),
      ),
    ),
  );
}).pipe(Layer.unwrapEffect);

export const program = Console.log("simple ai chat. type /exit to quit.").pipe(
  Effect.zipRight(chatLoop),
  Effect.provide(aiLayer),
);

export const InputServiceLive = InputLive;

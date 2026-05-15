import { Chat } from "@effect/ai";
import { FetchHttpClient } from "@effect/platform";
import { BunRuntime, BunTerminal } from "@effect/platform-bun";
import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai";
import { Effect, Layer, Logger } from "effect";
import { ConfigService } from "@/config";
import { program } from "@/program";

const aiLayer = Effect.gen(function* () {
  const config = yield* ConfigService;
  return Layer.mergeAll(
    Layer.succeed(Chat.Chat, yield* Chat.empty),
    OpenAiLanguageModel.layer({ model: config.openAiModel }).pipe(
      Layer.provideMerge(
        OpenAiClient.layer({
          apiKey: config.openAiApiKey,
          apiUrl: config.openAiApiUrl,
        }).pipe(Layer.provideMerge(FetchHttpClient.layer)),
      ),
    ),
  );
}).pipe(Layer.unwrapEffect);

const main = Effect.gen(function* () {
  const config = yield* ConfigService;
  const withLevel = program.pipe(
    Effect.provide(aiLayer),
    Effect.provide(BunTerminal.layer),
    Logger.withMinimumLogLevel(config.logLevel),
  );

  if (config.logPretty) {
    yield* withLevel.pipe(Effect.provide(Logger.pretty));
    return;
  }

  yield* withLevel;
});

BunRuntime.runMain(main.pipe(Effect.provide(ConfigService.Default)));

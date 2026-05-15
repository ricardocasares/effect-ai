import { Effect, Logger } from "effect";
import { ConfigService } from "@/config";
import { InputServiceLive, program } from "@/program";

const main = Effect.gen(function* () {
  const config = yield* ConfigService;
  const withLevel = program.pipe(
    Effect.provide(InputServiceLive),
    Logger.withMinimumLogLevel(config.logLevel),
  );

  if (config.logPretty) {
    yield* withLevel.pipe(Effect.provide(Logger.pretty));
    return;
  }

  yield* withLevel;
});

await Effect.runPromise(main.pipe(Effect.provide(ConfigService.Default)));

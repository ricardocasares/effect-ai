import { expect, test } from "bun:test";
import { Queue, Effect, TestClock, Fiber, Option, TestContext, Clock, Deferred } from "effect";

// EXAMPLES OF HOW TO TEST EFFECT CODE!

// A recommended pattern when using the TestClock is to fork the effect being tested,
// adjust the clock time as needed, and then verify that the expected outcomes have occurred.
test("simulate timeout with test clock", async () => {
  const run = Effect.gen(function* () {
    // Create a fiber that sleeps for 5 minutes and then times out
    // after 1 minute
    const fiber = yield* Effect.sleep("5 minutes").pipe(
      Effect.timeoutTo({
        duration: "1 minute",
        onSuccess: Option.some,
        onTimeout: () => Option.none<void>(),
      }),
      Effect.fork,
    );

    // Adjust the TestClock by 1 minute to simulate the passage of time
    yield* TestClock.adjust("1 minute");

    // Get the result of the fiber
    const result = yield* Fiber.join(fiber);

    // Check if the result is None, indicating a timeout
    expect(Option.isNone(result)).toBe(true);
  }).pipe(Effect.provide(TestContext.TestContext));

  return Effect.runPromise(run);
});

// In this example, we test an effect that runs at regular intervals.
// An unbounded queue is used to manage the effects, and we verify the following:
// - No effect occurs before the specified recurrence period.
// - An effect occurs after the recurrence period.
// - The effect executes exactly once.
test("test fixed intervals", async () => {
  const run = Effect.gen(function* () {
    const q = yield* Queue.unbounded();

    yield* Queue.offer(q, undefined).pipe(
      // Delay the effect for 60 minutes and repeat it forever
      Effect.delay("60 minutes"),
      Effect.forever,
      Effect.fork,
    );

    // Check if no effect is performed before the recurrence period
    const a = yield* Queue.poll(q).pipe(Effect.andThen(Option.isNone));

    // Adjust the TestClock by 60 minutes to simulate the passage of time
    yield* TestClock.adjust("60 minutes");

    // Check if an effect is performed after the recurrence period
    const b = yield* Queue.take(q).pipe(Effect.as(true));

    // Check if the effect is performed exactly once
    const c = yield* Queue.poll(q).pipe(Effect.andThen(Option.isNone));

    // Adjust the TestClock by another 60 minutes
    yield* TestClock.adjust("60 minutes");

    // Check if another effect is performed
    const d = yield* Queue.take(q).pipe(Effect.as(true));
    const e = yield* Queue.poll(q).pipe(Effect.andThen(Option.isNone));

    // Ensure that all conditions are met
    expect(a && b && c && d && e).toBe(true);
  }).pipe(Effect.provide(TestContext.TestContext));

  return Effect.runPromise(run);
});

// This example demonstrates how to test the behavior of the Clock using the TestClock:
test("simulate time with clock", async () => {
  const run = Effect.gen(function* () {
    // Get the current time using the Clock
    const startTime = yield* Clock.currentTimeMillis;

    // Adjust the TestClock by 1 minute to simulate the passage of time
    yield* TestClock.adjust("1 minute");

    // Get the current time again
    const endTime = yield* Clock.currentTimeMillis;

    // Check if the time difference is at least
    // 60,000 milliseconds (1 minute)
    expect(endTime - startTime >= 60_000).toBe(true);
  }).pipe(Effect.provide(TestContext.TestContext));

  return Effect.runPromise(run);
});

// The TestClock also impacts asynchronous code scheduled to run after a specific time.
test("simulate delayed execution", async () => {
  const run = Effect.gen(function* () {
    // Create a deferred value
    const deferred = yield* Deferred.make<number, void>();

    // Run two effects concurrently: sleep for 10 seconds and succeed
    // the deferred with a value of 1
    yield* Effect.all([Effect.sleep("10 seconds"), Deferred.succeed(deferred, 1)], {
      concurrency: "unbounded",
    }).pipe(Effect.fork);

    // Adjust the TestClock by 10 seconds
    yield* TestClock.adjust("10 seconds");

    // Await the value from the deferred
    const readRef = yield* Deferred.await(deferred);

    // Verify the deferred value is correctly set
    expect(readRef === 1).toBe(true);
  }).pipe(Effect.provide(TestContext.TestContext));

  return Effect.runPromise(run);
});

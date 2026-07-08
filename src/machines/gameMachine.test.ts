import { beforeEach, describe, expect, test, vi } from "vitest";
import { createActor, type ActorRefFrom } from "xstate";
import { gameMachine } from "./gameMachine";
import { GAME_TIME_SECS, INITIAL_SCORE } from "../constants";

describe("game machine actor", () => {
  let gameActor: ActorRefFrom<typeof gameMachine>;

  beforeEach(() => {
    vi.stubGlobal("window", { addEventListener: () => {} });
    gameActor = createActor(gameMachine);
    gameActor.start();
  });

  test("should initially be in playing state with proper initial score and countdown time when game starts", () => {
    const initialSnapshot = gameActor.getSnapshot();
    expect(initialSnapshot.matches("playing")).toBe(true);
    expect(initialSnapshot.context.score).toBe(INITIAL_SCORE)
    expect(initialSnapshot.context.timeRemainingSecs).toBe(GAME_TIME_SECS)
  });
});

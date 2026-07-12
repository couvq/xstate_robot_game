import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createActor, type ActorRefFrom } from "xstate";
import { gameMachine, type Position } from "./gameMachine";
import { GAME_TIME_SECS, INITIAL_SCORE } from "../constants";

describe("game machine actor", () => {
  let gameActor: ActorRefFrom<typeof gameMachine>;

  beforeEach(() => {
    vi.stubGlobal("window", { addEventListener: () => {} });
    vi.useFakeTimers()
    gameActor = createActor(gameMachine);
    gameActor.start();
  })
  
  afterEach(() => {
    vi.clearAllMocks();
  })

  test("should initially be in playing state with proper initial score and countdown time when game starts", () => {
    const initialSnapshot = gameActor.getSnapshot();
    expect(initialSnapshot.matches("playing")).toBe(true);
    expect(initialSnapshot.context.score).toBe(INITIAL_SCORE);
    expect(initialSnapshot.context.timeRemainingSecs).toBe(GAME_TIME_SECS);
  });

  test("should update score when collision is detected", () => {
    // force robot and candy to be next to each other on the board, initial position is determined at random so need to make this deterministic
    const initialRobotPos: Position = [0, 0]
    const initialCandyPos: Position = [0, 1]
    gameActor.getSnapshot().context.robotPosition = initialRobotPos;
    gameActor.getSnapshot().context.candyPosition = initialCandyPos;
    expect(gameActor.getSnapshot().context.score).toBe(0)
    gameActor.send({ type: "move", direction: "right" }); 
    expect(gameActor.getSnapshot().context.robotPosition).toEqual(initialCandyPos) // collision
    // candy position is reset after collision, guaranteed not to be in the same position as the robot 
    expect(gameActor.getSnapshot().context.robotPosition).not.toEqual(gameActor.getSnapshot().context.candyPosition)
    expect(gameActor.getSnapshot().context.score).toBe(1)
  });

  test('game should finish once time runs out', () => {
    expect(gameActor.getSnapshot().context.timeRemainingSecs).toBeGreaterThan(0)
    expect(gameActor.getSnapshot().matches('playing')).toBe(true)
    vi.advanceTimersByTime(GAME_TIME_SECS * 1000)
    expect(gameActor.getSnapshot().matches('finished')).toBe(true)
    expect(gameActor.getSnapshot().context.timeRemainingSecs).toBe(0)
  })
});

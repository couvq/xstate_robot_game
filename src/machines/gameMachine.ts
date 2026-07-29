import { assign, createActor, setup } from "xstate";
import { gameTimeActor, robotActor } from "../actors";
import { BOARD_SIZE, GAME_TIME_SECS, INITIAL_SCORE } from "../constants";
import type { GameContext, GameEvent, MoveRobotEvent } from "../types";
import { LEVEL_CONFIGS, levelValid } from "../utils/levelConfigs";
import { collidesWithAny, getInitialRobotPosition, getNewCandyPosition, getNextPosition, hasCollision } from "../utils/positionUtils";

const createInitialContext = (currentLevel?: number): GameContext => {
  const wallPositions =
    currentLevel !== undefined
      ? LEVEL_CONFIGS[currentLevel].wallPositions
      : LEVEL_CONFIGS[0].wallPositions;
  const robotPos = getInitialRobotPosition(wallPositions);
  const candyPos = getNewCandyPosition(robotPos, wallPositions);
  return {
    robotPosition: robotPos,
    candyPosition: candyPos,
    wallPositions,
    level: currentLevel ?? 0,
    score: INITIAL_SCORE,
    timeRemainingSecs: GAME_TIME_SECS,
  };
};

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    isValidMove: ({ context, event }) => {
      const potentialNextPosition = getNextPosition(
        context,
        event as MoveRobotEvent
      );

      const wouldHitWall = collidesWithAny(
        potentialNextPosition,
        context.wallPositions
      );

      return (
        !wouldHitWall &&
        potentialNextPosition[0] >= 0 &&
        potentialNextPosition[0] < BOARD_SIZE &&
        potentialNextPosition[1] >= 0 &&
        potentialNextPosition[1] < BOARD_SIZE
      );
    },
    isGameOver: ({ context }) => context.timeRemainingSecs <= 0,
    isNextLevelValid: ({ context }) => levelValid(context.level + 1),
  },
  actions: {
    updateRobotPosition: assign({
      robotPosition: ({ context, event }) =>
        getNextPosition(context, event as MoveRobotEvent),
    }),
    checkCollisions: assign(({ context }) => {
      if (hasCollision(context.robotPosition, context.candyPosition)) {
        return {
          score: context.score + 1,
          candyPosition: getNewCandyPosition(
            context.robotPosition,
            context.wallPositions
          ),
        };
      }

      return {};
    }),
    decrementGameTime: assign({
      timeRemainingSecs: ({ context }) => context.timeRemainingSecs - 1,
    }),
    resetGame: assign(() => createInitialContext()),
    incrementLevel: assign(({ context }) =>
      createInitialContext(context.level + 1)
    ),
  },
  actors: {
    robotActor,
    gameTimeActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAbFAngJYB2UAxGgPYBuYA2gAwC6io2VsRALkVSWxAAPRADZGmAKyiATABYAnKMmSAjAGZGShQBoQBRKoDsRzAsnrVqgByM76mbfUBfZ3tQYc+YmXIBjKgBXEm4IKgB3EiZWJBAOLl5+QREEUVVMUVE5RlEHI1VJIwUZVT0DBGt0xQUa0SNrbLlJeVd3dCw8QlIKaMF4nj4BWJTHCSNGSwLRYoUjRVEyxHUjSUxVLWX1c0ZrNVFWkA8sADNSIlgAC0hyACc4bhQb7l7Y-sSh0BSHdUx1SQV1HVrJVrOI-osEA45BkNtZltlRNYSgcjphTiRzlcIOQSGAhNwADJgOi4F7sTgDJLDRByTJrcyaOQyGSFdRyBoQmRGH6qYr5SRyJnLIyuNwgEhUCBwQRHPoU97JRAAWlK+mVokwdi1qiZcPUfzkIrFqM6PigcoSg0VCENEM0Gr+ANsjBk2v2xvaaLOl0gFspH2ENL+UkY9RdmgUgoRdv19K5BUFMmFoucQA */
  id: "game",
  initial: "playing",
  context: createInitialContext(),
  states: {
    playing: {
      invoke: [{ src: "robotActor" }, { src: "gameTimeActor" }],
      on: {
        moveRobot: {
          guard: "isValidMove",
          actions: [
            { type: "updateRobotPosition" },
            { type: "checkCollisions" },
          ],
        },
        countdown: {
          actions: [{ type: "decrementGameTime" }],
        },
      },
      always: {
        guard: "isGameOver",
        target: "finished",
      },
    },

    finished: {
      on: {
        restart: {
          target: "playing",
          actions: "resetGame",
        },

        levelUp: {
          target: "playing",
          actions: "incrementLevel",
          guard: "isNextLevelValid",
        },
      },
    },
  },
});

export const gameActor = createActor(gameMachine);

gameActor.start();

export const restartGame = () => gameActor.send({ type: "restart" });
export const levelUp = () => gameActor.send({ type: "levelUp" });

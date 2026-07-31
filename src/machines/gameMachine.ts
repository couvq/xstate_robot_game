import {
  assign,
  createActor,
  enqueueActions,
  setup,
  type ActionFunction,
  type Spawner,
} from "xstate";
import { candyActor, gameTimeActor, robotActor } from "../actors";
import { BOARD_SIZE, GAME_TIME_SECS, INITIAL_SCORE } from "../constants";
import type {
  EnqueueArg,
  GameContext,
  GameEvent,
  MoveCandyEvent,
  MoveRobotEvent,
} from "../types";
import { createIdGenerator } from "../utils/idGenerator";
import { LEVEL_CONFIGS, levelValid } from "../utils/levelConfigs";
import {
  collidesWithAny,
  getInitialRobotPosition,
  getNewCandyPosition,
  getNextPosition,
  hasCollision,
} from "../utils/positionUtils";

const generateCandyId = createIdGenerator();

const createInitialContext = (
  spawnChild: any,
  currentLevel?: number
): GameContext => {
  const wallPositions =
    currentLevel !== undefined
      ? LEVEL_CONFIGS[currentLevel].wallPositions
      : LEVEL_CONFIGS[0].wallPositions;
  const robotPos = getInitialRobotPosition(wallPositions);
  const newCandyId = generateCandyId();
  const candies = new Map([
    [newCandyId, getNewCandyPosition(robotPos, wallPositions)],
  ]);
  spawnChild("candyActor", { input: { id: newCandyId } });

  return {
    robotPosition: robotPos,
    candies,
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
    isValidRobotMove: ({ context, event }) => {
      const potentialNextPosition = getNextPosition(
        context.robotPosition,
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
    isValidCandyMove: ({ context, event }) => {
      const currentCandyPosition = context.candies.get(event.candyId);
      if (!currentCandyPosition) return false;

      const potentialNextPosition = getNextPosition(
        currentCandyPosition,
        event as MoveCandyEvent
      );

      const candyPositionsOtherThanSelf = [...context.candies.entries()]
        .filter(([candyId]) => candyId != event.candyId)
        .map(([_, position]) => position);

      const wouldHitWallRobotOrCandy = collidesWithAny(potentialNextPosition, [
        ...context.wallPositions,
        context.robotPosition,
        ...candyPositionsOtherThanSelf,
      ]);

      return (
        !wouldHitWallRobotOrCandy &&
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
        getNextPosition(context.robotPosition, event as MoveRobotEvent),
    }),
    updateCandyPosition: assign(({ context, event }) => {
      const nextCandyPosition = getNextPosition(
        context.candies.get(event.candyId),
        event as MoveCandyEvent
      );

      const newCandies = new Map(context.candies);
      newCandies.set(event.candyId, nextCandyPosition);
      return {
        candies: newCandies,
      };
    }),
    checkRobotCollisions: enqueueActions(({ context, enqueue }) => {
      let score = context.score;
      const nextCandies = new Map(context.candies);
      for (const [candyId, candyPosition] of context.candies.entries()) {
        if (hasCollision(context.robotPosition, candyPosition)) {
          score += 1;
          nextCandies.delete(candyId);
          enqueue.stopChild(candyId);
          const nextCandyId = generateCandyId();
          nextCandies.set(
            nextCandyId,
            getNewCandyPosition(context.robotPosition, context.wallPositions)
          );
          enqueue.spawnChild("candyActor", { input: { id: nextCandyId } });
        }
      }

      return { score, candies: nextCandies };
    }),
    decrementGameTime: assign({
      timeRemainingSecs: ({ context }) => context.timeRemainingSecs - 1,
    }),
    resetGame: enqueueActions(({ context, enqueue }) => {
      [...context.candies.keys()].forEach((candyId) =>
        enqueue.stopChild(candyId)
      );
      // TODO: refactor createInitinalContext to use spawnChild rather than spawn
      return createInitialContext(enqueue.spawnChild);
    }),
    incrementLevel: enqueueActions(({ context, enqueue }) => {
      [...context.candies.keys()].forEach((candyId) =>
        enqueue.stopChild(candyId)
      );
      return createInitialContext(enqueue.spawnChild, context.level + 1);
    }),
  },
  actors: {
    gameTimeActor,
    robotActor,
    candyActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAbFAngJYB2UAxGgPYBuYA2gAwC6io2VsRALkVSWxAAPRADZGmAKyiATABYAnKMmSAjAGZGShQBoQBRKoDsRzAsnrVqgByM76mbfUBfZ3tQYc+YmXIBjKgBXEm4IKgB3EiZWJBAOLl5+QREEUVVMUVE5RlEHI1VJIwUZVT0DBGt0xQUa0SNrbLlJeVd3dCw8QlIKaMF4nj4BWJTHCSNGSwLRYoUjRVEyxHUjSUxVLWX1c0ZrNVFWkA8sADNSIlgAC0hyACc4bhQb7l7Y-sSh0BSHdUx1SQV1HVrJVrOI-osEA45BkNtZltlRNYSgcjphTiRzlcIOQSGAhNwADJgOi4F7sTgDJLDRByTJrcyaOQyGSFdRyBoQmRGH6qYr5SRyJnLIyuNwgEhUCBwQRHPoU97JRAAWlK+mVokwdi1qiZcPUfzkIrFqM6PigcoSg0VCENEM0Gr+ANsjBk2v2xvaaLOl0gFspH2ENL+UkY9RdmgUgoRdv19K5BUFMmFoucQA */
  id: "game",
  initial: "playing",
  context: ({ spawn }) => createInitialContext(spawn),
  states: {
    playing: {
      invoke: [{ src: "robotActor" }, { src: "gameTimeActor" }],
      on: {
        moveRobot: {
          guard: "isValidRobotMove",
          actions: [
            { type: "updateRobotPosition" },
            { type: "checkRobotCollisions" },
          ],
        },

        moveCandy: {
          guard: "isValidCandyMove",
          actions: [{ type: "updateCandyPosition" }],
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

gameActor.subscribe((snapshot) => console.log(snapshot.context));

export const restartGame = () => gameActor.send({ type: "restart" });
export const levelUp = () => gameActor.send({ type: "levelUp" });

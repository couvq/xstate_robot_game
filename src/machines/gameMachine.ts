import { assign, createActor, enqueueActions, setup } from "xstate";
import { candyActor, enemyActor, gameTimeActor, robotActor } from "../actors";
import { BOARD_SIZE, GAME_TIME_SECS, INITIAL_SCORE } from "../constants";
import type {
  GameContext,
  GameEvent,
  MoveCandyEvent,
  MoveEnemyEvent,
  MoveRobotEvent,
} from "../types";
import { createIdGenerator } from "../utils/idGenerator";
import { LEVEL_CONFIGS, levelValid } from "../utils/levelConfigs";
import {
  collidesWithAny,
  getInitialRobotPosition,
  getNewCandyPosition,
  getNewEnemyPosition,
  getNextPosition,
  hasCollision,
} from "../utils/positionUtils";

const generateCandyId = createIdGenerator("candy");
const generateEnemyId = createIdGenerator("enemy");

const createInitialContext = (
  spawnChild: any,
  currentLevel?: number
): GameContext => {
  const levelConfig =
    currentLevel !== undefined
      ? LEVEL_CONFIGS[currentLevel]
      : LEVEL_CONFIGS[0];
  const robotPos = getInitialRobotPosition(levelConfig.wallPositions);
  const newCandyIds = [generateCandyId(), generateCandyId()];
  const candies = new Map(
    newCandyIds.map((id) => [id, getNewCandyPosition(robotPos, levelConfig.wallPositions, levelConfig.initialEnemyPositions)])
  );
  const newEnemyIds = [generateEnemyId()];
  const enemies = new Map(
    newEnemyIds.map((id) => [
      id,
      getNewEnemyPosition(robotPos, [...candies.values()], levelConfig.wallPositions),
    ])
  );
  newCandyIds.forEach((candyId) =>
    spawnChild("candyActor", { input: { id: candyId }, id: candyId })
  );
  newEnemyIds.forEach((enemyId) =>
    spawnChild("enemyActor", { input: { id: enemyId }, id: enemyId })
  );

  return {
    robotPosition: robotPos,
    candies,
    enemies,
    wallPositions: levelConfig.wallPositions,
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

      const enemyPositions = [...context.enemies.values()];

      const candyPositionsOtherThanSelf = [...context.candies.entries()]
        .filter(([candyId]) => candyId != event.candyId)
        .map(([_, position]) => position);

      const wouldHitWallRobotEnemyOrCandy = collidesWithAny(potentialNextPosition, [
        ...context.wallPositions,
        context.robotPosition,
        ...enemyPositions,
        ...candyPositionsOtherThanSelf,
      ]);

      return (
        !wouldHitWallRobotEnemyOrCandy &&
        potentialNextPosition[0] >= 0 &&
        potentialNextPosition[0] < BOARD_SIZE &&
        potentialNextPosition[1] >= 0 &&
        potentialNextPosition[1] < BOARD_SIZE
      );
    },
    isValidEnemyMove: ({ context, event }) => {
      const currentEnemyPosition = context.enemies.get(event.enemyId);
      if (!currentEnemyPosition) return false;

      const potentialNextPosition = getNextPosition(
        currentEnemyPosition,
        event as MoveEnemyEvent
      );

      const candyPositions = [...context.candies.values()];

      const enemyPositionsOtherThanSelf = [...context.enemies.entries()]
        .filter(([enemyId]) => enemyId != event.enemyId)
        .map(([_, position]) => position);

      const wouldHitWallCandyOrEnemy = collidesWithAny(potentialNextPosition, [
        ...context.wallPositions,
        ...candyPositions,
        ...enemyPositionsOtherThanSelf,
      ]);

      return (
        !wouldHitWallCandyOrEnemy &&
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
    updateEnemyPosition: assign(({ context, event }) => {
      const nextEnemyPosition = getNextPosition(
        context.enemies.get(event.enemyId),
        event as MoveEnemyEvent
      );

      const newEnemies = new Map(context.enemies);
      newEnemies.set(event.enemyId, nextEnemyPosition);
      return {
        enemies: newEnemies,
      };
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
            getNewCandyPosition(context.robotPosition, context.wallPositions, [...context.enemies.values()])
          );
          enqueue.spawnChild("candyActor", {
            input: { id: nextCandyId },
            id: nextCandyId,
          });
        }
      }

      enqueue.assign({ score, candies: nextCandies });
    }),
    decrementGameTime: assign({
      timeRemainingSecs: ({ context }) => context.timeRemainingSecs - 1,
    }),
    resetGame: enqueueActions(({ context, enqueue }) => {
      [...context.candies.keys()].forEach((candyId) =>
        enqueue.stopChild(candyId)
      );
      enqueue.assign(createInitialContext(enqueue.spawnChild));
    }),
    incrementLevel: enqueueActions(({ context, enqueue }) => {
      [...context.candies.keys()].forEach((candyId) =>
        enqueue.stopChild(candyId)
      );
      enqueue.assign(
        createInitialContext(enqueue.spawnChild, context.level + 1)
      );
    }),
  },
  actors: {
    gameTimeActor,
    robotActor,
    candyActor,
    enemyActor,
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

        moveEnemy: {
          guard: "isValidEnemyMove",
          actions: [{ type: "updateEnemyPosition" }],
          // TODO: need a checkEnemyCollision action
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

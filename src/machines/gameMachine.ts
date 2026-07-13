import { assign, createActor, fromCallback, setup } from "xstate";
import { BOARD_SIZE, GAME_TIME_SECS, INITIAL_SCORE } from "../constants";

export type Position = [number, number];

export type GameContext = {
  robotPosition: Position;
  candyPosition: Position;
  wallPositions: Position[];
  score: number;
  timeRemainingSecs: number; // time left to play the game in seconds
};

type Direction = "up" | "down" | "left" | "right";

type MoveEvent = { type: "move"; direction: Direction };

type CountDownEvent = { type: "countdown" };

type RestartEvent = { type: "restart" };

type GameEvent = MoveEvent | CountDownEvent | RestartEvent;

const getRandomBoardPosition = (): Position => {
  const row = Math.floor(Math.random() * BOARD_SIZE);
  const col = Math.floor(Math.random() * BOARD_SIZE);
  return [row, col];
};

const hasCollision = (position1: Position, position2: Position) =>
  position1[0] === position2[0] && position1[1] === position2[1];

const getNewCandyPosition = (robotPosition: Position): Position => {
  let candyPosition = getRandomBoardPosition();

  // keep setting candy position until we get one that isn't where the robot is
  while (hasCollision(robotPosition, candyPosition)) {
    candyPosition = getRandomBoardPosition();
  }

  return candyPosition;
};

const getNextPosition = (context: GameContext, event: MoveEvent): Position => {
  const currentRow = context.robotPosition[0];
  const currentCol = context.robotPosition[1];

  switch (event.direction) {
    case "up":
      return [currentRow - 1, currentCol];
    case "down":
      return [currentRow + 1, currentCol];
    case "left":
      return [currentRow, currentCol - 1];
    case "right":
      return [currentRow, currentCol + 1];
    default:
      throw new Error(
        `Receieved an unknown move event: ${JSON.stringify(event)}`
      );
  }
};

const createInitialContext = (): GameContext => {
  const robotPos = getRandomBoardPosition();
  const candyPos = getNewCandyPosition(robotPos);
  return {
    robotPosition: robotPos,
    candyPosition: candyPos,
    wallPositions: [[1, 1]],
    score: INITIAL_SCORE,
    timeRemainingSecs: GAME_TIME_SECS,
  };
};

const keydownActor = fromCallback(({ sendBack }) => {
  const keyDownHandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") sendBack({ type: "move", direction: "up" });
    if (e.key === "ArrowDown") sendBack({ type: "move", direction: "down" });
    if (e.key === "ArrowLeft") sendBack({ type: "move", direction: "left" });
    if (e.key === "ArrowRight") sendBack({ type: "move", direction: "right" });
  };

  window.addEventListener("keydown", keyDownHandler);

  return () => window.removeEventListener("keydown", keyDownHandler);
});

const gameTimeActor = fromCallback(({ sendBack }) => {
  let intervalId = setInterval(() => {
    sendBack({ type: "countdown" });
  }, 1000);

  return () => clearInterval(intervalId);
});

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    isValidMove: ({ context, event }) => {
      const potentialNextPosition = getNextPosition(
        context,
        event as MoveEvent
      );

      const wouldHitWall = context.wallPositions.filter((pos) => hasCollision(pos, potentialNextPosition)).length > 0;
      return (
        !wouldHitWall && 
        potentialNextPosition[0] >= 0 &&
        potentialNextPosition[0] < BOARD_SIZE &&
        potentialNextPosition[1] >= 0 &&
        potentialNextPosition[1] < BOARD_SIZE
      );
    },
    isGameOver: ({ context }) => context.timeRemainingSecs <= 0,
  },
  actions: {
    updateRobotPosition: assign({
      robotPosition: ({ context, event }) =>
        getNextPosition(context, event as MoveEvent),
    }),
    checkCollisions: assign(({ context }) => {
      if (hasCollision(context.robotPosition, context.candyPosition)) {
        return {
          score: context.score + 1,
          candyPosition: getNewCandyPosition(context.robotPosition),
        };
      }

      return {};
    }),
    decrementGameTime: assign({
      timeRemainingSecs: ({ context }) => context.timeRemainingSecs - 1,
    }),
    resetGame: assign(() => createInitialContext()),
  },
  actors: {
    keydownActor,
    gameTimeActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAbFAngJYB2UAxGgPYBuYA2gAwC6io2VsRALkVSWxAAPRADZGmAKyiATABYAnKMmSAjAGZGShQBoQBRKoDsRzAsnrVqgByM76mbfUBfZ3tQYc+YmXIBjKgBXEm4IKgB3EiZWJBAOLl5+QREEUVVMUVE5RlEHI1VJIwUZVT0DBGt0xQUa0SNrbLlJeVd3dCw8QlIKaMF4nj4BWJTHCSNGSwLRYoUjRVEyxHUjSUxVLWX1c0ZrNVFWkA8sADNSIlgAC0hyACc4bhQb7l7Y-sSh0BSHdUx1SQV1HVrJVrOI-osEA45BkNtZltlRNYSq43CASFQIHBBEc+pwBklhogALSlfTE-aoo5eLpkXEJQbJRByIwQzSiX7-dS2RgyOyMVQUtqeU4kc5XCB0-EfYRMv5SRj1HmaBRyVU5VnqH6qYr5SSqmTLIwo5xAA */
  id: "game",
  initial: "playing",
  context: createInitialContext(),
  states: {
    playing: {
      invoke: [{ src: "keydownActor" }, { src: "gameTimeActor" }],
      on: {
        move: {
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
      },
    },
  },
});

export const gameActor = createActor(gameMachine);

gameActor.start();

export const restartGame = () => gameActor.send({ type: "restart" });

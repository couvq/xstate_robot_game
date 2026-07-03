import { assign, createActor, fromCallback, setup } from "xstate";
import { BOARD_SIZE } from "../constants";

type Position = [number, number];

type GameContext = {
  robotPosition: Position;
  candyPosition: Position;
  score: number;
};

type Direction = "up" | "down" | "left" | "right";

type MoveEvent = { type: "move"; direction: Direction };

type GameEvent = MoveEvent;

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

const initialRobotPosition = getRandomBoardPosition();

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

const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    isValidMove: ({ context, event }) => {
      const potentialNextPosition = getNextPosition(context, event);
      return (
        potentialNextPosition[0] >= 0 &&
        potentialNextPosition[0] < BOARD_SIZE &&
        potentialNextPosition[1] >= 0 &&
        potentialNextPosition[1] < BOARD_SIZE
      );
    },
  },
  actions: {
    updateRobotPosition: assign({
      robotPosition: ({ context, event }) => getNextPosition(context, event),
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
  },
  actors: {
    keydownActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAbFAngJYB2UAxGgPYBuYA2gAwC6io2VsRALkVSWxAAPRAEYA7AE5MjAGyyALHIBMAVgA0IAoknKZjcQA5RagL7nNJKhDiDUGQRy69+gkQgC0ozdoQLMqgbGZqaa9lh4hKRQjpw8fAJIwogK4j5iAMzi5uZAA */
  id: "game",
  initial: "playing",
  context: {
    robotPosition: initialRobotPosition,
    candyPosition: getNewCandyPosition(initialRobotPosition),
    score: 0,
  },
  invoke: {
    src: "keydownActor",
  },
  states: {
    playing: {
      on: {
        move: {
          guard: "isValidMove",
          actions: [
            { type: "updateRobotPosition" },
            { type: "checkCollisions" },
          ],
        },
      },
    },
  },
});

export const gameActor = createActor(gameMachine);

gameActor.start();

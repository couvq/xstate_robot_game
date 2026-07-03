import { assign, createActor, setup } from "xstate";
import { BOARD_SIZE } from "../constants";
type GameContext = {
  robotPosition: [number, number];
  candyPosition: [number, number];
  score: number;
};

type Direction = "up" | "down" | "left" | "right";

type MoveEvent = { type: "move"; direction: Direction };

type GameEvent = MoveEvent;

const getRandomBoardPosition = (): [number, number] => {
  const row = Math.floor(Math.random() * BOARD_SIZE);
  const col = Math.floor(Math.random() * BOARD_SIZE);
  return [row, col];
};

const getInitialCandyPosition = (
  robotPosition: [number, number]
): [number, number] => {
  let candyPosition = getRandomBoardPosition();

  // keep setting candy position until we get one that isn't where the robot is
  while (
    candyPosition[0] === robotPosition[0] &&
    candyPosition[1] === robotPosition[1]
  ) {
    candyPosition = getRandomBoardPosition();
  }

  return candyPosition;
};

const getNextPosition = (
  context: GameContext,
  event: MoveEvent
): [number, number] => {
  const currentRow = context.robotPosition[0];
  const currentCol = context.robotPosition[1];
  if (event.direction === "up") return [currentRow - 1, currentCol];
  if (event.direction === "down") return [currentRow + 1, currentCol];
  if (event.direction === "left") return [currentRow, currentCol - 1];
  if (event.direction === "right") return [currentRow, currentCol + 1];
  return [0, 0];
};

const initialRobotPosition = getRandomBoardPosition();

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
      if (
        context.robotPosition[0] === context.candyPosition[0] &&
        context.robotPosition[1] === context.candyPosition[1]
      ) {
        return {
          score: context.score + 1,
          candyPosition: getInitialCandyPosition(context.robotPosition),
        };
      }
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAbFAngJYB2UAxGgPYBuYA2gAwC6io2VsRALkVSWxAAPRAEYA7AE5MjAGyyALHIBMAVgA0IAoknKZjcQA5RagL7nNJKhDiDUGQRy69+gkQgC0ozdoQLMqgbGZqaa9lh4hKRQjpw8fAJIwogK4j5iAMzi5uZAA */
  id: "game",
  initial: "playing",
  context: {
    robotPosition: initialRobotPosition,
    candyPosition: getInitialCandyPosition(initialRobotPosition),
    score: 0,
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

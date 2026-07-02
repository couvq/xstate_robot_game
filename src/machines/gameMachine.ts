import { assign, createActor, setup } from "xstate";

export const BOARD_SIZE = 5;

type GameContext = {
  robotPosition: [number, number];
};

type Direction = "up" | "down" | "left" | "right";

type GameEvent = { type: "move"; direction: Direction };

const getRandomBoardPosition = (): [number, number] => {
  const row = Math.floor(Math.random() * BOARD_SIZE);
  const col = Math.floor(Math.random() * BOARD_SIZE);
  return [row, col];
};

const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actions: {
    storeMoveToContext: assign({
      robotPosition: ({ context, event }) => {
        const currentRow = context.robotPosition[0];
        const currentCol = context.robotPosition[1];
        if (event.direction === "up") return [currentRow - 1, currentCol];
        if (event.direction === "down") return [currentRow + 1, currentCol];
        if (event.direction === "left") return [currentRow, currentCol - 1];
        if (event.direction === "right") return [currentRow, currentCol + 1];
        return [0, 0];
      },
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAbFAngJYB2UAxGgPYBuYA2gAwC6io2VsRALkVSWxAAPRAEYA7AE5MjAGyyALHIBMAVgA0IAoknKZjcQA5RagL7nNJKhDiDUGQRy69+gkQgC0ozdoQLMqgbGZqaa9lh4hKRQjpw8fAJIwogK4j5iAMzi5uZAA */
  id: "game",
  initial: "playing",
  context: {
    robotPosition: getRandomBoardPosition(),
  },
  states: {
    playing: {
      on: {
        move: {
          actions: [{ type: "storeMoveToContext" }],
        },
      },
    },
  },
});

export const gameActor = createActor(gameMachine);

gameActor.start();

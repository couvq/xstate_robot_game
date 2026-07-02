import { createActor, setup } from "xstate";

export const BOARD_SIZE = 5;

type GameContext = {
  robotPosition: [number, number];
};

type GameEvent = { type: "move"; direction: "up" | "down" | "left" | "right" };

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
        move: {},
      },
    },
  },
});

export const gameActor = createActor(gameMachine);

gameActor.start();

import { fromCallback, type EventObject } from "xstate";
import { CANDY_MOVE_RATE, ENEMY_MOVE_RATE, positions } from "../constants";

export const robotActor = fromCallback(({ sendBack }) => {
  const keyDownHandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") sendBack({ type: "moveRobot", direction: "up" });
    if (e.key === "ArrowDown")
      sendBack({ type: "moveRobot", direction: "down" });
    if (e.key === "ArrowLeft")
      sendBack({ type: "moveRobot", direction: "left" });
    if (e.key === "ArrowRight")
      sendBack({ type: "moveRobot", direction: "right" });
  };

  window.addEventListener("keydown", keyDownHandler);

  return () => window.removeEventListener("keydown", keyDownHandler);
});

export const gameTimeActor = fromCallback(({ sendBack }) => {
  let intervalId = setInterval(() => {
    sendBack({ type: "countdown" });
  }, 1000);

  return () => clearInterval(intervalId);
});

export const candyActor = fromCallback<EventObject, { id: string }>(
  ({ sendBack, input }) => {
    const { id } = input;
    let intervalId = setInterval(() => {
      const randomDirection =
        positions[Math.floor(Math.random() * positions.length)];
      sendBack({
        type: "moveCandy",
        direction: randomDirection,
        candyId: id,
      });
    }, CANDY_MOVE_RATE);

    return () => {
      console.log(`candy with id: ${id} removed.`);
      clearInterval(intervalId);
    };
  }
);

export const enemyActor = fromCallback<EventObject, { id: string }>(
  ({ sendBack, input }) => {
    const { id } = input;
    let intervalId = setInterval(() => {
      console.log(`enemy with id: ${id} moved`);
      const randomDirection =
        positions[Math.floor(Math.random() * positions.length)];
      sendBack({
        type: "moveEnemy",
        direction: randomDirection,
        enemyId: id,
      });
    }, ENEMY_MOVE_RATE);

    return () => {
      console.log(`enemy with id: ${id} removed.`);
      clearInterval(intervalId);
    };
  }
);

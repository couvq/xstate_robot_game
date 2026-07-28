import { fromCallback } from "xstate";

export const keydownActor = fromCallback(({ sendBack }) => {
  const keyDownHandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") sendBack({ type: "move", direction: "up" });
    if (e.key === "ArrowDown") sendBack({ type: "move", direction: "down" });
    if (e.key === "ArrowLeft") sendBack({ type: "move", direction: "left" });
    if (e.key === "ArrowRight") sendBack({ type: "move", direction: "right" });
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

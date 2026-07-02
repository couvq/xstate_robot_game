import { useSelector } from "@xstate/react";
import { BOARD_SIZE, gameActor } from "./machines/gameMachine";
import { useCallback, useEffect } from "react";

const robotEmoji = "🤖";
const candyEmoji = "🍬";

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array.from({ length: BOARD_SIZE })
);

const Game = () => {
  const robotPosition = useSelector(
    gameActor,
    (snapshot) => snapshot.context.robotPosition
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp")
        gameActor.send({ type: "move", direction: "up" });
      if (e.key === "ArrowDown")
        gameActor.send({ type: "move", direction: "down" });
      if (e.key === "ArrowLeft")
        gameActor.send({ type: "move", direction: "left" });
      if (e.key === "ArrowRight")
        gameActor.send({ type: "move", direction: "right" });
    },
    [gameActor]
  );

  useEffect(() => {
    console.log("event listener attached!");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      console.log("event listener removed!");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <div>
        <h1>Robot game</h1>
        <p>
          Move the robot with the arrow keys to eat the candy.
          <br />
          Each candy collected increments your score.
        </p>
      </div>
      <table>
        <tbody>
          {board.map((row, rowIdx) => (
            <tr>
              {row.map((col, colIdx) => (
                <td>
                  {robotPosition[0] === rowIdx &&
                    robotPosition[1] === colIdx &&
                    robotEmoji}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default Game;

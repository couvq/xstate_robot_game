import { useSelector } from "@xstate/react";
import { useEffect } from "react";
import { gameActor } from "./machines/gameMachine";
import { BOARD_SIZE } from "./constants";

const robotEmoji = "🤖";
const candyEmoji = "🍬";

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array.from({ length: BOARD_SIZE })
);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "ArrowUp") gameActor.send({ type: "move", direction: "up" });
  if (e.key === "ArrowDown")
    gameActor.send({ type: "move", direction: "down" });
  if (e.key === "ArrowLeft")
    gameActor.send({ type: "move", direction: "left" });
  if (e.key === "ArrowRight")
    gameActor.send({ type: "move", direction: "right" });
};

const Game = () => {
  const robotPosition = useSelector(
    gameActor,
    (snapshot) => snapshot.context.robotPosition
  );

  const candyPosition = useSelector(
    gameActor,
    (snapshot) => snapshot.context.candyPosition
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
            <tr key={rowIdx}>
              {row.map((_col, colIdx) => (
                <td key={colIdx}>
                  {robotPosition[0] === rowIdx &&
                    robotPosition[1] === colIdx &&
                    robotEmoji}
                  {candyPosition[0] === rowIdx &&
                    candyPosition[1] === colIdx &&
                    candyEmoji}
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

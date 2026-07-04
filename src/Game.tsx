import { useSelector } from "@xstate/react";
import { BOARD_SIZE } from "./constants";
import { gameActor } from "./machines/gameMachine";

const robotEmoji = "🤖";
const candyEmoji = "🍬";

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array.from({ length: BOARD_SIZE })
);

const Game = () => {
  const isGameOver = useSelector(gameActor, (snapshot) =>
    snapshot.matches("finished")
  );
  const robotPosition = useSelector(
    gameActor,
    (snapshot) => snapshot.context.robotPosition
  );
  const candyPosition = useSelector(
    gameActor,
    (snapshot) => snapshot.context.candyPosition
  );
  const score = useSelector(gameActor, (snapshot) => snapshot.context.score);
  const timeRemainingSecs = useSelector(
    gameActor,
    (snaphshot) => snaphshot.context.timeRemainingSecs
  );

  return (
    <>
      <div>
        <h1>Robot game</h1>
        <p>
          Move the robot with the arrow keys to eat the candy.
          <br />
          Each candy collected increments your score.
        </p>
        <p>Score: {score}</p>
        <p>Time remaining: {timeRemainingSecs}</p>
        {isGameOver ? "Game is finished" : "Game is being played"}
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

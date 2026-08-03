import { useSelector } from "@xstate/react";
import { BOARD_SIZE } from "./constants";
import { gameActor, levelUp, restartGame } from "./machines/gameMachine";
import { levelValid } from "./utils/levelConfigs";

const robotEmoji = "🤖";
const candyEmoji = "🍬";
const wallEmoji = "皿";
const enemyEmoji = "🥷";

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array.from({ length: BOARD_SIZE })
);

const GameScreen = () => {
  const robotPosition = useSelector(
    gameActor,
    (snapshot) => snapshot.context.robotPosition
  );
  const candyPositions = useSelector(gameActor, (snapshot) => [
    ...snapshot.context.candies.values(),
  ]);
  const enemyPositions = useSelector(gameActor, (snapshot) => [
    ...snapshot.context.enemies.values(),
  ]);
  const wallPositions = useSelector(
    gameActor,
    (snapshot) => snapshot.context.wallPositions
  );
  const level = useSelector(gameActor, (snapshot) => snapshot.context.level);
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
        <p>Level: {level}</p>
        <p>Score: {score}</p>
        <p>Time remaining: {timeRemainingSecs}</p>
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
                  {candyPositions.map(
                    (candyPosition) =>
                      candyPosition[0] === rowIdx &&
                      candyPosition[1] === colIdx &&
                      candyEmoji
                  )}
                  {enemyPositions.map(
                    (enemyPosition) =>
                      enemyPosition[0] === rowIdx &&
                      enemyPosition[1] === colIdx &&
                      enemyEmoji
                  )}
                  {wallPositions.filter(
                    (pos) => pos[0] === rowIdx && pos[1] === colIdx
                  ).length > 0 && wallEmoji}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const GameOver = () => {
  const score = useSelector(gameActor, (snapshot) => snapshot.context.score);
  const isNextLevelValid = useSelector(gameActor, (snapshot) =>
    levelValid(snapshot.context.level + 1)
  );

  return (
    <>
      <h1>Game is finished</h1>
      <p>You collected {score} candies.</p>
      <button onClick={restartGame}>Restart</button>
      {isNextLevelValid && <button onClick={levelUp}>Next level</button>}
    </>
  );
};

const Game = () => {
  const isGameOver = useSelector(gameActor, (snapshot) =>
    snapshot.matches("finished")
  );

  return isGameOver ? <GameOver /> : <GameScreen />;
};

export default Game;

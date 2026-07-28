import { BOARD_SIZE } from "../constants";
import type { GameContext, MoveEvent, Position } from "../types";

export const getRandomBoardPosition = (): Position => {
  const row = Math.floor(Math.random() * BOARD_SIZE);
  const col = Math.floor(Math.random() * BOARD_SIZE);
  return [row, col];
};

export const hasCollision = (position1: Position, position2: Position) =>
  position1[0] === position2[0] && position1[1] === position2[1];

export const collidesWithAny = (pos: Position, positions: Position[]) =>
  positions.some((p) => hasCollision(pos, p));

/**
 * Generates starting robot position. Guarantees that robot will appear in a position that does not collide with a wall.
 * @param wallPositions positions that contain walls
 * @returns initial robot position
 */
export const getInitialRobotPosition = (wallPositions: Position[]): Position => {
  let robotPosition = getRandomBoardPosition();
  let wouldHitWall = collidesWithAny(robotPosition, wallPositions);

  while (wouldHitWall) {
    robotPosition = getRandomBoardPosition();
    wouldHitWall = collidesWithAny(robotPosition, wallPositions);
  }

  return robotPosition;
};

/**
 * Generates a new spawn position for candy. Ensures that the position does not collide with the robot or a wall.
 * @param robotPosition position of the robot
 * @param wallPositions positions that contain walls
 * @returns new candy position
 */
export const getNewCandyPosition = (
  robotPosition: Position,
  wallPositions: Position[]
): Position => {
  let candyPosition = getRandomBoardPosition();

  // keep setting candy position until we get one that isn't where the robot is or a wall
  while (collidesWithAny(candyPosition, [robotPosition, ...wallPositions])) {
    candyPosition = getRandomBoardPosition();
  }

  return candyPosition;
};

export const getNextPosition = (context: GameContext, event: MoveEvent): Position => {
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

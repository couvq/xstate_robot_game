export type Position = [number, number];

export type GameContext = {
  robotPosition: Position;
  candies: Map<string, Position>; // candyId -> position
  enemies: Map<string, Position>; // enemyId -> position
  wallPositions: Position[];
  score: number;
  level: number;
  timeRemainingSecs: number; // time left to play the game in seconds
};

export type Direction = "up" | "down" | "left" | "right";

export type MoveRobotEvent = { type: "moveRobot"; direction: Direction };
export type MoveCandyEvent = {
  type: "moveCandy";
  direction: Direction;
  candyId: string;
};

export type MoveEnemyEvent = {
  type: "moveEnemy";
  direction: Direction;
  enemyId: string;
};

type CountDownEvent = { type: "countdown" };

type RestartEvent = { type: "restart" };

type LevelUpEvent = { type: "levelUp" };

export type GameEvent =
  | MoveRobotEvent
  | MoveCandyEvent
  | MoveEnemyEvent
  | CountDownEvent
  | RestartEvent
  | LevelUpEvent;

export type LevelConfig = {
  wallPositions: Position[];
  initialEnemyPositions: Position[];
};

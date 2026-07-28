export type Position = [number, number];

export type GameContext = {
  robotPosition: Position;
  candyPosition: Position;
  wallPositions: Position[];
  score: number;
  level: number;
  timeRemainingSecs: number; // time left to play the game in seconds
};

type Direction = "up" | "down" | "left" | "right";

export type MoveEvent = { type: "move"; direction: Direction };

type CountDownEvent = { type: "countdown" };

type RestartEvent = { type: "restart" };

type LevelUpEvent = { type: "levelUp" };

export type GameEvent = MoveEvent | CountDownEvent | RestartEvent | LevelUpEvent;

export type LevelConfig = {
  wallPositions: Position[];
  // later: enemyPositions?: Position[ (perhaps another data structure?)], etc.
};

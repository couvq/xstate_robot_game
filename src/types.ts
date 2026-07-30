import type { ActorRefFromLogic } from "xstate";
import type { candyActor } from "./actors";

export type Position = [number, number];

export type GameContext = {
  robotPosition: Position;
  candies: Map<ActorRefFromLogic<typeof candyActor>, Position>;
  wallPositions: Position[];
  score: number;
  level: number;
  timeRemainingSecs: number; // time left to play the game in seconds
};

export type Direction = "up" | "down" | "left" | "right";

export type MoveRobotEvent = { type: "moveRobot"; direction: Direction };

type CountDownEvent = { type: "countdown" };

type RestartEvent = { type: "restart" };

type LevelUpEvent = { type: "levelUp" };

export type GameEvent =
  | MoveRobotEvent
  | CountDownEvent
  | RestartEvent
  | LevelUpEvent;

export type LevelConfig = {
  wallPositions: Position[];
  // later: enemyPositions?: Position[ (perhaps another data structure?)], etc.
};

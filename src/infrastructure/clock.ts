import type { Clock } from "@application/ports";

export const realClock: Clock = {
  now: () => new Date(),
};

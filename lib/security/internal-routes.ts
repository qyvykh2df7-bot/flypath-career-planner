import "server-only";

import { notFound } from "next/navigation";

export function areInternalRoutesAvailable(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.NODE_ENV === "development" || environment.NODE_ENV === "test";
}

export function requireInternalRoute(): void {
  if (!areInternalRoutesAvailable()) notFound();
}

export const internalRouteRobots = { index: false, follow: false };

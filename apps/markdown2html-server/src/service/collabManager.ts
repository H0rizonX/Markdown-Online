import { CollabService } from "./CollabService";
import { env } from "../config/env";

let instance: CollabService | null = null;

export const ensureCollabServer = (): CollabService | null => {
  if (!env.collab.enable) {
    return null;
  }

  if (!instance) {
    instance = new CollabService(env.collab.port);
    instance.start();
  }

  return instance;
};

export const getCollabServer = (): CollabService | null => instance;


"use client";
import { createContext, useContext } from "react";
import type { Snapshot } from "@/types/entities";

export type AppContextValue = {
  data: Snapshot;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  act: (action: string, payload?: unknown) => Promise<Record<string, unknown>>;
  notify: (message: string) => void;
};
export const AppContext = createContext<AppContextValue | null>(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Missing AppProvider");
  return value;
}

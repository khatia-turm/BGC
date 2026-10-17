export const MOCK_STATE_VERSION: number;
export type MockResponse = {
  status: number;
  body?: unknown;
};
export function createMockApi(
  seed: unknown,
  options?: { now?: () => number; rebaseDates?: boolean },
): {
  snapshot(): unknown;
  restore(state: unknown): void;
  request(
    path: string,
    options?: { method?: string; headers?: HeadersInit; body?: unknown },
  ): MockResponse;
};

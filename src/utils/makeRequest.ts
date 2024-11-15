import { BASE_URL, TEST_USER_ID } from "@/config/constants";
import app from "..";

export const makeRequest = (path: string, options: RequestInit = {}) => {
  const url = new URL(path, BASE_URL);
  return app.fetch(
    new Request(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": TEST_USER_ID,
        ...options.headers,
      },
    }),
  );
};

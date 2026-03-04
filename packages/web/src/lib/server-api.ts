 
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ServerApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
  ) {
    super(`Server API error ${status}: ${statusText}`);
    this.name = "ServerApiError";
  }
}

export const serverApi = {
  async get<T>(path: string, revalidate?: number): Promise<T> {
    const options: RequestInit = {};
    if (revalidate !== undefined) {
      options.next = { revalidate } as NextFetchRequestConfig;
    }

    const res = await fetch(`${BASE_URL}${path}`, options);

    if (!res.ok) {
      throw new ServerApiError(res.status, res.statusText);
    }

    return res.json() as Promise<T>;
  },
};

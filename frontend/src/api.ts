export type Role = "USER" | "ADMIN";

export type User = { id: string; name: string; email: string; role: Role };
export type Vehicle = {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
};

type ApiError = { message?: string };

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const request = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(error.message || "Something went wrong. Please try again.");
  }

  return (response.status === 204 ? undefined : response.json()) as Promise<T>;
};

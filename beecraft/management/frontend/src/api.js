const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("beecraft-management-token");
  const isForm = options.body instanceof URLSearchParams;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body
        ? {
            "Content-Type": isForm
              ? "application/x-www-form-urlencoded"
              : "application/json",
          }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem("beecraft-management-token");
    window.dispatchEvent(new Event("auth-expired"));
  }
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Erro inesperado" }));
    throw new Error(
      Array.isArray(error.detail)
        ? error.detail.map((item) => item.msg).join(" ")
        : error.detail,
    );
  }
  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response;
}

export const money = (value = 0) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(
    Number(value),
  );
export const date = (value) =>
  new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(
    new Date(value),
  );

// Central place for all backend calls.
// Change API_URL if you ever move the backend.
export const API_URL = "https://farm-guard-backend.onrender.com";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // some endpoints may return nothing
  }

  if (!res.ok) {
    const message = data?.detail || data?.error || "Request failed";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return data;
}

export function signup(name, phone, password) {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify({ name, phone, password }),
  });
}

export function login(phone, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export function getMyReadings(token) {
  return request("/my-readings", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function sendSensorData(token, data) {
  return request("/sensor-data", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

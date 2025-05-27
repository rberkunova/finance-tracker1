// frontend/src/services/api.ts
const API_BASE_URL = '/api';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  // Визначаємо тип для заголовків, який може містити рядкові ключі
  const currentHeaders: Record<string, string> = {
    // За замовчуванням встановлюємо 'Content-Type', якщо він не перевизначений в options.headers
    // і якщо тіло запиту не є FormData (FormData сама встановлює Content-Type)
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>), // Приводимо options.headers до типу Record<string, string>
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: currentHeaders, // Використовуємо наш об'єкт заголовків
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || `Request failed with status ${response.status}` };
    }
    const error = new Error(errorData?.message || `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).errorData = errorData;
    throw error;
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  try {
    return await response.json();
  } catch (e) {
    console.error("API response was OK, but failed to parse JSON:", e, "Response Text:", await response.text());
    // Повертаємо текст відповіді, якщо JSON.parse не вдався, для кращої діагностики
    // Або можна кинути специфічну помилку
    throw new Error("Failed to parse server response as JSON.");
  }
};

export const authRequest = async (
  endpoint: string,
  token: string,
  options: RequestInit = {}
) => {
  // Початкові заголовки з options.headers, приведені до Record<string, string>
  const initialHeaders = options.headers ? (options.headers as Record<string, string>) : {};

  const authHeaders: Record<string, string> = {
    ...initialHeaders, // Спочатку копіюємо існуючі заголовки
    Authorization: `Bearer ${token}`, // Потім додаємо або перезаписуємо Authorization
  };

  // Content-Type встановлюється в apiRequest, якщо він не наданий і тіло не FormData
  // Тому тут ми просто передаємо authHeaders як частину options.headers

  return apiRequest(endpoint, {
    ...options,
    headers: authHeaders,
  });
};
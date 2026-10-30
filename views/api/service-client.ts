// Integration placeholder only. This frontend ships no server or API endpoints.
// Replace this adapter when a new backend is available.
export async function sendAction(
  _action: string,
  _payload: unknown = {},
): Promise<Response> {
  throw new Error(
    "Bản giao diện chưa kết nối backend. Thao tác này chưa lưu dữ liệu.",
  );
}

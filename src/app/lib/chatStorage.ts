export const CHAT_HISTORY_STORAGE_KEY = "chat_history";
export const CHAT_SESSION_ID_STORAGE_KEY = "chat_session_id";

export function clearChatStorage() {
  sessionStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  sessionStorage.removeItem(CHAT_SESSION_ID_STORAGE_KEY);
}

export function getUserId() {
  let userId = localStorage.getItem("user_id") ?? "";

  if (!userId) {
    if (window.crypto?.randomUUID) {
      userId = window.crypto.randomUUID();
    } else {
      userId =
        "uid-" +
        Math.random().toString(36).substring(2) +
        Date.now().toString(36);
    }
    localStorage.setItem("user_id", userId);
  }

  return userId;
}

export type LastAuthMethod = "google" | "credentials" | null;

const LAST_AUTH_METHOD_KEY = "igaho:last-auth-method";
const LAST_AUTH_METHOD_EVENT = "igaho:last-auth-method-changed";

export function readLastAuthMethod(): LastAuthMethod {
  if (typeof window === "undefined") return null;

  const storedMethod = window.localStorage.getItem(LAST_AUTH_METHOD_KEY);
  return storedMethod === "google" || storedMethod === "credentials"
    ? storedMethod
    : null;
}

export function subscribeToLastAuthMethod(
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LAST_AUTH_METHOD_KEY) {
      onStoreChange();
    }
  };

  const handleCustom = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LAST_AUTH_METHOD_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LAST_AUTH_METHOD_EVENT, handleCustom);
  };
}

export function setStoredLastAuthMethod(method: Exclude<LastAuthMethod, null>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(LAST_AUTH_METHOD_KEY, method);
  window.dispatchEvent(new Event(LAST_AUTH_METHOD_EVENT));
}

import { useLocation, useNavigate } from "react-router-dom";

const SUFFIXES_TO_DROP = new Set(["new", "edit", "marks"]);
    function looksLikeId(segment: string): boolean {
  // UUID-like: 8+ hex chars with dashes
  if (/^[0-9a-f]{8}-[0-9a-f-]{4,}$/i.test(segment)) return true;
  // Prefixed id: 2–5 letters + dash + alphanumerics
  if (/^[a-z]{2,5}-[a-z0-9]+$/i.test(segment)) return true;
  return false;
}

export function useReturnToList() {
  const location = useLocation();
  const navigate = useNavigate();

  return () => {
    const segments = location.pathname.split("/").filter(Boolean);

    while (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (SUFFIXES_TO_DROP.has(last) || looksLikeId(last)) {
        segments.pop();
        continue;
      }
      break;
    }

    navigate("/" + segments.join("/"));
  };
}

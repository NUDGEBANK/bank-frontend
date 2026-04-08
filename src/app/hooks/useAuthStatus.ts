import { useEffect, useState } from "react";

import { checkAuthentication } from "../lib/auth";

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = async () => {
      try {
        const nextStatus = await checkAuthentication();
        if (isMounted) {
          setIsAuthenticated(nextStatus);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      }
    };

    void syncAuthState();
    window.addEventListener("auth-change", syncAuthState);

    return () => {
      isMounted = false;
      window.removeEventListener("auth-change", syncAuthState);
    };
  }, []);

  return {
    isAuthenticated,
    isLoading: isAuthenticated === null,
  };
}

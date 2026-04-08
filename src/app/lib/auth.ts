import { getJson } from "./api";

type AuthMeResponse = {
  memberId: number;
};

export async function checkAuthStatus(): Promise<boolean> {
  try {
    await getJson<AuthMeResponse>("/api/auth/me");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return false;
    }
    throw error;
  }
}

export const checkAuthentication = checkAuthStatus;

import supabase from "@src/integrations/db/db.integration.ts";
import { getEnv as _getEnv } from "@src/utils/env/env.utils.ts";

/**
 * User fixture data
 */
export interface UserFixture {
  name: string;
  email: string;
  password: string;
  lang: string;
}

/**
 * Login response with session data
 */
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

export const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "securePassword123",
  lang: "en",
};

/**
 * Login a test user, creating the account if it doesn't exist
 *
 * @param userData User data for login/signup
 * @returns Login response with user data and access token
 */
export async function loginTestUser(userData?: UserFixture): Promise<LoginResponse> {
  // Use provided user data or default test user from environment
  const user = userData || testUser;

  try {
    // Try to login first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    // If login fails with auth/invalid_credentials, create the user
    if (signInError && signInError.message.includes("Invalid login credentials")) {
      console.log(`Creating test user: ${user.email}`);

      // Create the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            lang: user.lang,
          },
        },
      });

      if (signUpError) {
        throw new Error(`Failed to create test user: ${signUpError.message}`);
      }

      // Return the newly created user data
      return {
        user: {
          id: signUpData.user?.id || "",
          email: user.email,
          name: user.name,
        },
        token: signUpData.session?.access_token || "",
      };
    }

    if (signInError) {
      throw new Error(`Failed to login test user: ${signInError.message}`);
    }

    // Return the logged in user data
    return {
      user: {
        id: signInData.user?.id || "",
        email: user.email,
        name: user.name,
      },
      token: signInData.session?.access_token || "",
    };
  } catch (error) {
    console.error("Error in loginTestUser:", error);
    throw error;
  }
}

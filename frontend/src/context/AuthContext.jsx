import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchCurrentAccount,
  loginStoreAccount,
  logoutStoreAccount,
  registerStoreAccount,
} from "../api/client.js";

const AUTH_STORAGE_KEY = "retailStoreAuth";
const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAuth(value) {
  if (!value) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const syncAuth = async () => {
      if (!authState?.token) {
        setBootstrapping(false);
        return;
      }

      try {
        const response = await fetchCurrentAccount();
        const nextState = { token: authState.token, account: response.account };
        setAuthState(nextState);
        writeStoredAuth(nextState);
      } catch {
        setAuthState(null);
        writeStoredAuth(null);
      } finally {
        setBootstrapping(false);
      }
    };

    syncAuth();
  }, []);

  const register = async (payload) => {
    const result = await registerStoreAccount(payload);
    const nextState = { token: result.token, account: result.account };
    setAuthState(nextState);
    writeStoredAuth(nextState);
    return result;
  };

  const login = async (payload) => {
    const result = await loginStoreAccount(payload);
    const nextState = { token: result.token, account: result.account };
    setAuthState(nextState);
    writeStoredAuth(nextState);
    return result;
  };

  const logout = async () => {
    try {
      if (authState?.token) {
        await logoutStoreAccount();
      }
    } finally {
      setAuthState(null);
      writeStoredAuth(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        account: authState?.account || null,
        token: authState?.token || null,
        isAuthenticated: Boolean(authState?.token),
        bootstrapping,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export { AUTH_STORAGE_KEY };

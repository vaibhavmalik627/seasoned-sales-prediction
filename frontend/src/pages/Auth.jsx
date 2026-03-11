import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const initialRegisterState = {
  storeName: "",
  contactName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialLoginState = {
  email: "",
  password: "",
};

function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const targetPath = location.state?.from || "/dashboard";

  const registerValidationMessage = (() => {
    if (!registerForm.email) {
      return "";
    }

    if (!registerForm.email.includes("@")) {
      return "Email must be valid.";
    }

    if (registerForm.password && registerForm.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (
      registerForm.confirmPassword &&
      registerForm.password !== registerForm.confirmPassword
    ) {
      return "Passwords do not match.";
    }

    return "";
  })();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      await login(loginForm);
      navigate(targetPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (registerValidationMessage) {
      setError(registerValidationMessage);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register({
        storeName: registerForm.storeName,
        contactName: registerForm.contactName,
        email: registerForm.email,
        password: registerForm.password,
      });
      navigate(targetPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <article className="card auth-panel">
        <div className="auth-panel-head">
          <div>
            <p className="section-label">Retail Store Access</p>
            <h2>{mode === "login" ? "Login to your store account" : "Create your store account"}</h2>
          </div>
          <Link to="/" className="button auth-link">Back to Home</Link>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={`auth-toggle-button ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login to Store
          </button>
          <button
            type="button"
            className={`auth-toggle-button ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create Store Account
          </button>
        </div>

        {error && <p className="status error">{error}</p>}

        {mode === "login" ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div>
              <label><span className="auth-label-mark">@</span>Email</label>
              <input
                type="email"
                placeholder="Example: owner@store.com"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>

            <div className="password-field">
              <label><span className="auth-label-mark">PW</span>Password</label>
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowLoginPassword((current) => !current)}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
              >
                {showLoginPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="button button-primary auth-submit-button" disabled={loading}>
              {loading ? "Signing in..." : "Login to Store Account"}
            </button>

            <p className="auth-helper-copy">
              This is a demo environment. Use any email to create a test store account.
            </p>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div>
              <label><span className="auth-label-mark">ST</span>Store Name</label>
              <input
                type="text"
                placeholder="Example: Malik Clothing Store"
                value={registerForm.storeName}
                onChange={(event) => setRegisterForm((current) => ({ ...current, storeName: event.target.value }))}
                required
              />
            </div>

            <div>
              <label><span className="auth-label-mark">CT</span>Contact Name</label>
              <input
                type="text"
                placeholder="Example: Vaibhav Malik"
                value={registerForm.contactName}
                onChange={(event) => setRegisterForm((current) => ({ ...current, contactName: event.target.value }))}
                required
              />
            </div>

            <div>
              <label><span className="auth-label-mark">@</span>Email</label>
              <input
                type="email"
                placeholder="Example: owner@store.com"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>

            <div className="password-field">
              <label><span className="auth-label-mark">PW</span>Password</label>
              <input
                type={showRegisterPassword ? "text" : "password"}
                minLength="8"
                placeholder="Minimum 8 characters"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowRegisterPassword((current) => !current)}
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
              >
                {showRegisterPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="password-field">
              <label><span className="auth-label-mark">CF</span>Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                minLength="8"
                placeholder="Re-enter password"
                value={registerForm.confirmPassword}
                onChange={(event) => setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {registerValidationMessage && <p className="auth-validation">Warning: {registerValidationMessage}</p>}
            {!registerValidationMessage && registerForm.email && (
              <p className="auth-validation auth-validation-ok">Ready to create this store account.</p>
            )}

            <button
              type="submit"
              className="button button-primary auth-submit-button"
              disabled={loading || Boolean(registerValidationMessage)}
            >
              {loading ? "Creating..." : "Create Store Account"}
            </button>

            <p className="auth-helper-copy">
              This is a demo environment. Use any email to create a test store account.
            </p>
          </form>
        )}
      </article>
    </section>
  );
}

export default Auth;

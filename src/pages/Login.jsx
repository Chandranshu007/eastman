import { Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = new URLSearchParams(location.search).get("redirect") || "/";

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [loading, navigate, redirectTarget, user]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter both your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(form.email.trim(), form.password, form.rememberMe);
      navigate(redirectTarget, { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !user) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-loading">
          <div className="auth-brand">
            <span className="brand-mark auth-brand-mark">E</span>
            <span>Eastman <strong>Store</strong></span>
          </div>
          <p>Checking your account...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark auth-brand-mark">E</span>
          <span>Eastman <strong>Store</strong></span>
        </div>

        <div className="auth-header">
          <span className="eyebrow auth-eyebrow"><Sparkles size={12} aria-hidden="true" /> WELCOME BACK</span>
          <h1>Login to your account</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email address</span>
            <div className="auth-input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <LockKeyhole size={16} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </label>

          <div className="auth-row">
            <label className="checkbox-row">
              <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
              <span>Remember me</span>
            </label>
            <Link to="/register" className="auth-link">Create account</Link>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="button button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}

/**
 * Login form component
 */
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthForm.module.css";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!email || !password) {
      setError("Email and password are required");
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || "Login failed");
    } else {
      // Success
      setError("");
      if (onSuccess) {
        onSuccess();
      }
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <h2>Welcome Back</h2>
      <p className={styles.subtitle}>
        Sign in to access your personalized content
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={styles.input}
            autoComplete="email"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordGroup}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className={styles.input}
              autoComplete="current-password"
            />
            <button
              type="button"
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="remember"
            className={styles.checkbox}
            defaultChecked
          />
          <label htmlFor="remember" className={styles.checkboxLabel}>
            Remember me for 30 days
          </label>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.button} ${isLoading ? styles.loading : ""}`}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        <div className={styles.linkContainer}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onForgotPassword) {
                onForgotPassword();
              }
            }}
            className={styles.link}
          >
            Forgot password?
          </a>
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.linkContainer}>
          Don't have an account?{" "}
          <a href="/signup" className={styles.link}>
            Sign up
          </a>
        </div>
      </form>
    </div>
  );
}
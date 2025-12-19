/**
 * Signup form component
 */
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthForm.module.css";

interface SignupFormProps {
  onSuccess?: () => void;
  showQuestionnaire?: boolean;
}

export default function SignupForm({ onSuccess, showQuestionnaire = false }: SignupFormProps) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      setIsLoading(false);
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError(
        "Password must contain uppercase, lowercase, number, and special character"
      );
      setIsLoading(false);
      return;
    }

    const result = await register(email, password);

    if (!result.success) {
      setError(result.error || "Registration failed");
    } else {
      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        // Show success message
        setError("");
        alert(
          "Registration successful! Please check your email to verify your account."
        );
      }
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <h2>Create Account</h2>
      <p className={styles.subtitle}>
        Join our community and get personalized content based on your technical
        background
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
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
            className={styles.input}
          />
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="terms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className={styles.checkbox}
          />
          <label htmlFor="terms" className={styles.checkboxLabel}>
            I accept the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
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
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        <div className={styles.linkContainer}>
          Already have an account?{" "}
          <a href="/signin" className={styles.link}>
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
}
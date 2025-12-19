/**
 * Email verification component
 */
import React, { useState, useEffect } from "react";
import styles from "./AuthForm.module.css";

interface EmailVerificationProps {
  token?: string;
  onVerified?: () => void;
}

export default function EmailVerification({ token: propToken, onVerified }: EmailVerificationProps) {
  const [verificationToken] = useState(() => {
    // Get token from URL parameters (Docusaurus way)
    const urlParams = new URLSearchParams(window.location.search);
    return propToken || urlParams.get("token") || "";
  });
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (verificationToken) {
      verifyEmail();
    }
  }, [verificationToken]);

  const verifyEmail = async () => {
    setStatus("loading");
    setMessage("Verifying your email...");

    try {
      const response = await fetch(`/auth/verify-email?token=${verificationToken}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
        if (onVerified) {
          onVerified();
        }
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to verify email. The link may have expired.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        "An error occurred while verifying your email. Please try again later."
      );
    }
  };

  const resendVerification = async () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setMessage("Sending verification email...");

    try {
      const response = await fetch("/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Verification email sent! Please check your inbox.");
      } else {
        setMessage(data.error || "Failed to send verification email.");
      }
    } catch (error) {
      setMessage("Failed to send verification email. Please try again.");
    }

    setIsLoading(false);
  };

  if (!verificationToken) {
    return (
      <div className={styles.container}>
        <h2>Verify Your Email</h2>
        <p className={styles.subtitle}>
          Please enter your email address to receive a verification link
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            resendVerification();
          }}
          className={styles.form}
        >
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
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

          {message && (
            <div className={status === "error" ? styles.error : styles.success}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email}
            className={`${styles.button} ${isLoading ? styles.loading : ""}`}
          >
            {isLoading ? "Sending..." : "Send Verification Email"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Email Verification</h2>

      {status === "loading" && (
        <div className={styles.loadingMessage}>
          <div className={styles.spinner}></div>
          <p>{message}</p>
        </div>
      )}

      {status === "success" && (
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h3>Verification Successful!</h3>
          <p>{message}</p>
          <button
            onClick={() => window.location.href = "/signin"}
            className={styles.button}
          >
            Continue to Login
          </button>
        </div>
      )}

      {status === "error" && (
        <div className={styles.errorMessage}>
          <h3>Verification Failed</h3>
          <p>{message}</p>

          <div className={styles.buttonGroup}>
            <button
              onClick={() => window.location.href = "/signin"}
              className={`${styles.button} ${styles.secondary}`}
            >
              Skip for Now
            </button>
            <button
              onClick={() => {
                setEmail("");
                setStatus("loading");
                setMessage("");
              }}
              className={styles.button}
            >
              Try Different Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
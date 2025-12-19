/**
 * Signin page for user authentication
 */
import React from "react";
import Layout from "@theme/Layout";
import LoginForm from "@site/src/components/auth/LoginForm";
import styles from "./authPage.module.css";

export default function SigninPage() {
  const handleSuccess = () => {
    // Redirect to home page or dashboard after successful login
    window.location.href = "/";
  };

  const handleForgotPassword = () => {
    // Redirect to forgot password page
    window.location.href = "/forgot-password";
  };

  return (
    <Layout title="Sign In" description="Sign in to your account">
      <div className={styles.authPage}>
        <div className={styles.stepContainer}>
          <div className={styles.stepHeader}>
            <h1>Welcome Back</h1>
            <p className={styles.stepDescription}>
              Sign in to access your personalized robotics content
            </p>
          </div>

          <LoginForm
            onSuccess={handleSuccess}
            onForgotPassword={handleForgotPassword}
          />
        </div>
      </div>
    </Layout>
  );
}
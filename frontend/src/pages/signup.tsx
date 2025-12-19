/**
 * Signup page with multi-step form
 */
import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useAuth } from "../context/AuthContext";
import SignupForm from "../components/auth/SignupForm";
import Questionnaire from "../components/auth/Questionnaire";
import EmailVerification from "../components/auth/EmailVerification";
import styles from "./authPage.module.css";

const STEPS = {
  ACCOUNT: "account",
  QUESTIONNAIRE: "questionnaire",
  VERIFY: "verify",
  COMPLETE: "complete",
};

export default function SignupPage() {
  const { siteConfig } = useDocusaurusContext();
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.ACCOUNT);
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/";
    }
  }, [isAuthenticated]);

  const handleAccountCreated = (email: string, password: string) => {
    setUserData({ email, password });
    setCurrentStep(STEPS.QUESTIONNAIRE);
  };

  const handleQuestionnaireComplete = (profileData: any) => {
    // Store profile data temporarily
    sessionStorage.setItem("pendingProfile", JSON.stringify(profileData));
    setCurrentStep(STEPS.VERIFY);
  };

  const handleEmailVerified = () => {
    setCurrentStep(STEPS.COMPLETE);
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.ACCOUNT:
        return (
          <div className={styles.stepContainer}>
            <SignupForm onSuccess={handleAccountCreated} />
          </div>
        );

      case STEPS.QUESTIONNAIRE:
        return (
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <h1>Welcome to {siteConfig.title}!</h1>
              <p className={styles.stepDescription}>
                Help us personalize your experience by telling us about your technical background
              </p>
              <div className={styles.progressBar}>
                <div className={styles.progressStep} />
                <div className={styles.progressStep} />
              </div>
            </div>
            <Questionnaire onComplete={handleQuestionnaireComplete} />
            <div className={styles.buttonGroup}>
              <button
                onClick={() => setCurrentStep(STEPS.ACCOUNT)}
                className={`${styles.button} ${styles.secondary}`}
              >
                Back
              </button>
            </div>
          </div>
        );

      case STEPS.VERIFY:
        return (
          <div className={styles.stepContainer}>
            <EmailVerification onVerified={handleEmailVerified} />
          </div>
        );

      case STEPS.COMPLETE:
        return (
          <div className={styles.stepContainer}>
            <div className={styles.completionMessage}>
              <div className={styles.successIcon}>✓</div>
              <h1>You're All Set!</h1>
              <p className={styles.completionDescription}>
                Thank you for signing up! Your account has been created and verified.
                You can now access personalized content based on your technical background.
              </p>
              <button
                onClick={() => {
                  // Clear any pending data
                  sessionStorage.removeItem("pendingProfile");
                  window.location.href = "/signin";
                }}
                className={styles.button}
              >
                Sign In to Continue
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      title="Sign Up"
      description="Create an account to get personalized content"
    >
      <main className={styles.authPage}>
        {renderStep()}
      </main>
    </Layout>
  );
}
/**
 * Technical background questionnaire component
 */
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./AuthForm.module.css";

interface QuestionnaireProps {
  onComplete?: (profileData: any) => void;
}

interface FormData {
  softwareYears: string;
  softwareLanguages: string[];
  softwareFrameworks: string[];
  hardwareRobotics: boolean;
  hardwareEmbedded: boolean;
  hardwareIot: boolean;
  interests: string[];
}

const SOFTWARE_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "PHP", "Ruby", "R", "MATLAB", "SQL", "HTML/CSS"
];

const SOFTWARE_FRAMEWORKS = [
  "React", "Angular", "Vue.js", "Next.js", "Django", "Flask", "Node.js",
  "Express.js", "FastAPI", "TensorFlow", "PyTorch", "Spring Boot",
  "ASP.NET", "Rails", "Laravel", "Flutter", "Unity", "ROS", "Arduino"
];

const INTERESTS = [
  "Web Development", "Mobile Development", "Machine Learning",
  "Robotics", "Embedded Systems", "IoT", "Cloud Computing",
  "DevOps", "Cybersecurity", "Data Science", "Game Development",
  "Blockchain", "AI/LLM Development", "Computer Vision"
];

export default function Questionnaire({ onComplete }: QuestionnaireProps) {
  const { updateUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    softwareYears: "",
    softwareLanguages: [],
    softwareFrameworks: [],
    hardwareRobotics: false,
    hardwareEmbedded: false,
    hardwareIot: false,
    interests: []
  });
  const [newLanguage, setNewLanguage] = useState("");
  const [newFramework, setNewFramework] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLanguage = () => {
    if (newLanguage && !formData.softwareLanguages.includes(newLanguage)) {
      handleInputChange("softwareLanguages", [...formData.softwareLanguages, newLanguage]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (lang: string) => {
    handleInputChange(
      "softwareLanguages",
      formData.softwareLanguages.filter(l => l !== lang)
    );
  };

  const addFramework = () => {
    if (newFramework && !formData.softwareFrameworks.includes(newFramework)) {
      handleInputChange("softwareFrameworks", [...formData.softwareFrameworks, newFramework]);
      setNewFramework("");
    }
  };

  const removeFramework = (fw: string) => {
    handleInputChange(
      "softwareFrameworks",
      formData.softwareFrameworks.filter(f => f !== fw)
    );
  };

  const toggleInterest = (interest: string) => {
    const interests = formData.interests;
    if (interests.includes(interest)) {
      handleInputChange(
        "interests",
        interests.filter(i => i !== interest)
      );
    } else {
      handleInputChange("interests", [...interests, interest]);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    const profileData = {
      softwareYears: parseInt(formData.softwareYears) || 0,
      softwareLanguages: formData.softwareLanguages,
      softwareFrameworks: formData.softwareFrameworks,
      hardwareRobotics: formData.hardwareRobotics,
      hardwareEmbedded: formData.hardwareEmbedded,
      hardwareIot: formData.hardwareIot,
      interests: formData.interests
    };

    try {
      // Update user profile
      const result = await updateUserProfile(profileData);

      if (result.success) {
        if (onComplete) {
          onComplete(profileData);
        }
      } else {
        alert("Failed to save profile: " + result.error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    }

    setIsLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className={styles.stepTitle}>How many years of software development experience do you have?</h3>
            <select
              value={formData.softwareYears}
              onChange={(e) => handleInputChange("softwareYears", e.target.value)}
              className={styles.input}
            >
              <option value="">Select experience level</option>
              <option value="0">I'm just starting / Student</option>
              <option value="1">Less than 1 year</option>
              <option value="2">1-2 years</option>
              <option value="3">3-5 years</option>
              <option value="5">5-10 years</option>
              <option value="10">10+ years</option>
            </select>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className={styles.stepTitle}>Which programming languages are you familiar with?</h3>
            <p className={styles.stepDescription}>
              Select all that apply. You can also add custom languages.
            </p>

            <div className={styles.tagContainer}>
              {SOFTWARE_LANGUAGES.map(lang => (
                <div
                  key={lang}
                  className={`${styles.tag} ${formData.softwareLanguages.includes(lang) ? styles.selected : ''}`}
                  onClick={() => handleInputChange(
                    "softwareLanguages",
                    formData.softwareLanguages.includes(lang)
                      ? formData.softwareLanguages.filter(l => l !== lang)
                      : [...formData.softwareLanguages, lang]
                  )}
                >
                  {lang}
                  {formData.softwareLanguages.includes(lang) && (
                    <button onClick={(e) => { e.stopPropagation(); removeLanguage(lang); }}>×</button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add custom language"
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
              />
              <button type="button" onClick={addLanguage} className={styles.addButton}>
                Add
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className={styles.stepTitle}>Which software frameworks have you worked with?</h3>
            <p className={styles.stepDescription}>
              Select frameworks you have experience with.
            </p>

            <div className={styles.tagContainer}>
              {SOFTWARE_FRAMEWORKS.map(fw => (
                <div
                  key={fw}
                  className={`${styles.tag} ${formData.softwareFrameworks.includes(fw) ? styles.selected : ''}`}
                  onClick={() => handleInputChange(
                    "softwareFrameworks",
                    formData.softwareFrameworks.includes(fw)
                      ? formData.softwareFrameworks.filter(f => f !== fw)
                      : [...formData.softwareFrameworks, fw]
                  )}
                >
                  {fw}
                  {formData.softwareFrameworks.includes(fw) && (
                    <button onClick={(e) => { e.stopPropagation(); removeFramework(fw); }}>×</button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                value={newFramework}
                onChange={(e) => setNewFramework(e.target.value)}
                placeholder="Add custom framework"
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFramework())}
              />
              <button type="button" onClick={addFramework} className={styles.addButton}>
                Add
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h3 className={styles.stepTitle}>Do you have hardware experience?</h3>
            <p className={styles.stepDescription}>
              Select all areas where you have experience.
            </p>

            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={formData.hardwareRobotics}
                  onChange={(e) => handleInputChange("hardwareRobotics", e.target.checked)}
                />
                <div>
                  <strong>Robotics</strong>
                  <p>Industrial robots, robotic arms, autonomous systems, etc.</p>
                </div>
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={formData.hardwareEmbedded}
                  onChange={(e) => handleInputChange("hardwareEmbedded", e.target.checked)}
                />
                <div>
                  <strong>Embedded Systems</strong>
                  <p>Microcontrollers, IoT devices, firmware development, etc.</p>
                </div>
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={formData.hardwareIot}
                  onChange={(e) => handleInputChange("hardwareIot", e.target.checked)}
                />
                <div>
                  <strong>Internet of Things (IoT)</strong>
                  <p>Connected devices, sensor networks, edge computing, etc.</p>
                </div>
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3 className={styles.stepTitle}>What are your technical interests?</h3>
            <p className={styles.stepDescription}>
              Select up to 5 areas that interest you most.
            </p>

            <div className={styles.tagContainer}>
              {INTERESTS.map(interest => (
                <div
                  key={interest}
                  className={`${styles.tag} ${formData.interests.includes(interest) ? styles.selected : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = [(currentStep - 1) / 4 * 100];

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`${styles.progressStep} ${
              step < currentStep ? styles.completed : step === currentStep ? styles.active : ''
            }`}
          />
        ))}
      </div>

      {renderStep()}

      <div className={styles.buttonGroup}>
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep - 1)}
            className={`${styles.button} ${styles.secondary}`}
            disabled={isLoading}
          >
            Previous
          </button>
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            className={styles.button}
            disabled={
              (currentStep === 1 && !formData.softwareYears) ||
              (currentStep === 2 && formData.softwareLanguages.length === 0) ||
              isLoading
            }
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.button}
            disabled={isLoading || formData.interests.length === 0}
          >
            {isLoading ? "Saving..." : "Complete Setup"}
          </button>
        )}
      </div>
    </div>
  );
}
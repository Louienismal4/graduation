"use client";

import React, { useState, useEffect } from "react";
import styles from "./CinematicIntro.module.css";
import { calculateWordDelays } from "@/lib/animationUtils";

const steps = [
  "Four years ago...\nwe walked in as strangers.",
  "With dreams too big for our fears...\nand fears too heavy for our hearts.",
  "We survived deadlines, breakdowns, sleepless nights,\nand moments nobody else saw.",
  "But somehow...\nwe kept going.",
  "Every sacrifice.\nEvery late-night review.\nEvery silent prayer.\nLed us here.",
  "These aren’t just pictures.\nThey are proof that we lived this chapter.",
  "Tonight, we celebrate the present...\n...while sending memories into the future.",
];

const FINAL_TITLE_STEP = steps.length;
const FINAL_CTA_STEP = steps.length + 1;

export default function CinematicIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < FINAL_CTA_STEP) {
      let duration = 6500;

      if (currentStep < FINAL_TITLE_STEP) {
        const words = calculateWordDelays(steps[currentStep]);
        const lastWordDelay = words[words.length - 1]?.delay || 0;
        // Animation (0.8s) + Reading Time (2.5s)
        duration = (lastWordDelay + 0.8 + 2.5) * 1000;
      } else if (currentStep === FINAL_TITLE_STEP) {
        duration = 8000;
      }

      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Styles based on spec: White background, #1E2D93 text color, Playfair Display font
  const containerStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    color: "#1E2D93",
    fontFamily: "var(--font-playfair), serif",
    zIndex: 9999,
    padding: "2rem",
    cursor: currentStep < FINAL_CTA_STEP ? "pointer" : "default",
  };

  const textStyle: React.CSSProperties = {
    fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
    lineHeight: "1.5",
    whiteSpace: "pre-line",
    fontWeight: 700, // Medium weight
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: "2rem",
    padding: "0.75rem 1.5rem",
    backgroundColor: "#1E2D93",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.125rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && currentStep < FINAL_CTA_STEP) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const renderContent = () => {
    if (currentStep < FINAL_TITLE_STEP) {
      const words = calculateWordDelays(steps[currentStep]);
      return (
        <div key={currentStep} style={textStyle}>
          {words.map((word, i) => {
            const randomDuration = 4 + (i % 3);
            const randomDelay = -(i % 5);

            return (
              <React.Fragment key={i}>
                {word.isNewLine && <div className={styles.newLine} />}
                <span
                  className={styles.word}
                  style={{ animationDelay: `${word.delay}s` }}
                >
                  <span
                    className={styles.drifter}
                    style={{
                      animationDuration: `${randomDuration}s`,
                      animationDelay: `${randomDelay}s`,
                    }}
                  >
                    {word.text}
                  </span>
                </span>
                {" "}
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    if (currentStep === FINAL_TITLE_STEP) {
      return (
        <div key="step-title" className="animate-fade-in-out">
          <h1
            style={{
              fontSize: "clamp(2.5rem, 10vw, 4rem)",
              marginBottom: "1.5rem",
            }}
          >
            Graduation Time Machine
          </h1>
          <p
            style={{
              fontSize: "clamp(1.1rem, 5vw, 1.5rem)",
              maxWidth: "800px",
            }}
          >
            Lock your memories. Write your story. Meet yourself again someday.
          </p>
        </div>
      );
    }

    return (
      <div key="step-cta" className="animate-fade-in">
        <div
          style={{
            fontStyle: "italic",
            fontSize: "clamp(1.1rem, 4.5vw, 1.5rem)",
            marginBottom: "2rem",
            maxWidth: "600px",
          }}
        >
          Because years from now... you’ll want to remember who you were
          tonight.
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Enter the Time Machine
        </button>
      </div>
    );
  };

  return (
    <div
      onClick={() =>
        currentStep < FINAL_CTA_STEP && setCurrentStep((prev) => prev + 1)
      }
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Advance story step"
      style={containerStyle}
    >
      {currentStep < FINAL_CTA_STEP && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          style={{
            position: "absolute",
            top: "2rem",
            right: "2rem",
            background: "transparent",
            border: "1px solid #1E2D93",
            color: "#1E2D93",
            padding: "0.4rem 0.8rem",
            borderRadius: "4px",
            fontSize: "0.875rem",
            cursor: "pointer",
            opacity: 0.6,
            fontFamily: "inherit",
          }}
        >
          Skip
        </button>
      )}
      {renderContent()}
    </div>
  );
}

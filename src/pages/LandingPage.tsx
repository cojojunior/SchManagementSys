import { useState } from "react";
import { SplashScreen } from "@/features/landing/SplashScreen";
import { RolePicker } from "@/features/landing/RolePicker";

type Phase = "splash" | "roles";

const SESSION_KEY = "sa-landing-seen";

export default function LandingPage() {
  // Only show the splash once per browser session
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return "roles";
    } catch {
      // sessionStorage might be blocked — fall through to splash
    }
    return "splash";
  });

  function goToRoles() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
    setPhase("roles");
  }

  if (phase === "splash") {
    return <SplashScreen onComplete={goToRoles} />;
  }

  return <RolePicker />;
}

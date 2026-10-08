export interface TimeGreeting {
  greeting: string;
  subtitle: string;
}

export function getTimeGreeting(): TimeGreeting {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good morning",
      subtitle: "Start your day prepared. Find your exam in seconds."
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good afternoon",
      subtitle: "Stay on track. Check your exam date, time and venue."
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      greeting: "Good evening",
      subtitle: "Plan ahead. Your exam details are one search away."
    };
  } else {
    return {
      greeting: hour >= 23 ? "Burning the midnight oil?" : "Good night",
      subtitle: "Rest well, and be ready. Search your exam anytime."
    };
  }
}

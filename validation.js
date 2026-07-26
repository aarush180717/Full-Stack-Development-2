// Assignment 3: Strategy Design Pattern (JavaScript)

// Define character limits
export const platformLimits = {
  Twitter: 280,
  LinkedIn: 3000,
  Instagram: 2200,
};

// The strategies for validation
export const validationStrategies = {
  Twitter: (text) => text.length <= platformLimits.Twitter,
  LinkedIn: (text) => text.length <= platformLimits.LinkedIn,
  Instagram: (text) => text.length <= platformLimits.Instagram,
};

// Expose a dynamic validate function
export const validatePost = (content, platform) => {
  const strategy = validationStrategies[platform];
  if (!strategy) return false;
  return strategy(content);
};

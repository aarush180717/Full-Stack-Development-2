// Assignment 4: Mock API Integration & Reliability
export const saveDraftMock = async (data, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate random failure or forced failure
      if (shouldFail || Math.random() < 0.3) {
        reject(new Error("Network Error"));
      } else {
        if (data.content && data.content.trim() !== "") {
          resolve({ success: true, id: Date.now() });
        } else {
          reject(new Error("Invalid data: Content is empty"));
        }
      }
    }, 1000); // 1 second artificial delay
  });
};

// Retry Logic Pattern & Fault Tolerance
export const retry = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Operation failed. Retrying... (${retries} attempts left)`);
      return retry(fn, retries - 1);
    }
    throw new Error("Failed after maximum retries");
  }
};

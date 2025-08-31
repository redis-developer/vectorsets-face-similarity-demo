import toast from "react-hot-toast";

export const showErrorToast = (message: string, error?: any) => {
  // Log the full error to console for debugging
  if (error) {
    console.error("Error:", error);
  }

  // Show user-friendly toast message
  toast.error(
    message || "An error occurred. Please check the console for details.",
    {
      duration: 5000,
      position: "top-right",
      style: {
        background: "#fef2f2",
        color: "#dc2626",
        border: "1px solid #fecaca",
      },
    }
  );
};

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#f0fdf4",
      color: "#16a34a",
      border: "1px solid #bbf7d0",
    },
  });
};

export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 3000,
    position: "top-right",
    style: {
      background: "#eff6ff",
      color: "#2563eb",
      border: "1px solid #bfdbfe",
    },
  });
};

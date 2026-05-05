// // Image validation
// export function validateImage(file: File): {
//   isValid: boolean;
//   error?: string;
// } {
//   const maxSize = 5 * 1024 * 1024; // 5MB
//   const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

//   if (!allowedTypes.includes(file.type)) {
//     return {
//       isValid: false,
//       error: "Please upload a valid image file (JPEG, PNG, or WebP)",
//     };
//   }

//   if (file.size > maxSize) {
//     return {
//       isValid: false,
//       error: "Image size must be less than 5MB",
//     };
//   }

//   return { isValid: true };
// }

// // Create image preview URL
// export function createImagePreview(file: File): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       if (e.target?.result) {
//         resolve(e.target.result as string);
//       } else {
//         reject(new Error("Failed to read image file"));
//       }
//     };
//     reader.onerror = () => reject(new Error("Failed to read image file"));
//     reader.readAsDataURL(file);
//   });
// }

// // Resize image for upload
// export function resizeImage(
//   file: File,
//   maxWidth: number = 800,
//   maxHeight: number = 800
// ): Promise<File> {
//   return new Promise((resolve, reject) => {
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const img = new Image();

//     img.onload = () => {
//       const { width, height } = img;
//       let newWidth = width;
//       let newHeight = height;

//       // Calculate new dimensions
//       if (width > maxWidth || height > maxHeight) {
//         const ratio = Math.min(maxWidth / width, maxHeight / height);
//         newWidth = width * ratio;
//         newHeight = height * ratio;
//       }

//       canvas.width = newWidth;
//       canvas.height = newHeight;

//       if (ctx) {
//         ctx.drawImage(img, 0, 0, newWidth, newHeight);
//         canvas.toBlob(
//           (blob) => {
//             if (blob) {
//               const resizedFile = new File([blob], file.name, {
//                 type: file.type,
//                 lastModified: Date.now(),
//               });
//               resolve(resizedFile);
//             } else {
//               reject(new Error("Failed to resize image"));
//             }
//           },
//           file.type,
//           0.8
//         );
//       } else {
//         reject(new Error("Failed to get canvas context"));
//       }
//     };

//     img.onerror = () => reject(new Error("Failed to load image"));
//     img.src = URL.createObjectURL(file);
//   });
// }

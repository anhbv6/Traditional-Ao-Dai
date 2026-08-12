// Mock check email API
export const mockCheckEmailApi = (email: string) => {
  return new Promise<{ isTaken: boolean }>((resolve) => {
    setTimeout(() => {
      const takenEmails = [
        'taken@gmail.com',
        'taken@aodai.vn',
        'admin@aodai.vn',
        'an.nguyen@gmail.com',
      ];
      resolve({ isTaken: takenEmails.includes(email.toLowerCase().trim()) });
    }, 450);
  });
};

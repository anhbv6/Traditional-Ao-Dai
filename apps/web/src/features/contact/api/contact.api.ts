/**
 * API methods for the Contact feature
 */

export interface ContactMessageInput {
  name: string;
  contactInfo: string;
  requestType: string;
  message: string;
}

export const sendContactMessage = async (data: ContactMessageInput) => {
  // Mock API call to simulate network request delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simply log the message internally and return success
  console.log("Contact Message Submitted: ", data);

  return {
    success: true,
    message: "Message sent successfully!",
  };
};

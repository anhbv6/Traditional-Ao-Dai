import { apiClient } from '@/lib/api-client';

export interface UploadImageResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    url: string;
    publicId: string;
  };
}

/**
 * Uploads an image file to the Backend Cloudinary service
 * @param file The image file object from input type="file"
 * @param folder Target folder inside Cloudinary (e.g., 'avatars', 'products')
 */
export const uploadImageApi = async (
  file: File,
  folder: string = 'general'
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  return apiClient.post<UploadImageResponse>(
    `/api/upload?folder=${folder}`,
    formData
  );
};

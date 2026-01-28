import { ASSETS } from '../../assets';

/**
 * Stubbed AI Service
 * Gemini integration has been removed.
 * This function now returns the default placeholder directly.
 */
export const generateProductPlaceholder = async (name: string, category: string): Promise<string> => {
  return ASSETS.PRODUCT_PLACEHOLDER;
};
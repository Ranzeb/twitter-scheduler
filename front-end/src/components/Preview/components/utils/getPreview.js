import { fetchURLMetadata } from "./../../../../mocks/fetchURLMetadata";

const detectURL = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
const cacheURLs = {};
export async function getPreview(plainText) {
  const urlsList = plainText?.match(detectURL);
  // picking the first url only
  const previewURL = urlsList?.slice(-1)[0];

  if (!previewURL) return null;

  if (!cacheURLs[previewURL]) {
    cacheURLs[previewURL] = await fetchURLMetadata(previewURL);
  }

  return cacheURLs[previewURL];
}

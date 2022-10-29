export const readFileAsDataURL = (mediaFiles = []) =>
  mediaFiles.map(
    (media) =>
      new Promise((resolve, reject) => {
        let mediaReader = new FileReader();
        const type = media?.type?.split("/")[0] || "unknown";
        mediaReader.onloadend = () => {
          const newMedia = {
            idMedia: media.name,
            src: mediaReader.result,
            type
          };
          resolve(newMedia);
        };
        mediaReader.onerror = () => {
          reject(mediaReader.error);
          mediaReader.abort();
        };
        mediaReader.readAsDataURL(media);
      })
  );

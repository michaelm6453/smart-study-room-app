// Helpers for uploading media to Firebase Storage from the client.
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

const randomId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

async function uriToBlob(uri: string) {
  return await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = () => reject(new TypeError("Network request failed"));
    xhr.onload = () => {
      const blob = xhr.response;
      resolve(blob);
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

export async function uploadConditionPhoto(localUri: string, userId: string) {
  const blob = await uriToBlob(localUri);
  const storageRef = ref(storage, `condition-photos/${userId}/${randomId()}.jpg`);
  try {
    const snapshot = await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    return getDownloadURL(snapshot.ref);
  } finally {
    if (typeof (blob as any).close === "function") {
      (blob as any).close();
    }
  }
}

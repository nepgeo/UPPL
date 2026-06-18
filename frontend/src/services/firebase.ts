import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyC9PZHpHwLE2Go7YclOVj8bmPdNd_ODF5E",
  authDomain: "uppl-9fb14.firebaseapp.com",
  projectId: "uppl-9fb14",
  storageBucket: "uppl-9fb14.firebasestorage.app",
  messagingSenderId: "433456367033",
  appId: "1:433456367033:web:0eaecd1efe3d23d4f36268",
  measurementId: "G-J1LRE1SDC7"
};

const app = initializeApp(firebaseConfig);

// Direct OAuth helpers (bypasses Firebase Auth SDK which needs Identity Toolkit API)
export const getGoogleAuthToken = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        scope: "email profile openid",
        callback: (res: any) => {
          if (res.access_token) resolve(res.access_token);
          else reject(new Error(res.error || "Google auth failed"));
        },
        error_callback: (err: any) => reject(err),
      });
      client.requestAccessToken();
    };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.body.appendChild(script);
  });

export const getFacebookAuthToken = (): Promise<{ email: string; name: string }> =>
  new Promise((resolve, reject) => {
    if ((window as any).FB) {
      (window as any).FB.login(
        (res: any) => {
          if (res.authResponse) {
            (window as any).FB.api("/me?fields=email,name", (user: any) => {
              if (user.email) resolve({ email: user.email, name: user.name || user.email.split("@")[0] });
              else reject(new Error("No email from Facebook"));
            });
          } else reject(new Error("Facebook login cancelled"));
        },
        { scope: "email,public_profile", return_scopes: true }
      );
      return;
    }
    // Load Facebook SDK
    (window as any).fbAsyncInit = () => {
      (window as any).FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      (window as any).FB.login(
        (res: any) => {
          if (res.authResponse) {
            (window as any).FB.api("/me?fields=email,name", (user: any) => {
              if (user.email) resolve({ email: user.email, name: user.name || user.email.split("@")[0] });
              else reject(new Error("No email from Facebook"));
            });
          } else reject(new Error("Facebook login cancelled"));
        },
        { scope: "email,public_profile", return_scopes: true }
      );
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
    document.body.appendChild(script);
  });

export default app;
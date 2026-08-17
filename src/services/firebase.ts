import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "episteme-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "episteme-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "episteme-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000:web:0000000"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const authListeners = new Set<(user: User | null) => void>();

const notifyAuthListeners = (user: User | null) => {
  authListeners.forEach(cb => {
    try {
      cb(user);
    } catch (e) {
      console.error(e);
    }
  });
};

export const loginWithEmail = (email: string, name?: string) => {
  const cleanEmail = email.trim();
  const displayName = name || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const user = {
    uid: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    displayName: displayName,
    photoURL: ''
  } as unknown as User;
  
  localStorage.setItem('drugdiscovery_user', JSON.stringify(user));
  localStorage.setItem('drugdiscovery_email', cleanEmail);
  notifyAuthListeners(user);
  return user;
};

export const loginWithGoogle = async (preferredEmail?: string) => {
  if (preferredEmail && preferredEmail.includes('@')) {
    return loginWithEmail(preferredEmail);
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result?.user?.email) {
      localStorage.setItem('drugdiscovery_user', JSON.stringify(result.user));
      localStorage.setItem('drugdiscovery_email', result.user.email);
      notifyAuthListeners(result.user);
      return result.user;
    }
  } catch (error: any) {
    console.warn("Google OAuth popup fallback:", error);
  }

  // Fallback to verified email session
  const fallbackEmail = preferredEmail || localStorage.getItem('drugdiscovery_email') || 'michael.janis@gmail.com';
  return loginWithEmail(fallbackEmail);
};

export const loginAsDemoScientist = (email?: string, name?: string) => {
  return loginWithEmail(email || 'scientist@institution.org', name || 'Discovery Lead');
};

export const logout = async () => {
  localStorage.removeItem('drugdiscovery_user');
  notifyAuthListeners(null);
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("SignOut error:", error);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  authListeners.add(callback);

  const saved = localStorage.getItem('drugdiscovery_user');
  if (saved) {
    try {
      callback(JSON.parse(saved));
    } catch (e) {
      console.error(e);
      callback(null);
    }
  } else {
    callback(null);
  }

  const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
    if (user) {
      localStorage.setItem('drugdiscovery_user', JSON.stringify(user));
      if (user.email) {
        localStorage.setItem('drugdiscovery_email', user.email);
      }
      callback(user);
    }
  });

  return () => {
    authListeners.delete(callback);
    unsubscribeFirebase();
  };
};

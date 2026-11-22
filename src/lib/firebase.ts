import { initializeApp } from 'firebase/app';
import {
  FacebookAuthProvider,
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import type { AuthProviderKind } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export const appleAuthProvider = new OAuthProvider('apple.com');
appleAuthProvider.addScope('email');
appleAuthProvider.addScope('name');

export const facebookAuthProvider = new FacebookAuthProvider();
facebookAuthProvider.addScope('email');
facebookAuthProvider.setCustomParameters({ display: 'popup' });

export async function signInWithProvider(provider: AuthProviderKind): Promise<UserCredential> {
  if (provider === 'apple') {
    return signInWithPopup(auth, appleAuthProvider);
  }
  if (provider === 'facebook') {
    return signInWithPopup(auth, facebookAuthProvider);
  }
  return signInWithPopup(auth, googleAuthProvider);
}

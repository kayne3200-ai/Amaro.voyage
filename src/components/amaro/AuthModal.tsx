import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { KeyRound, LogIn, Mail, UserPlus, X } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';

export interface AuthModalProps {
  onClose: () => void;
  onSuccessMessage: (msg: string) => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

function mapFirebaseAuthErrorFr(code?: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà associée à un compte. Choisissez « Se connecter » ou « Mot de passe oublié ».';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/invalid-email':
      return 'Veuillez saisir une adresse e-mail valide.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives rapprochées. Veuillez patienter quelques instants avant de réessayer.';
    case 'auth/operation-not-allowed':
      return 'La connexion par e-mail/mot de passe doit être activée dans la console Firebase Authentication par le propriétaire.';
    case 'auth/popup-blocked':
      return 'La fenêtre de connexion Google a été bloquée par votre navigateur.';
    default:
      return 'Impossible de finaliser l’authentification. Vérifiez votre connexion et réessayez.';
  }
}

export function AuthModal({ onClose, onSuccessMessage }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccessMessage('Connexion Google effectuée.');
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(mapFirebaseAuthErrorFr(err?.code));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Veuillez renseigner votre adresse e-mail.');
      return;
    }

    setBusy(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, cleanEmail);
        setInfoMsg(
          'Si un compte correspond à cette adresse e-mail, un lien de réinitialisation vient de vous être envoyé.'
        );
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }

      if (mode === 'signup') {
        const cleanName = displayName.trim() || 'Voyageur AMARO';
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: cleanName.slice(0, 90) });
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Non-blocking verification e-mail dispatch
        }
        onSuccessMessage('Compte créé et connecté. Un e-mail de vérification vous a été adressé.');
        onClose();
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        onSuccessMessage('Connexion par e-mail effectuée.');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(mapFirebaseAuthErrorFr(err?.code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="amaro-auth-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="amaro-auth-title"
              className="font-display text-lg font-bold text-slate-900 dark:text-white"
            >
              {mode === 'signin'
                ? 'Connexion à AMARO.VOYAGE'
                : mode === 'signup'
                ? 'Créer un compte voyageur ou prestataire'
                : 'Réinitialiser mon mot de passe'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              L’exploration du catalogue reste libre ; le compte sert à sauvegarder et coordonner votre dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Segmented mode selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`min-h-[38px] px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`min-h-[38px] px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`min-h-[38px] px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'reset'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Mot de passe
            </button>
          </div>

          {mode !== 'reset' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGoogleSignIn()}
                className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-[#C56E33]" />
                <span>Continuer avec Google</span>
              </button>

              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span>ou par e-mail et mot de passe</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>
            </>
          )}

          <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nom ou prénom d’affichage
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex. Kossi A."
                  maxLength={90}
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Adresse e-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                maxLength={190}
                className="w-full min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                  className="w-full min-h-[42px] px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                {errorMsg}
              </p>
            )}

            {infoMsg && (
              <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                {infoMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
            >
              {mode === 'signin' && (
                <>
                  <Mail className="w-4 h-4" />
                  <span>{busy ? 'Connexion...' : 'Se connecter par e-mail'}</span>
                </>
              )}
              {mode === 'signup' && (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{busy ? 'Création...' : 'Créer mon compte'}</span>
                </>
              )}
              {mode === 'reset' && (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{busy ? 'Envoi...' : 'Recevoir le lien de réinitialisation'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, Smartphone, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { authorizedFetch } from '../../lib/apiClient';

interface OtpPhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (verifiedPhone: string) => void;
  initialPhone?: string;
  title?: string;
  description?: string;
}

export function OtpPhoneVerificationModal({
  isOpen,
  onClose,
  onVerified,
  initialPhone = '',
  title = 'Vérification du numéro de téléphone (Anti-fraude)',
  description = 'Conformément aux règles de sécurité AMARO.VOYAGE, votre numéro de téléphone doit être vérifié par code OTP WhatsApp ou SMS avant toute réservation ou engagement de dossier.',
}: OtpPhoneVerificationModalProps) {
  const [phone, setPhone] = useState<string>(initialPhone);
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [otpCode, setOtpCode] = useState<string>('');
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [demoCode, setDemoCode] = useState<string>('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/[\s\-\(\)\.]/g, '');
    if (!clean || clean.length < 8) {
      setError('Veuillez saisir un numéro de téléphone valide avec indicatif pays (ex: +229 97 00 00 00).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authorizedFetch('/api/amaro/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, channel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible d’expédier le code OTP.');
        return;
      }
      if (data.demoCode) {
        setDemoCode(data.demoCode);
      }
      setStep('otp');
    } catch {
      setError('Erreur de communication avec le serveur de vérification.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/[\s\-\(\)\.]/g, '');
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres reçu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authorizedFetch('/api/amaro/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Code de vérification invalide.');
        return;
      }
      setStep('success');
      setTimeout(() => {
        onVerified(clean);
        onClose();
      }, 1200);
    } catch {
      setError('Erreur de validation du code OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Sécurité &amp; Anti-fausses réservations</span>
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1 : Phone Input & Channel Selection */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700 dark:text-slate-300">
                Numéro de téléphone avec indicatif pays
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 97 00 00 00"
                className="w-full min-h-[42px] px-3 py-2 font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
              <span className="text-[11px] text-slate-500 block">
                Exemple : Bénin (+229), France (+33), Côte d’Ivoire (+225), Togo (+228).
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700 dark:text-slate-300">
                Canal de réception du code OTP
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp (Recommandé)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-medium transition-colors ${
                    channel === 'sms'
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-900 dark:text-teal-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span>SMS Classique</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 font-semibold text-white bg-[#0B192C] hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 rounded-xl disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi du code en cours...</span>
                </>
              ) : (
                <span>Envoyer le code OTP</span>
              )}
            </button>
          </form>
        )}

        {/* Step 2 : OTP Code Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-500 block">Code envoyé au :</span>
              <strong className="font-mono text-sm text-slate-900 dark:text-slate-100 block">
                {phone} ({channel === 'whatsapp' ? 'WhatsApp' : 'SMS'})
              </strong>
              {demoCode && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-teal-800 dark:text-teal-300">
                  <span>Code de démonstration immédiat : </span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(demoCode)}
                    className="font-mono font-bold underline ml-1"
                  >
                    {demoCode} (Cliquer pour insérer)
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium text-slate-700 dark:text-slate-300">
                Code de vérification (6 chiffres)
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 123456"
                className="w-full min-h-[44px] px-3 py-2 text-center text-lg font-mono tracking-widest bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400"
              >
                Changer de numéro
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <span>Confirmer le code</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3 : Success Screen */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-slate-900 dark:text-slate-100">
              Numéro vérifié avec succès !
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Votre identité téléphonique est validée. Vos réservations sont sécurisées.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

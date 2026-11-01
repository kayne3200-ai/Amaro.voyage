import crypto from 'crypto';
import type { IdentityDocumentType, ServiceCategory } from '../types/amaro';

export const ALLOWED_ID_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Strict upper limit per image side (450 KB binary) to block abusive payloads while keeping Firestore vault responsive
export const MAX_ID_IMAGE_BYTES = 450 * 1024;
export const MIN_ID_IMAGE_BYTES = 64;

export interface ValidatedIdentityImage {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  normalizedDataUrl: string;
  byteLength: number;
}

/**
 * Validates a Data URL (`data:image/jpeg;base64,...`) against strict MIME whitelist,
 * binary size bounds, and real binary magic bytes (JPEG, PNG, WebP).
 * Explicitly rejects SVG, HTML, scripts, PDFs, executables, or spoofed extensions.
 */
export function validateAndInspectIdentityDataUrl(
  rawInput: unknown,
  sideLabel: 'recto' | 'verso'
): { ok: true; value: ValidatedIdentityImage } | { ok: false; error: string } {
  if (typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      ok: false,
      error: `Veuillez fournir une image valide pour le ${sideLabel} du document.`,
    };
  }

  const trimmed = rawInput.trim();
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/.exec(
    trimmed
  );
  if (!match) {
    return {
      ok: false,
      error: `Format de fichier refusé pour le ${sideLabel}. Seules les photographies JPEG, PNG ou WebP sont acceptées (aucun SVG, PDF ou fichier exécutable).`,
    };
  }

  const declaredMime = match[1] as 'image/jpeg' | 'image/png' | 'image/webp';
  const cleanB64 = match[2].replace(/\s+/g, '');
  let buf: Buffer;
  try {
    buf = Buffer.from(cleanB64, 'base64');
  } catch {
    return {
      ok: false,
      error: `L’image du ${sideLabel} est illisible ou corrompue.`,
    };
  }

  if (buf.length < MIN_ID_IMAGE_BYTES) {
    return {
      ok: false,
      error: `L’image du ${sideLabel} est vide ou trop petite pour être lisible.`,
    };
  }

  if (buf.length > MAX_ID_IMAGE_BYTES) {
    return {
      ok: false,
      error: `L’image du ${sideLabel} dépasse la limite autorisée (450 Ko maximum par face après compression).`,
    };
  }

  // Real binary magic-bytes check (prevents disguised HTML/SVG/JS/EXE payloads)
  const isJpeg =
    buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;
  const isWebp =
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';

  if (
    (declaredMime === 'image/jpeg' && !isJpeg) ||
    (declaredMime === 'image/png' && !isPng) ||
    (declaredMime === 'image/webp' && !isWebp)
  ) {
    return {
      ok: false,
      error: `Contenu binaire non conforme détecté sur le ${sideLabel}. Utilisez uniquement une vraie photographie JPEG, PNG ou WebP.`,
    };
  }

  // Extra defense-in-depth: reject any embedded script/svg markers inside metadata chunks
  const headAscii = buf.subarray(0, Math.min(buf.length, 512)).toString('utf8').toLowerCase();
  if (headAscii.includes('<script') || headAscii.includes('<svg') || headAscii.includes('<?php')) {
    return {
      ok: false,
      error: `Fichier suspect refusé pour le ${sideLabel}.`,
    };
  }

  return {
    ok: true,
    value: {
      mimeType: declaredMime,
      normalizedDataUrl: `data:${declaredMime};base64,${buf.toString('base64')}`,
      byteLength: buf.length,
    },
  };
}

function deriveVaultKey(projectId: string): Buffer {
  const secretSeed =
    process.env.IDENTITY_VAULT_SECRET?.trim() ||
    `amaro-identity-vault-v1::${projectId}`;
  return crypto.createHash('sha256').update(secretSeed, 'utf8').digest();
}

export function encryptVaultPayload(plainDataUrl: string, projectId: string): string {
  if (!plainDataUrl) return '';
  const key = deriveVaultKey(projectId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainDataUrl, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptVaultPayload(cipherPayload: string, projectId: string): string {
  if (!cipherPayload) return '';
  if (!cipherPayload.startsWith('enc:v1:')) {
    throw new Error('Format de coffre chiffré invalide.');
  }
  const parts = cipherPayload.split(':');
  if (parts.length !== 5) {
    throw new Error('Enveloppe cryptographique invalide.');
  }
  const iv = Buffer.from(parts[2], 'base64');
  const authTag = Buffer.from(parts[3], 'base64');
  const ciphertext = Buffer.from(parts[4], 'base64');
  const key = deriveVaultKey(projectId);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function computeRetentionExpiryIso(scheduledDate: string, daysAfterStay = 7): string {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)
    ? new Date(`${scheduledDate}T23:59:59.000Z`)
    : new Date();
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  const expiry = new Date(safeBase.getTime() + daysAfterStay * 24 * 60 * 60 * 1000);
  return expiry.toISOString().slice(0, 10);
}

export function isRetentionExpired(retentionExpiresAt: string): boolean {
  if (!retentionExpiresAt || !/^\d{4}-\d{2}-\d{2}$/.test(retentionExpiresAt)) {
    return false;
  }
  const todayIso = new Date().toISOString().slice(0, 10);
  return todayIso > retentionExpiresAt;
}

export function isIdentityNormallyApplicable(category: ServiceCategory): boolean {
  return category === 'accommodation' || category === 'transport';
}

export function buildDefaultIdentityPurpose(category: ServiceCategory): string {
  if (category === 'accommodation') {
    return 'Enregistrement hôtelier réglementaire (fiche d’accueil voyageur exigée à l’arrivée au Bénin) et sécurisation nominative de la réservation.';
  }
  if (category === 'transport') {
    return 'Contrat nominatif de mise à disposition de véhicule / assurance transport passager.';
  }
  return 'Vérification d’identité contractuelle demandée pour finaliser cette prestation.';
}

export function documentRequiresBackSide(docType: IdentityDocumentType): boolean {
  return docType === 'national_id' || docType === 'residence_permit';
}

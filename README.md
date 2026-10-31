# AMARO.VOYAGE — Amaro Journey Intelligence

Plateforme internationale de compagnonnage de voyage, de coordination intelligente d’itinéraires (**Amaro Journey Brain**), de suivi budgétaire (**Amaro Budget Guardian**) et d’écosystème touristique vérifié.
**Premier pays opérationnel** : Bénin (*Cotonou, Abomey-Calavi, Parakou*).

---

## 1. Architecture Réelle vs Services Externes à Connecter

Conformément à la règle de transparence stricte d’AMARO.VOYAGE :

- **Opérationnel et connecté dès maintenant** :
  - **Authentification Google** via Firebase Authentication (`signInWithPopup`).
  - **Base de données Cloud Firestore réelle** (projet cloud provisionné et distinct dans `firebase-applet-config.json`), protégée par les règles Zero-Trust `firestore.rules` auditées par ESLint et déployées dans le cloud.
  - **Séparation stricte des données personnelles (PII)** dans les sous-collections privées `/users/{uid}/private/info` et `/providers/{id}/private/commercial`.
  - **Moteur serveur Express sécurisé (`server.ts` + `src/server/*`)** :
    - Vérification cryptographique des jetons d’identité Firebase côté serveur via `firebase-admin/auth` (`verifyIdToken` : signature, expiration et projet `gen-lang-client-0368830750`).
    - Création transactionnelle et autoritaire des réservations côté serveur (`POST /api/amaro/reservations`) : relecture du service publié et des barèmes `system_settings` dans Firestore, rejet de tout montant ou taux manipulé par le navigateur, contrôle obligatoire **Amaro Journey Brain** (chevauchements, temps de trajet, plafonds de visites, conflits d’hébergement), prévention atomique des doubles réservations et conservation de l’historique tarifaire (`pricingSnapshot`).
    - Calcul serveur des devis (`POST /api/amaro/finance/quote`) basé sur `serviceId` relu côté serveur.
    - Conversion multi-devises horodatée (`XOF`, `EUR`, `USD`) basée sur la parité fixe officielle BCEAO (`1 EUR = 655,957 XOF`) et flux de taux identifié (`/api/amaro/rates`).
    - **Amaro Assistant** propulsé côté serveur par Gemini (`gemini-3.8-flash`) avec accès visiteur gratuit préservé, limitation de débit anti-abus et masquage automatique des secrets (`/api/amaro/assistant`).
    - **Sauvegarde distante GitHub & compatibilité Spck Editor** (`/api/github/*`) strictement verrouillée côté serveur au compte Administrateur vérifié (`kayne3200@gmail.com` ou `/admins/{uid}`).
- **Services externes nécessitant vos contrats / clés futures (non simulés)** :
  - **Passerelle de paiement marchand Bénin & International** (ex. FedaPay, Kkiapay pour MTN MoMo / Moov Money / Celtiis Cash, ou Stripe pour cartes internationales) : en attendant vos clés marchandes et webhooks, le règlement passe par la validation manuelle supervisée par l’Administrateur.
  - **Envoi externe Email / SMS / WhatsApp** : les notifications dans l’application (`/notifications`) sont 100 % actives ; l’envoi SMS/WhatsApp nécessitera un compte fournisseur (ex. Twilio / Meta WhatsApp Cloud API).
  - **Cartographie temps réel GPS** : nécessite une clé Google Maps Platform pour le routage routier détaillé.

---

## 2. Installation, Variables Secrètes et Démarrage

1. Cloner le dépôt GitHub (`https://github.com/kayne3200-ai/Amaro.voyage.git`).
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Copier `.env.example` vers `.env` (ne jamais publier `.env` sur GitHub) :
   - `GEMINI_API_KEY` : clé API Gemini côté serveur.
   - `GITHUB_TOKEN` *(optionnel)* : jeton GitHub (PAT `repo`) utilisé uniquement pour les requêtes Administrateur authentifiées.
   - `FIREBASE_SERVICE_ACCOUNT_JSON` *(optionnel pour déploiement Cloud dédié)* : JSON d’un compte de service Firebase Admin du projet `gen-lang-client-0368830750`. Sans cette variable, le serveur vérifie déjà cryptographiquement les jetons via les clés publiques X.509 Google (`firebase-admin/auth`) et exécute les transactions Firestore via l’API REST atomique Cloud Firestore v1 soumise à `firestore.rules`.
4. Exécuter les vérifications et tests automatisés non destructifs :
   ```bash
   npm run lint
   npm test
   ```
5. Lancer le serveur de développement (port 3000) :
   ```bash
   npm run dev
   ```
6. Compiler pour la production :
   ```bash
   npm run build
   npm start
   ```

---

## 3. Collections Cloud Firestore & Sécurité

- `/users/{userId}` et `/users/{userId}/private/info` : Profil voyageur et coordonnées privées isolées.
- `/admins/{adminUid}` : Registre des administrateurs contrôlé côté serveur (aucune auto-promotion possible). Le propriétaire (`kayne3200@gmail.com`, email vérifié) est reconnu automatiquement comme administrateur principal.
- `/providers/{providerId}` et `/providers/{providerId}/private/commercial` : Profils prestataires soumis à validation administrative (`pending` → `verified`) et informations commerciales privées isolées.
- `/services/{serviceId}` : Catalogue des 7 catégories (*Hébergements, Transport, Restaurants, Sites touristiques, Traduction, Shopping, Loisirs & Bien-être*).
- `/journey_folders/{folderId}` et `/journey_folders/{folderId}/items/{itemId}` : Dossiers intelligents Amaro Journey Intelligence et étapes d’agenda protégées par Master Gate.
- `/reservations/{reservationId}` : Machine à états centralisée avec verrouillage des états terminaux (`cancelled`, `refunded`) et immuabilité des montants financiers côté client.
- `/notifications/{notificationId}` : Notifications centralisées dans l’application.
- `/cultural_stories/{storyId}` : Récits culturels béninois soumis à modération administrative.
- `/system_settings/{settingId}` et `/audit_logs/{logId}` : Paramètres de commissions par pays et journaux d’audit immuables.

---

## 4. Procédure de Sauvegarde et de Restauration (GitHub & Spck Editor Android)

1. Ouvrez l’onglet **Espaces & Sauvegarde** dans AMARO.VOYAGE.
2. Dans la section **Sauvegarde GitHub & Spck Editor**, collez votre jeton PAT GitHub (si la session a expiré), sélectionnez `kayne3200-ai/Amaro.voyage` et appuyez sur **Sauvegarder tout le code AMARO.VOYAGE sur GitHub**.
3. Vérifiez le code du commit retourné (ex. `a1b2c3d`) directement sur GitHub.
4. Sur votre téléphone Android dans **Spck Editor**, ouvrez votre projet cloné et appuyez sur **Pull** pour récupérer l’ensemble des fichiers sauvegardés.
5. **Restauration** : En cas de besoin sur un nouvel environnement, clonez `https://github.com/kayne3200-ai/Amaro.voyage.git`, restaurez les variables secrètes dans `.env`, puis redéployez `firestore.rules`.

---

## 5. Guides Rapides par Rôle (en Français Simple)

- **Guide Client / Voyageur** : Explorez librement Cotonou, Abomey-Calavi et Parakou. Connectez-vous en un clic avec Google pour créer votre **Dossier de Voyage**, vérifier votre agenda avec **Journey Brain**, contrôler votre budget en XOF/EUR/USD et envoyer vos demandes de réservation.
- **Guide Prestataire** : Connectez-vous, ouvrez **Espaces & Sauvegarde → Espace Prestataire**, soumettez votre fiche entreprise (statut initial *En attente de validation*). Une fois validé par l’administrateur, publiez vos prestations et répondez aux demandes clients (*Accepter*, *Refuser*, ou *Proposer un autre horaire*).
- **Guide Administrateur (`kayne3200@gmail.com`)** : Ouvrez **Espaces & Sauvegarde → Administration Centrale** pour valider les prestataires, approuver les récits culturels, ajuster les taux de commission par pays (0 % par défaut), confirmer manuellement les règlements hors-ligne, consulter les statistiques réelles et sauvegarder le code sur GitHub.

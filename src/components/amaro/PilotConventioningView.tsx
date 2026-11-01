import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileSignature,
  Filter,
  FolderKanban,
  Layers,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  CatalogueItem,
  CurrencyCode,
  PartnerActivationLevel,
  PilotConventionStatus,
  PilotPartnerCategory,
  PilotPartnerDoc,
  PilotStockDoc,
  PilotZoneId,
  ReservationDispatchChannel,
  ReservationDoc,
} from '../../types/amaro';
import { BENIN_PUBLIC_DIRECTORY } from '../../data/amaroRegistry';
import {
  ACTIVATION_LEVEL_LABELS,
  DISPATCH_CHANNEL_LABELS,
  DISPATCH_STATUS_LABELS,
  generateProspectionDocument,
  PILOT_CONVENTION_STATUSES,
  PILOT_PRIORITY_ZONES,
  PILOT_STATUS_LABELS,
  PROSPECTION_KIT_CATALOGUE,
  type ProspectionTemplateId,
} from '../../data/pilotConventioningData';

interface PilotConventioningViewProps {
  pilotPartners: PilotPartnerDoc[];
  pilotStocks: PilotStockDoc[];
  allCatalogueServices: CatalogueItem[];
  allReservations: ReservationDoc[];
  defaultCommissionPercent: number;
  onSavePilotPartner: (
    draft: Omit<PilotPartnerDoc, 'id' | 'updatedBy' | 'updatedAtIso'> & { id?: string }
  ) => Promise<void>;
  onDeletePilotPartner: (pilotId: string) => Promise<void>;
  onSyncPilotOfferActivation: (params: {
    pilot: PilotPartnerDoc;
    activationLevel: PartnerActivationLevel;
    priceAmount: number;
    currency: CurrencyCode;
    capacity: number;
    cancellationPolicy: string;
  }) => Promise<void>;
  onSavePilotStock: (
    draft: Omit<PilotStockDoc, 'id' | 'updatedBy' | 'updatedAtIso'> & { id?: string }
  ) => Promise<void>;
  onDeletePilotStock: (stockId: string) => Promise<void>;
  onDispatchReservationAction: (params: {
    reservationId: string;
    action:
      | 'admin_mark_dispatched'
      | 'admin_mark_send_failed'
      | 'admin_record_followup'
      | 'admin_mark_expired';
    dispatchChannel?: ReservationDispatchChannel;
    alternativeProposal?: string;
  }) => Promise<void>;
}

type PilotSubSection =
  | 'dashboard'
  | 'targeting'
  | 'crm'
  | 'stocks'
  | 'dispatch'
  | 'kit';

const PRIORITY_ZONE_IDS: ReadonlySet<string> = new Set([
  'cotonou',
  'ouidah',
  'abomey',
  'grand-popo',
  'natitingou',
]);

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export const PilotConventioningView: React.FC<PilotConventioningViewProps> = ({
  pilotPartners,
  pilotStocks,
  allCatalogueServices,
  allReservations,
  defaultCommissionPercent,
  onSavePilotPartner,
  onDeletePilotPartner,
  onSyncPilotOfferActivation,
  onSavePilotStock,
  onDeletePilotStock,
  onDispatchReservationAction,
}) => {
  const [subSection, setSubSection] = useState<PilotSubSection>('dashboard');
  const [filterZone, setFilterZone] = useState<'all' | PilotZoneId>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | PilotPartnerCategory>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PilotConventionStatus>('all');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  // CRM Editor State (All 21 Mandatory Fields from Section 2)
  const [editingPilotId, setEditingPilotId] = useState<string>('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<PilotPartnerCategory>('accommodation');
  const [cityId, setCityId] = useState<PilotZoneId>('cotonou');
  const [coveredZones, setCoveredZones] = useState('Cotonou et agglomération');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [contactNameAndRole, setContactNameAndRole] = useState('');
  const [infoSource, setInfoSource] = useState('Répertoire public vérifié Bénin');
  const [verifiedDate, setVerifiedDate] = useState(todayIsoDate());
  const [conventionStatus, setConventionStatus] = useState<PilotConventionStatus>('identified');
  const [contactStatus, setContactStatus] = useState('À contacter');
  const [negotiationStatus, setNegotiationStatus] = useState('Non démarrée');
  const [documentsReceived, setDocumentsReceived] = useState('Aucun document reçu');
  const [conventionSigned, setConventionSigned] = useState(false);
  const [conventionSignedRef, setConventionSignedRef] = useState('');
  const [registeredServiceId, setRegisteredServiceId] = useState('');
  const [tariffsConfirmed, setTariffsConfirmed] = useState(false);
  const [availabilitiesConfirmed, setAvailabilitiesConfirmed] = useState(false);
  const [allowedBookingMode, setAllowedBookingMode] = useState<
    'none' | 'level_a_verified' | 'level_b_validation' | 'level_c_instant'
  >('none');
  const [dispatchChannel, setDispatchChannel] =
    useState<ReservationDispatchChannel>('manual_concierge');
  const [nextAction, setNextAction] = useState(
    'Vérifier les coordonnées directes de la direction et envoyer le courrier pilote'
  );
  const [internalNotes, setInternalNotes] = useState('');

  // Catalogue Activation Sync Modal / Panel State
  const [syncTargetPilotId, setSyncTargetPilotId] = useState<string>('');
  const [syncLevel, setSyncLevel] = useState<PartnerActivationLevel>('level_a_verified');
  const [syncPrice, setSyncPrice] = useState<number>(35000);
  const [syncCapacity, setSyncCapacity] = useState<number>(2);
  const [syncCancellation, setSyncCancellation] = useState<string>(
    'Annulation sans frais jusqu’à 48h avant la date prévue ; au-delà, conditions contractuelles du partenaire pilote.'
  );

  // Confirmed Stock Form State (Section 8)
  const [editingStockId, setEditingStockId] = useState<string>('');
  const [stockPilotId, setStockPilotId] = useState<string>('');
  const [stockServiceId, setStockServiceId] = useState<string>('');
  const [stockUnitCode, setStockUnitCode] = useState<string>('STD-01');
  const [stockUnitLabel, setStockUnitLabel] = useState<string>(
    'Chambre Standard Climatisée'
  );
  const [stockCapacity, setStockCapacity] = useState<number>(2);
  const [stockBaggage, setStockBaggage] = useState<number>(2);
  const [stockWithDriver, setStockWithDriver] = useState<boolean>(false);
  const [stockCoverage, setStockCoverage] = useState<string>('Sur site / Zone convenue');
  const [stockStartDate, setStockStartDate] = useState<string>(todayIsoDate());
  const [stockEndDate, setStockEndDate] = useState<string>(addDaysIsoDate(60));
  const [stockTotalUnits, setStockTotalUnits] = useState<number>(3);
  const [stockBookedUnits, setStockBookedUnits] = useState<number>(0);
  const [stockPrice, setStockPrice] = useState<number>(45000);
  const [stockCancellation, setStockCancellation] = useState<string>(
    'Annulation gratuite jusqu’à 48h avant arrivée ; 1ère nuit ou journée retenue au-delà.'
  );
  const [stockInstantAgreed, setStockInstantAgreed] = useState<boolean>(true);
  const [stockSettlementMode, setStockSettlementMode] = useState<
    'pay_on_arrival_agreed' | 'online_gateway_required'
  >('pay_on_arrival_agreed');
  const [stockConfirmationSource, setStockConfirmationSource] = useState<string>(
    'Grille tarifaire et stock signés par e-mail direction'
  );
  const [stockExpiresAt, setStockExpiresAt] = useState<string>(addDaysIsoDate(30));
  const [stockStatus, setStockStatus] = useState<'active' | 'paused' | 'expired'>('active');

  // Prospection Kit & Convention Generator State (Sections 4 & 5)
  const [selectedKitPilotId, setSelectedKitPilotId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<ProspectionTemplateId>('presentation_amaro');
  const [kitCommissionPct, setKitCommissionPct] = useState<number>(
    defaultCommissionPercent > 0 ? defaultCommissionPercent : 10
  );
  const [kitResponseHours, setKitResponseHours] = useState<number>(12);
  const [editableDocText, setEditableDocText] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<string>('');

  const notify = (tone: 'ok' | 'err', text: string) => {
    setFeedbackBanner({ tone, text });
  };

  // Real directory establishments located in the 5 priority zones and 2 pilot categories (Section 3 — Zero Fictional Data)
  const realTargetedDirectoryItems = useMemo(() => {
    return BENIN_PUBLIC_DIRECTORY.filter(
      (item) =>
        PRIORITY_ZONE_IDS.has(item.cityId) &&
        (item.category === 'accommodation' || item.category === 'transport') &&
        (filterZone === 'all' || item.cityId === filterZone) &&
        (filterCategory === 'all' || item.category === filterCategory)
    );
  }, [filterZone, filterCategory]);

  const filteredPilotPartners = useMemo(() => {
    return pilotPartners.filter((p) => {
      if (filterZone !== 'all' && p.cityId !== filterZone) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterStatus !== 'all' && p.conventionStatus !== filterStatus) return false;
      return true;
    });
  }, [pilotPartners, filterZone, filterCategory, filterStatus]);

  const filteredPilotStocks = useMemo(() => {
    return pilotStocks.filter((st) => {
      if (filterZone !== 'all' && st.cityId !== filterZone) return false;
      if (filterCategory !== 'all' && st.category !== filterCategory) return false;
      return true;
    });
  }, [pilotStocks, filterZone, filterCategory]);

  // Section 12 — 100% Real Operational Pilot Dashboard Metrics (Zero Fabricated Numbers)
  const dashboardStats = useMemo(() => {
    const today = todayIsoDate();
    const scopedPartners = filteredPilotPartners;
    const partnerServiceIds = new Set(
      scopedPartners.map((p) => p.registeredServiceId).filter(Boolean)
    );

    const identifiedCount = scopedPartners.length;
    const contactedCount = scopedPartners.filter((p) =>
      [
        'contacted',
        'response_received',
        'negotiation_in_progress',
        'awaiting_documents',
        'commercial_terms_agreed',
        'convention_pending_signature',
        'convention_signed',
        'catalogue_to_complete',
        'offers_under_verification',
        'pilot_activated',
      ].includes(p.conventionStatus)
    ).length;
    const inNegotiationCount = scopedPartners.filter((p) =>
      [
        'response_received',
        'negotiation_in_progress',
        'awaiting_documents',
        'commercial_terms_agreed',
        'convention_pending_signature',
      ].includes(p.conventionStatus)
    ).length;
    const signedCount = scopedPartners.filter(
      (p) =>
        p.conventionSigned === true &&
        ['convention_signed', 'catalogue_to_complete', 'offers_under_verification', 'pilot_activated'].includes(
          p.conventionStatus
        )
    ).length;
    const activeHotels = scopedPartners.filter(
      (p) => p.conventionStatus === 'pilot_activated' && p.category === 'accommodation'
    ).length;
    const activeTransporters = scopedPartners.filter(
      (p) => p.conventionStatus === 'pilot_activated' && p.category === 'transport'
    ).length;

    const scopedServices = allCatalogueServices.filter((s) => {
      if (filterZone !== 'all' && s.cityId !== filterZone) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      return (
        partnerServiceIds.has(s.id) ||
        s.activationLevel === 'level_a_verified' ||
        s.activationLevel === 'level_b_validation' ||
        s.activationLevel === 'level_c_instant'
      );
    });

    const levelACount = scopedServices.filter(
      (s) => s.activationLevel === 'level_a_verified'
    ).length;
    const levelBCount = scopedServices.filter(
      (s) => s.activationLevel === 'level_b_validation'
    ).length;
    const levelCCount = scopedServices.filter(
      (s) => s.activationLevel === 'level_c_instant'
    ).length;

    const validConfirmedStocks = filteredPilotStocks.filter(
      (st) => st.status === 'active' && st.expiresAt.slice(0, 10) >= today
    ).length;

    const scopedReservations = allReservations.filter((r) => {
      if (filterZone !== 'all' && r.cityId !== filterZone) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      return true;
    });

    const requestsSent = scopedReservations.length;
    const confirmedReservations = scopedReservations.filter((r) =>
      ['accepted', 'awaiting_payment', 'confirmed'].includes(r.status)
    ).length;
    const rejectedOrExpired = scopedReservations.filter(
      (r) =>
        r.status === 'rejected' ||
        r.dispatchStatus === 'rejected' ||
        r.dispatchStatus === 'expired'
    ).length;
    const acceptanceRatePct =
      requestsSent > 0 ? Math.round((confirmedReservations / requestsSent) * 100) : null;

    return {
      identifiedCount,
      contactedCount,
      inNegotiationCount,
      signedCount,
      activeHotels,
      activeTransporters,
      levelACount,
      levelBCount,
      levelCCount,
      validConfirmedStocks,
      requestsSent,
      confirmedReservations,
      rejectedOrExpired,
      acceptanceRatePct,
    };
  }, [
    filteredPilotPartners,
    filteredPilotStocks,
    allCatalogueServices,
    allReservations,
    filterZone,
    filterCategory,
  ]);

  // Synchronize Prospection Document Generator when template or partner changes
  useEffect(() => {
    const selectedPartner = pilotPartners.find((p) => p.id === selectedKitPilotId);
    const zoneDef = PILOT_PRIORITY_ZONES.find(
      (z) => z.id === (selectedPartner?.cityId || 'cotonou')
    );
    const modeKey =
      selectedPartner?.allowedBookingMode && selectedPartner.allowedBookingMode !== 'none'
        ? selectedPartner.allowedBookingMode
        : 'level_b_validation';
    const docContent = generateProspectionDocument(selectedTemplateId, {
      businessName: selectedPartner?.businessName || '',
      category: selectedPartner?.category || 'accommodation',
      cityName: zoneDef?.name || 'Cotonou',
      businessAddress: selectedPartner?.businessAddress || '',
      contactName: selectedPartner?.contactNameAndRole || '',
      commissionPercent: kitCommissionPct,
      bookingModeLabel: ACTIVATION_LEVEL_LABELS[modeKey].shortLabel,
      responseDelayHours: kitResponseHours,
    });
    setEditableDocText(docContent);
  }, [
    selectedKitPilotId,
    selectedTemplateId,
    kitCommissionPct,
    kitResponseHours,
    pilotPartners,
  ]);

  const resetPilotForm = () => {
    setEditingPilotId('');
    setBusinessName('');
    setCategory('accommodation');
    setCityId('cotonou');
    setCoveredZones('Cotonou et agglomération');
    setBusinessAddress('');
    setBusinessPhone('');
    setBusinessEmail('');
    setOfficialWebsite('');
    setContactNameAndRole('');
    setInfoSource('Répertoire public vérifié Bénin');
    setVerifiedDate(todayIsoDate());
    setConventionStatus('identified');
    setContactStatus('À contacter');
    setNegotiationStatus('Non démarrée');
    setDocumentsReceived('Aucun document reçu');
    setConventionSigned(false);
    setConventionSignedRef('');
    setRegisteredServiceId('');
    setTariffsConfirmed(false);
    setAvailabilitiesConfirmed(false);
    setAllowedBookingMode('none');
    setDispatchChannel('manual_concierge');
    setNextAction(
      'Vérifier les coordonnées professionnelles directes et transmettre la demande de partenariat pilote'
    );
    setInternalNotes('');
  };

  const loadPilotIntoForm = (p: PilotPartnerDoc) => {
    setEditingPilotId(p.id);
    setBusinessName(p.businessName);
    setCategory(p.category);
    setCityId(p.cityId);
    setCoveredZones(p.coveredZones);
    setBusinessAddress(p.businessAddress);
    setBusinessPhone(p.businessPhone);
    setBusinessEmail(p.businessEmail);
    setOfficialWebsite(p.officialWebsite);
    setContactNameAndRole(p.contactNameAndRole);
    setInfoSource(p.infoSource);
    setVerifiedDate(p.verifiedDate);
    setConventionStatus(p.conventionStatus);
    setContactStatus(p.contactStatus);
    setNegotiationStatus(p.negotiationStatus);
    setDocumentsReceived(p.documentsReceived);
    setConventionSigned(p.conventionSigned);
    setConventionSignedRef(p.conventionSignedRef);
    setRegisteredServiceId(p.registeredServiceId);
    setTariffsConfirmed(p.tariffsConfirmed);
    setAvailabilitiesConfirmed(p.availabilitiesConfirmed);
    setAllowedBookingMode(p.allowedBookingMode);
    setDispatchChannel(p.dispatchChannel);
    setNextAction(p.nextAction);
    setInternalNotes(p.internalNotes);
    setSubSection('crm');
  };

  const handleImportDirectoryEstablishment = async (item: CatalogueItem) => {
    if (!PRIORITY_ZONE_IDS.has(item.cityId)) return;
    if (item.category !== 'accommodation' && item.category !== 'transport') return;

    const alreadyTracked = pilotPartners.find(
      (p) =>
        p.registeredServiceId === item.id ||
        p.businessName.toLowerCase() === item.title.toLowerCase()
    );
    if (alreadyTracked) {
      loadPilotIntoForm(alreadyTracked);
      notify(
        'ok',
        `« ${item.title} » figure déjà dans le suivi de conventionnement (ouvert pour édition).`
      );
      return;
    }

    setBusyAction(true);
    try {
      const initialStatus: PilotConventionStatus = item.contactPhone
        ? 'to_contact'
        : 'contacts_to_verify';
      await onSavePilotPartner({
        id: `pilot-${item.id}`.slice(0, 120),
        businessName: item.title.slice(0, 160),
        category: item.category,
        cityId: item.cityId as PilotZoneId,
        coveredZones:
          item.coveredCities && item.coveredCities.length > 0
            ? item.coveredCities.join(', ').slice(0, 240)
            : item.cityId,
        businessAddress: (item.address || item.cityId).slice(0, 260),
        businessPhone: (item.contactPhone || '').slice(0, 60),
        businessEmail: '',
        officialWebsite: (item.websiteUrl || '').slice(0, 300),
        contactNameAndRole: '',
        infoSource: (item.sourceName || 'Répertoire public vérifié Bénin').slice(0, 240),
        verifiedDate: item.verifiedAt || todayIsoDate(),
        conventionStatus: initialStatus,
        contactStatus: item.contactPhone
          ? 'Numéro public identifié — premier contact à initier'
          : 'Coordonnées directes direction à vérifier',
        negotiationStatus: 'Non démarrée (établissement non conventionné)',
        documentsReceived: 'Aucun document contractuel reçu',
        conventionSigned: false,
        conventionSignedRef: '',
        registeredServiceId: item.id,
        tariffsConfirmed: Boolean(item.priceKnown && item.priceAmount > 0),
        availabilitiesConfirmed: false,
        allowedBookingMode: 'none',
        dispatchChannel: 'manual_concierge',
        nextAction:
          'Contacter la direction avec le kit pilote AMARO.VOYAGE et vérifier l’interlocuteur commercial',
        internalNotes:
          'Importé depuis le répertoire public vérifié. Ne jamais présenter comme partenaire conventionné avant signature effective.',
      });
      notify(
        'ok',
        `« ${item.title} » ajouté au ciblage pilote avec le statut honnête « ${PILOT_STATUS_LABELS[initialStatus]} ».`
      );
    } catch (err: any) {
      notify('err', err?.message || 'Impossible d’importer cet établissement dans le suivi pilote.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSubmitPilotForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName.trim().length < 2) {
      notify('err', 'Veuillez renseigner le nom commercial exact de l’établissement.');
      return;
    }
    if (
      ['convention_signed', 'pilot_activated'].includes(conventionStatus) &&
      (!conventionSigned || conventionSignedRef.trim().length < 3)
    ) {
      notify(
        'err',
        'Règle d’intégrité : impossible de passer au statut « Convention signée » ou « Partenaire pilote activé » sans cocher Convention signée et saisir sa référence réelle.'
      );
      return;
    }
    if (
      allowedBookingMode === 'level_c_instant' &&
      (!conventionSigned || !tariffsConfirmed || !availabilitiesConfirmed)
    ) {
      notify(
        'err',
        'Règle Niveau C : la réservation instantanée exige cumulativement une convention signée, des tarifs confirmés et des disponibilités confirmées.'
      );
      return;
    }

    setBusyAction(true);
    try {
      await onSavePilotPartner({
        id: editingPilotId || undefined,
        businessName: businessName.trim(),
        category,
        cityId,
        coveredZones: coveredZones.trim() || cityId,
        businessAddress: businessAddress.trim(),
        businessPhone: businessPhone.trim(),
        businessEmail: businessEmail.trim(),
        officialWebsite: officialWebsite.trim(),
        contactNameAndRole: contactNameAndRole.trim(),
        infoSource: infoSource.trim() || 'Vérification directe administration AMARO',
        verifiedDate: verifiedDate.trim() || todayIsoDate(),
        conventionStatus,
        contactStatus: contactStatus.trim(),
        negotiationStatus: negotiationStatus.trim(),
        documentsReceived: documentsReceived.trim(),
        conventionSigned,
        conventionSignedRef: conventionSigned ? conventionSignedRef.trim() : '',
        registeredServiceId: registeredServiceId.trim(),
        tariffsConfirmed,
        availabilitiesConfirmed,
        allowedBookingMode,
        dispatchChannel,
        nextAction: nextAction.trim(),
        internalNotes: internalNotes.trim(),
      });
      notify('ok', `Fiche partenaire pilote « ${businessName.trim()} » enregistrée (espace privé Admin).`);
      resetPilotForm();
    } catch (err: any) {
      notify('err', err?.message || 'Échec d’enregistrement de la fiche partenaire pilote.');
    } finally {
      setBusyAction(false);
    }
  };

  const openSyncPanel = (p: PilotPartnerDoc) => {
    setSyncTargetPilotId(p.id);
    const linkedSvc = allCatalogueServices.find((s) => s.id === p.registeredServiceId);
    setSyncLevel(
      p.allowedBookingMode !== 'none'
        ? p.allowedBookingMode
        : linkedSvc?.activationLevel || 'level_a_verified'
    );
    setSyncPrice(linkedSvc?.priceAmount && linkedSvc.priceAmount > 0 ? linkedSvc.priceAmount : 35000);
    setSyncCapacity(linkedSvc?.capacity || (p.category === 'transport' ? 4 : 2));
    setSyncCancellation(
      linkedSvc?.cancellationPolicy ||
        'Annulation gratuite jusqu’à 48h avant la prestation ; conditions partenaire applicables au-delà.'
    );
  };

  const handleConfirmSyncActivation = async () => {
    const targetPilot = pilotPartners.find((p) => p.id === syncTargetPilotId);
    if (!targetPilot) return;

    if (
      (syncLevel === 'level_b_validation' || syncLevel === 'level_c_instant') &&
      !targetPilot.conventionSigned
    ) {
      notify(
        'err',
        'Intégrité commerciale : une entreprise non signataire ne peut pas être publiée comme partenaire conventionné (Niveaux B ou C). Utilisez « Annuaire référencé » ou « Niveau A · Consultation ».'
      );
      return;
    }

    setBusyAction(true);
    try {
      await onSyncPilotOfferActivation({
        pilot: targetPilot,
        activationLevel: syncLevel,
        priceAmount: syncPrice,
        currency: 'XOF',
        capacity: syncCapacity,
        cancellationPolicy: syncCancellation,
      });
      setSyncTargetPilotId('');
      notify(
        'ok',
        `Offre catalogue synchronisée pour « ${targetPilot.businessName} » (${ACTIVATION_LEVEL_LABELS[syncLevel].shortLabel}) — aucune note interne publiée.`
      );
    } catch (err: any) {
      notify('err', err?.message || 'Échec de synchronisation catalogue.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleSubmitStockForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = pilotPartners.find((p) => p.id === stockPilotId);
    if (!partner) {
      notify('err', 'Sélectionnez d’abord le partenaire pilote rattaché à ce stock.');
      return;
    }
    if (!partner.conventionSigned) {
      notify(
        'err',
        'Un stock confirmé ne peut être activé que pour un partenaire pilote ayant signé sa convention.'
      );
      return;
    }
    const targetServiceId = stockServiceId.trim() || partner.registeredServiceId.trim();
    if (!targetServiceId) {
      notify(
        'err',
        'Renseignez ou synchronisez d’abord l’identifiant de l’offre catalogue associée à ce partenaire.'
      );
      return;
    }
    if (stockBookedUnits > stockTotalUnits) {
      notify('err', 'Le nombre d’unités réservées ne peut pas dépasser le stock total confirmé.');
      return;
    }

    const linkedService = allCatalogueServices.find((s) => s.id === targetServiceId);

    setBusyAction(true);
    try {
      await onSavePilotStock({
        id: editingStockId || undefined,
        pilotId: partner.id,
        serviceId: targetServiceId,
        providerId: linkedService?.providerId || partner.id,
        providerOwnerId: linkedService?.ownerId || 'manual_concierge',
        category: partner.category,
        cityId: partner.cityId,
        unitCode: stockUnitCode.trim().toUpperCase(),
        unitLabel: stockUnitLabel.trim(),
        capacity: Math.max(1, Math.round(stockCapacity)),
        baggageCapacity: Math.max(0, Math.round(stockBaggage)),
        withDriver: partner.category === 'transport' ? stockWithDriver : false,
        pickupAndCoverageZone: stockCoverage.trim() || partner.coveredZones,
        startDate: stockStartDate,
        endDate: stockEndDate,
        totalUnits: Math.max(1, Math.round(stockTotalUnits)),
        bookedUnits: Math.max(0, Math.round(stockBookedUnits)),
        contractualPrice: Math.max(1, Math.round(stockPrice)),
        currency: 'XOF',
        cancellationRules: stockCancellation.trim(),
        instantBookingAgreed: stockInstantAgreed,
        settlementMode: stockSettlementMode,
        confirmationSource: stockConfirmationSource.trim(),
        expiresAt: stockExpiresAt,
        status: stockStatus,
      });
      notify(
        'ok',
        `Stock confirmé « ${stockUnitLabel.trim()} » enregistré (${stockBookedUnits}/${stockTotalUnits} occupé(s)).`
      );
      setEditingStockId('');
    } catch (err: any) {
      notify('err', err?.message || 'Impossible d’enregistrer ce stock confirmé.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(`${label} copié dans le presse-papiers.`);
      setTimeout(() => setCopiedNotice(''), 3500);
    } catch {
      setCopiedNotice('Copie manuelle : sélectionnez le texte dans l’éditeur.');
    }
  };

  const handleDownloadDocument = (ext: 'txt' | 'md') => {
    const partner = pilotPartners.find((p) => p.id === selectedKitPilotId);
    const slug = (partner?.businessName || 'partenaire-pilote')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const filename = `amaro-${selectedTemplateId}-${slug}.${ext}`;
    const blob = new Blob([editableDocText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dispatchReservationsQueue = useMemo(() => {
    return allReservations.filter((r) => {
      if (filterZone !== 'all' && r.cityId !== filterZone) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      return !['cancelled', 'refunded'].includes(r.status);
    });
  }, [allReservations, filterZone, filterCategory]);

  return (
    <div className="space-y-8">
      {/* Header & Governance Confidentiality Rule */}
      <div className="border-b border-[var(--color-sand-line)] pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-terracotta)] font-semibold">
            Réseau Commercial Bénin · 5 Zones Prioritaires · Zéro Donnée Fictive
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
            Partenaires pilotes — Conventionnement
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-3xl">
            Cotonou · Ouidah · Abomey · Grand-Popo · Natitingou. Les notes internes, grilles de
            négociation et contacts privés restent strictement cloisonnés dans l’espace
            administrateur et ne sont jamais exposés publiquement.
          </p>
        </div>

        {/* Sub-navigation */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'dashboard' as const, label: 'Pilotage', icon: Layers },
            { id: 'targeting' as const, label: 'Ciblage 5 zones', icon: Filter },
            {
              id: 'crm' as const,
              label: `Fiches CRM (${pilotPartners.length})`,
              icon: FolderKanban,
            },
            {
              id: 'stocks' as const,
              label: `Stocks confirmés (${pilotStocks.length})`,
              icon: ShieldCheck,
            },
            {
              id: 'dispatch' as const,
              label: `Transmissions (${dispatchReservationsQueue.length})`,
              icon: Send,
            },
            { id: 'kit' as const, label: 'Kit & Convention', icon: FileSignature },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubSection(tab.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--color-night-indigo)] text-white'
                    : 'bg-white border border-[var(--color-sand-line)] text-[var(--color-ink-main)] hover:border-[var(--color-terracotta)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedbackBanner.tone === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-[11px] underline font-medium cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Global Zone / Category / Status Filter Bar */}
      <div className="bg-[var(--color-warm-paper)] border border-[var(--color-sand-line)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
            Zone prioritaire
          </label>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value as 'all' | PilotZoneId)}
            className="w-full min-h-[44px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)] text-xs"
          >
            <option value="all">Toutes les 5 zones pilotes</option>
            {PILOT_PRIORITY_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.department})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
            Catégorie pilote
          </label>
          <select
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(e.target.value as 'all' | PilotPartnerCategory)
            }
            className="w-full min-h-[44px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)] text-xs"
          >
            <option value="all">Hôtels & Transporteurs</option>
            <option value="accommodation">
              Hébergements (Hôtels, résidences meublées, appartements)
            </option>
            <option value="transport">
              Transports (Agences, loueurs de véhicules, chauffeurs pro)
            </option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
            Statut de conventionnement (16 étapes)
          </label>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as 'all' | PilotConventionStatus)
            }
            className="w-full min-h-[44px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)] text-xs"
          >
            <option value="all">Tous les statuts ({pilotPartners.length})</option>
            {PILOT_CONVENTION_STATUSES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================================================
          1. TABLEAU DE BORD OPÉRATIONNEL DU PILOTE (Section 12)
         ===================================================================== */}
      {subSection === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: 'Partenaires identifiés CRM',
                val: dashboardStats.identifiedCount,
                sub: `${realTargetedDirectoryItems.length} rép. public ciblés`,
              },
              {
                label: 'Partenaires contactés',
                val: dashboardStats.contactedCount,
                sub: `${dashboardStats.inNegotiationCount} en négociation`,
              },
              {
                label: 'Conventions signées',
                val: dashboardStats.signedCount,
                sub: 'Preuve réf. obligatoire',
              },
              {
                label: 'Hôtels pilotes actifs',
                val: dashboardStats.activeHotels,
                sub: 'Statut 14 activé',
              },
              {
                label: 'Transporteurs actifs',
                val: dashboardStats.activeTransporters,
                sub: 'Statut 14 activé',
              },
              {
                label: 'Offres Niveau A',
                val: dashboardStats.levelACount,
                sub: 'Catalogue vérifié seul',
              },
              {
                label: 'Offres Niveau B',
                val: dashboardStats.levelBCount,
                sub: 'Validation prestataire',
              },
              {
                label: 'Offres Niveau C',
                val: dashboardStats.levelCCount,
                sub: 'Réservation instantanée',
              },
              {
                label: 'Stocks confirmés valides',
                val: dashboardStats.validConfirmedStocks,
                sub: 'Non expirés ce jour',
              },
              {
                label: 'Demandes envoyées',
                val: dashboardStats.requestsSent,
                sub:
                  dashboardStats.acceptanceRatePct !== null
                    ? `Acceptation : ${dashboardStats.acceptanceRatePct}%`
                    : 'Aucune demande reçue',
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="bg-white border border-[var(--color-sand-line)] rounded-xl p-4"
              >
                <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">
                  {metric.label}
                </p>
                <p className="font-mono tabular-nums text-2xl font-semibold text-[var(--color-ink-main)] mt-1.5">
                  {metric.val}
                </p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">{metric.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[var(--color-sand-line)] rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[var(--color-ink-muted)]">Réservations confirmées / acceptées</p>
              <p className="font-mono tabular-nums text-xl font-semibold text-emerald-800 mt-1">
                {dashboardStats.confirmedReservations}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-ink-muted)]">Demandes refusées ou expirées</p>
              <p className="font-mono tabular-nums text-xl font-semibold text-amber-800 mt-1">
                {dashboardStats.rejectedOrExpired}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-ink-muted)]">Taux d’acceptation mesuré</p>
              <p className="font-mono tabular-nums text-xl font-semibold text-[var(--color-ink-main)] mt-1">
                {dashboardStats.acceptanceRatePct !== null
                  ? `${dashboardStats.acceptanceRatePct} %`
                  : '0 demande (aucune statistique inventée)'}
              </p>
            </div>
          </div>

          {/* Strategic Overview of the 5 Priority Zones */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg font-semibold">
              Axes de prospection sur les 5 zones prioritaires du Bénin
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {PILOT_PRIORITY_ZONES.map((z) => {
                const zoneCrmCount = pilotPartners.filter((p) => p.cityId === z.id).length;
                const zoneSignedCount = pilotPartners.filter(
                  (p) => p.cityId === z.id && p.conventionSigned
                ).length;
                const zoneDirCount = BENIN_PUBLIC_DIRECTORY.filter(
                  (d) =>
                    d.cityId === z.id &&
                    (d.category === 'accommodation' || d.category === 'transport')
                ).length;

                return (
                  <div
                    key={z.id}
                    className="bg-white border border-[var(--color-sand-line)] rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h5 className="font-serif text-base font-semibold">{z.name}</h5>
                        <span className="font-mono tabular-nums text-[11px] text-[var(--color-ink-muted)]">
                          {z.department} · {zoneDirCount} rép. · {zoneCrmCount} CRM ·{' '}
                          {zoneSignedCount} signé(s)
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                        {z.prioritySummary}
                      </p>
                      <div className="mt-3 pt-3 border-t border-[var(--color-sand-line)] space-y-1.5 text-[11px]">
                        <p>
                          <strong className="text-[var(--color-ink-main)]">Hébergement :</strong>{' '}
                          <span className="text-[var(--color-ink-muted)]">
                            {z.accommodationFocus}
                          </span>
                        </p>
                        <p>
                          <strong className="text-[var(--color-ink-main)]">Transport :</strong>{' '}
                          <span className="text-[var(--color-ink-muted)]">{z.transportFocus}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterZone(z.id);
                        setSubSection('targeting');
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[var(--color-sand-line)] text-xs font-medium text-left hover:border-[var(--color-terracotta)] transition-colors cursor-pointer"
                    >
                      Ouvrir la liste de prospection de {z.name} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. CIBLAGE DES PREMIERS PARTENAIRES PAR ZONE & CATÉGORIE (Section 3)
         ===================================================================== */}
      {subSection === 'targeting' && (
        <div className="space-y-4">
          <div className="bg-[var(--color-warm-paper)] border border-[var(--color-sand-line)] rounded-xl p-4 text-xs text-[var(--color-ink-muted)]">
            <strong className="text-[var(--color-ink-main)]">
              Règle de véracité des sources :
            </strong>{' '}
            cette table réunit exclusivement des établissements réellement identifiés au Bénin dans
            le répertoire vérifié d’AMARO.VOYAGE ({realTargetedDirectoryItems.length} entrées sur
            les 5 zones pilotes). Leur présence ici sert à organiser la prospection et ne constitue
            jamais une affirmation de partenariat déjà signé.
          </div>

          <div className="bg-white border border-[var(--color-sand-line)] rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-sand-line)] text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                  <th className="py-3 px-4">Établissement réel</th>
                  <th className="py-3 px-3">Zone · Catégorie</th>
                  <th className="py-3 px-3">Coordonnées publiques connues</th>
                  <th className="py-3 px-3">Statut conventionnement</th>
                  <th className="py-3 px-4 text-right">Action prospection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand-line)]">
                {realTargetedDirectoryItems.map((item) => {
                  const crmMatch = pilotPartners.find(
                    (p) =>
                      p.registeredServiceId === item.id ||
                      p.businessName.toLowerCase() === item.title.toLowerCase()
                  );
                  return (
                    <tr key={item.id} className="hover:bg-[var(--color-warm-paper)]/50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[var(--color-ink-main)]">{item.title}</p>
                        <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                          {item.address} · Source : {item.sourceName || 'Répertoire public'}
                        </p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[var(--color-ink-muted)]">
                        <span className="capitalize font-medium text-[var(--color-ink-main)]">
                          {item.cityId}
                        </span>{' '}
                        · {item.category === 'accommodation' ? 'Hébergement' : 'Transport'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[11px] text-[var(--color-ink-muted)]">
                        {item.contactPhone ? item.contactPhone : 'Téléphone direct à vérifier'}
                        {item.websiteUrl ? ' · Site web' : ''}
                      </td>
                      <td className="py-3 px-3">
                        {crmMatch ? (
                          <span className="font-medium text-[var(--color-terracotta)]">
                            {PILOT_STATUS_LABELS[crmMatch.conventionStatus]}
                          </span>
                        ) : (
                          <span className="text-[var(--color-ink-muted)]">
                            Non inscrit au pipeline CRM
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handleImportDirectoryEstablishment(item)}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--color-night-indigo)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          {crmMatch ? 'Ouvrir fiche CRM' : 'Cibler dans le pilote'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. PIPELINE CRM & FICHE PARTENAIRE PILOTE — 21 CHAMPS & 16 STATUTS (Section 2 & 7)
         ===================================================================== */}
      {subSection === 'crm' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Form: 21 Mandatory Fields */}
          <form
            onSubmit={handleSubmitPilotForm}
            className="xl:col-span-5 bg-white border border-[var(--color-sand-line)] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-sand-line)] pb-3">
              <div>
                <h4 className="font-serif text-lg font-semibold">
                  {editingPilotId
                    ? 'Modifier la fiche partenaire pilote'
                    : 'Nouvelle fiche partenaire pilote'}
                </h4>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Confidentiel Administration · Ne jamais saisir d’entreprise fictive
                </p>
              </div>
              {editingPilotId && (
                <button
                  type="button"
                  onClick={resetPilotForm}
                  className="text-xs text-[var(--color-terracotta)] underline cursor-pointer"
                >
                  Nouvelle fiche
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">1. Nom commercial réel *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex. Azalaï Hôtel Cotonou"
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">2. Catégorie *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PilotPartnerCategory)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                >
                  <option value="accommodation">Hébergement touristique / Hôtel</option>
                  <option value="transport">Transporteur / Loueur / Chauffeur pro</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">3. Ville pilote *</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value as PilotZoneId)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                >
                  {PILOT_PRIORITY_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">3b. Zone desservie</label>
                <input
                  type="text"
                  value={coveredZones}
                  onChange={(e) => setCoveredZones(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">4. Adresse professionnelle</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">5. Téléphone professionnel</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+229 ..."
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  6. E-mail pro (privé CRM)
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">7. Site officiel / page pro</label>
                <input
                  type="text"
                  value={officialWebsite}
                  onChange={(e) => setOfficialWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  8. Contact commercial & fonction (privé)
                </label>
                <input
                  type="text"
                  value={contactNameAndRole}
                  onChange={(e) => setContactNameAndRole(e.target.value)}
                  placeholder="Nom + fonction vérifiés"
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">9. Source des informations</label>
                <input
                  type="text"
                  value={infoSource}
                  onChange={(e) => setInfoSource(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">10. Date de vérification</label>
                <input
                  type="date"
                  value={verifiedDate}
                  onChange={(e) => setVerifiedDate(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">
                  Statut officiel du conventionnement (16 statuts) *
                </label>
                <select
                  value={conventionStatus}
                  onChange={(e) =>
                    setConventionStatus(e.target.value as PilotConventionStatus)
                  }
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white font-medium"
                >
                  {PILOT_CONVENTION_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">11. Statut du contact</label>
                <input
                  type="text"
                  value={contactStatus}
                  onChange={(e) => setContactStatus(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">12. Statut de négociation</label>
                <input
                  type="text"
                  value={negotiationStatus}
                  onChange={(e) => setNegotiationStatus(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">
                  13. Documents reçus (RCCM, IFU, assurance, grille...)
                </label>
                <input
                  type="text"
                  value={documentsReceived}
                  onChange={(e) => setDocumentsReceived(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="sm:col-span-2 p-3 rounded-lg bg-[var(--color-warm-paper)] border border-[var(--color-sand-line)] space-y-2">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conventionSigned}
                    onChange={(e) => setConventionSigned(e.target.checked)}
                    className="w-4 h-4"
                  />
                  14. Convention formellement signée par les deux parties
                </label>
                {conventionSigned && (
                  <input
                    type="text"
                    value={conventionSignedRef}
                    onChange={(e) => setConventionSignedRef(e.target.value)}
                    placeholder="Référence et date de la convention signée (ex. CONV-BJ-2026-001)"
                    className="w-full min-h-[40px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)] font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block font-medium mb-1">
                  15. ID Offre catalogue rattachée
                </label>
                <input
                  type="text"
                  value={registeredServiceId}
                  onChange={(e) => setRegisteredServiceId(e.target.value)}
                  placeholder="Ex. acc-cotonou-azalai"
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Canal opérationnel de réservation
                </label>
                <select
                  value={dispatchChannel}
                  onChange={(e) =>
                    setDispatchChannel(e.target.value as ReservationDispatchChannel)
                  }
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                >
                  {Object.entries(DISPATCH_CHANNEL_LABELS).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 font-medium cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={tariffsConfirmed}
                  onChange={(e) => setTariffsConfirmed(e.target.checked)}
                  className="w-4 h-4"
                />
                16. Tarifs contractuels confirmés
              </label>

              <label className="flex items-center gap-2 font-medium cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={availabilitiesConfirmed}
                  onChange={(e) => setAvailabilitiesConfirmed(e.target.checked)}
                  className="w-4 h-4"
                />
                17. Disponibilités / stocks confirmés
              </label>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">
                  18. Mode de réservation autorisé (Niveaux A / B / C)
                </label>
                <select
                  value={allowedBookingMode}
                  onChange={(e) =>
                    setAllowedBookingMode(
                      e.target.value as
                        | 'none'
                        | 'level_a_verified'
                        | 'level_b_validation'
                        | 'level_c_instant'
                    )
                  }
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                >
                  <option value="none">Non activé (prospection / annuaire seul)</option>
                  <option value="level_a_verified">
                    Niveau A — Catalogue vérifié (consultation seule)
                  </option>
                  <option value="level_b_validation">
                    Niveau B — Réservation avec validation prestataire
                  </option>
                  <option value="level_c_instant">
                    Niveau C — Réservation instantanée sur stock confirmé
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">
                  20. Prochaine action à effectuer
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">
                  21. Notes internes confidentielles (jamais publiées)
                </label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Compte-rendu d’entretien, conditions particulières, points d’attention..."
                  className="w-full p-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busyAction}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--color-terracotta)] text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {editingPilotId
                ? 'Mettre à jour la fiche partenaire pilote'
                : 'Enregistrer dans Partenaires pilotes'}
            </button>
          </form>

          {/* CRM List & Public Catalogue Activation Sync */}
          <div className="xl:col-span-7 space-y-4">
            {syncTargetPilotId && (
              <div className="bg-[var(--color-warm-paper)] border-2 border-[var(--color-terracotta)] rounded-xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-serif text-base font-semibold">
                    Synchroniser le niveau d’activation sur le catalogue public
                  </h5>
                  <button
                    type="button"
                    onClick={() => setSyncTargetPilotId('')}
                    className="underline text-[var(--color-ink-muted)] cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
                <p className="text-[var(--color-ink-muted)]">
                  Seules les métadonnées publiques d’offre (niveau A/B/C, tarif, capacité, politique
                  d’annulation) sont publiées sur <code>/services</code>. Aucune note interne ni
                  coordonnée privée du contact commercial n’est transmise.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Niveau d’activation</label>
                    <select
                      value={syncLevel}
                      onChange={(e) =>
                        setSyncLevel(e.target.value as PartnerActivationLevel)
                      }
                      className="w-full min-h-[42px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)]"
                    >
                      <option value="directory_only">Annuaire référencé (non conventionné)</option>
                      <option value="level_a_verified">
                        Niveau A · Catalogue vérifié (consultation)
                      </option>
                      <option value="level_b_validation">
                        Niveau B · Validation prestataire (convention signée)
                      </option>
                      <option value="level_c_instant">
                        Niveau C · Instantané sur stock confirmé
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Tarif public (XOF)</label>
                    <input
                      type="number"
                      min={0}
                      value={syncPrice}
                      onChange={(e) => setSyncPrice(Number(e.target.value || 0))}
                      className="w-full min-h-[42px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Capacité par unité</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={syncCapacity}
                      onChange={(e) => setSyncCapacity(Number(e.target.value || 1))}
                      className="w-full min-h-[42px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)] font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block font-medium mb-1">
                      Conditions d’annulation affichées au voyageur
                    </label>
                    <input
                      type="text"
                      value={syncCancellation}
                      onChange={(e) => setSyncCancellation(e.target.value)}
                      className="w-full min-h-[42px] px-3 rounded-lg bg-white border border-[var(--color-sand-line)]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={handleConfirmSyncActivation}
                  className="min-h-[42px] px-4 py-2 rounded-lg bg-[var(--color-night-indigo)] text-white font-semibold cursor-pointer"
                >
                  Publier ce niveau d’activation dans le catalogue
                </button>
              </div>
            )}

            {filteredPilotPartners.length === 0 ? (
              <div className="bg-white border border-[var(--color-sand-line)] rounded-xl p-8 text-center text-xs text-[var(--color-ink-muted)]">
                Aucun partenaire pilote enregistré sur ce filtre. Utilisez l’onglet « Ciblage 5
                zones » pour importer un établissement réel du Bénin ou créez une fiche à gauche.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPilotPartners.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-[var(--color-sand-line)] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {p.category === 'accommodation' ? (
                            <Building2 className="w-4 h-4 text-[var(--color-terracotta)]" />
                          ) : (
                            <Car className="w-4 h-4 text-[var(--color-night-indigo)]" />
                          )}
                          <h5 className="font-serif text-base font-semibold">{p.businessName}</h5>
                        </div>
                        <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                          <span className="capitalize font-medium text-[var(--color-ink-main)]">
                            {p.cityId}
                          </span>{' '}
                          · {p.category === 'accommodation' ? 'Hébergement' : 'Transport'} ·{' '}
                          {PILOT_STATUS_LABELS[p.conventionStatus]} ·{' '}
                          {p.conventionSigned
                            ? `Convention signée (${p.conventionSignedRef})`
                            : 'Non conventionné'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => loadPilotIntoForm(p)}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-[var(--color-sand-line)] text-xs font-medium hover:border-[var(--color-terracotta)] cursor-pointer"
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => openSyncPanel(p)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-[var(--color-warm-paper)] border border-[var(--color-sand-line)] text-xs font-medium hover:border-[var(--color-night-indigo)] cursor-pointer inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Activer offre (A/B/C)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKitPilotId(p.id);
                            setSubSection('kit');
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-lg border border-[var(--color-sand-line)] text-xs font-medium cursor-pointer"
                        >
                          Kit / Contrat
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePilotPartner(p.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50 cursor-pointer"
                          title="Supprimer la fiche pilote"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[var(--color-sand-line)] text-[var(--color-ink-muted)]">
                      <p>
                        <strong className="text-[var(--color-ink-main)]">Contact & Canal :</strong>{' '}
                        {p.businessPhone || 'Tél. non renseigné'} ·{' '}
                        {DISPATCH_CHANNEL_LABELS[p.dispatchChannel]}
                      </p>
                      <p>
                        <strong className="text-[var(--color-ink-main)]">Vérifications :</strong>{' '}
                        Tarifs {p.tariffsConfirmed ? 'confirmés' : 'à confirmer'} · Stocks{' '}
                        {p.availabilitiesConfirmed ? 'confirmés' : 'à confirmer'} · MàJ{' '}
                        <span className="font-mono">{p.updatedAtIso?.slice(0, 10) || p.verifiedDate}</span>
                      </p>
                      <p className="sm:col-span-2">
                        <strong className="text-[var(--color-ink-main)]">Prochaine action :</strong>{' '}
                        {p.nextAction || 'Aucune action planifiée'}
                      </p>
                      {p.internalNotes && (
                        <p className="sm:col-span-2 bg-[var(--color-warm-paper)] p-2 rounded border border-[var(--color-sand-line)]">
                          <strong className="text-[var(--color-ink-main)]">
                            Note interne privée :
                          </strong>{' '}
                          {p.internalNotes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          4. GESTION DES STOCKS CONFIRMÉS HÔTELS & TRANSPORTS (Sections 8 & 10)
         ===================================================================== */}
      {subSection === 'stocks' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSubmitStockForm}
            className="xl:col-span-5 bg-white border border-[var(--color-sand-line)] rounded-xl p-5 space-y-4 text-xs"
          >
            <div className="border-b border-[var(--color-sand-line)] pb-3">
              <h4 className="font-serif text-lg font-semibold">
                Enregistrer un stock confirmé (Chambres ou Véhicules)
              </h4>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                Protection anti-double réservation atomique · Bascule automatique en Niveau B dès
                expiration.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">
                  Partenaire pilote conventionné (signé) *
                </label>
                <select
                  value={stockPilotId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setStockPilotId(id);
                    const found = pilotPartners.find((p) => p.id === id);
                    if (found) {
                      setStockServiceId(found.registeredServiceId);
                      setStockWithDriver(found.category === 'transport');
                      setStockUnitCode(found.category === 'transport' ? 'VEH-4X4-01' : 'CHB-STD-01');
                      setStockUnitLabel(
                        found.category === 'transport'
                          ? 'SUV 4x4 Climatisé avec Chauffeur'
                          : 'Chambre Double Climatisée'
                      );
                    }
                  }}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                >
                  <option value="">-- Sélectionner un partenaire signé --</option>
                  {pilotPartners
                    .filter((p) => p.conventionSigned)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.businessName} ({p.cityId} ·{' '}
                        {p.category === 'accommodation' ? 'Hôtel' : 'Transport'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">ID Offre Catalogue *</label>
                  <input
                    type="text"
                    required
                    value={stockServiceId}
                    onChange={(e) => setStockServiceId(e.target.value)}
                    placeholder="acc-cotonou-..."
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Code unité *</label>
                  <input
                    type="text"
                    required
                    value={stockUnitCode}
                    onChange={(e) => setStockUnitCode(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Type de chambre ou catégorie de véhicule *
                </label>
                <input
                  type="text"
                  required
                  value={stockUnitLabel}
                  onChange={(e) => setStockUnitLabel(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Capacité passagers / lits</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={stockCapacity}
                    onChange={(e) => setStockCapacity(Number(e.target.value || 1))}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Capacité bagages</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={stockBaggage}
                    onChange={(e) => setStockBaggage(Number(e.target.value || 0))}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockWithDriver}
                  onChange={(e) => setStockWithDriver(e.target.checked)}
                  className="w-4 h-4"
                />
                Avec chauffeur professionnel inclus (si transport)
              </label>

              <div>
                <label className="block font-medium mb-1">
                  Lieu de prise en charge & zone autorisée
                </label>
                <input
                  type="text"
                  value={stockCoverage}
                  onChange={(e) => setStockCoverage(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Début de validité</label>
                  <input
                    type="date"
                    value={stockStartDate}
                    onChange={(e) => setStockStartDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Fin de validité</label>
                  <input
                    type="date"
                    value={stockEndDate}
                    onChange={(e) => setStockEndDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Unités confirmées</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={stockTotalUnits}
                    onChange={(e) => setStockTotalUnits(Number(e.target.value || 1))}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Déjà réservées</label>
                  <input
                    type="number"
                    min={0}
                    max={stockTotalUnits}
                    value={stockBookedUnits}
                    onChange={(e) => setStockBookedUnits(Number(e.target.value || 0))}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Tarif contrat (XOF)</label>
                  <input
                    type="number"
                    min={1}
                    value={stockPrice}
                    onChange={(e) => setStockPrice(Number(e.target.value || 0))}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Règles d’annulation confirmées *</label>
                <input
                  type="text"
                  required
                  value={stockCancellation}
                  onChange={(e) => setStockCancellation(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Expiration confirmation *</label>
                  <input
                    type="date"
                    value={stockExpiresAt}
                    onChange={(e) => setStockExpiresAt(e.target.value)}
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Statut du stock</label>
                  <select
                    value={stockStatus}
                    onChange={(e) =>
                      setStockStatus(e.target.value as 'active' | 'paused' | 'expired')
                    }
                    className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                  >
                    <option value="active">Actif</option>
                    <option value="paused">En pause</option>
                    <option value="expired">Expiré</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Mode de règlement convenu</label>
                <select
                  value={stockSettlementMode}
                  onChange={(e) =>
                    setStockSettlementMode(
                      e.target.value as 'pay_on_arrival_agreed' | 'online_gateway_required'
                    )
                  }
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
                >
                  <option value="pay_on_arrival_agreed">
                    Règlement sur place convenu par contrat (compatible Niveau C)
                  </option>
                  <option value="online_gateway_required">
                    Passerelle de paiement en ligne requise (bascule auto Niveau B tant que non
                    connectée)
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={stockInstantAgreed}
                  onChange={(e) => setStockInstantAgreed(e.target.checked)}
                  className="w-4 h-4"
                />
                Accord explicite du partenaire pour la réservation instantanée (Niveau C)
              </label>

              <div>
                <label className="block font-medium mb-1">Source de confirmation du stock *</label>
                <input
                  type="text"
                  required
                  value={stockConfirmationSource}
                  onChange={(e) => setStockConfirmationSource(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busyAction}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--color-night-indigo)] text-white font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              Enregistrer ce stock confirmé
            </button>
          </form>

          {/* Stocks Table */}
          <div className="xl:col-span-7 space-y-3">
            {filteredPilotStocks.length === 0 ? (
              <div className="bg-white border border-[var(--color-sand-line)] rounded-xl p-8 text-center text-xs text-[var(--color-ink-muted)]">
                Aucun stock confirmé enregistré. Tant qu’un stock confirmé non expiré n’est pas
                présent, le serveur bascule automatiquement toute demande en Niveau B (validation
                prestataire).
              </div>
            ) : (
              filteredPilotStocks.map((st) => {
                const isExpired = st.expiresAt.slice(0, 10) < todayIsoDate();
                const remaining = Math.max(0, st.totalUnits - st.bookedUnits);
                const levelCEligible =
                  st.status === 'active' &&
                  !isExpired &&
                  st.instantBookingAgreed &&
                  st.settlementMode === 'pay_on_arrival_agreed' &&
                  remaining > 0;

                return (
                  <div
                    key={st.id}
                    className="bg-white border border-[var(--color-sand-line)] rounded-xl p-4 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-[var(--color-ink-main)]">
                          {st.unitLabel}{' '}
                          <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                            ({st.unitCode})
                          </span>
                        </p>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">
                          Offre <span className="font-mono">{st.serviceId}</span> ·{' '}
                          <span className="capitalize">{st.cityId}</span> ·{' '}
                          {st.category === 'transport'
                            ? `Véhicule (${st.withDriver ? 'avec chauffeur' : 'sans chauffeur'})`
                            : 'Hébergement'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums font-semibold text-sm">
                          {st.contractualPrice.toLocaleString('fr-FR')} {st.currency}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeletePilotStock(st.id)}
                          className="p-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
                          title="Supprimer ce stock"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--color-sand-line)] font-mono tabular-nums text-[11px]">
                      <div>
                        Dispo :{' '}
                        <strong className={remaining === 0 ? 'text-red-700' : 'text-emerald-800'}>
                          {remaining}/{st.totalUnits} libre(s)
                        </strong>{' '}
                        ({st.bookedUnits} réservé)
                      </div>
                      <div>
                        Période : {st.startDate} → {st.endDate}
                      </div>
                      <div>
                        Expire le :{' '}
                        <span className={isExpired ? 'text-red-700 font-semibold' : ''}>
                          {st.expiresAt.slice(0, 10)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {levelCEligible ? (
                        <span className="text-emerald-800 font-medium">
                          Éligible Niveau C (réservation instantanée active & anti-surbooking)
                        </span>
                      ) : remaining === 0 && st.status === 'active' && !isExpired ? (
                        <span className="text-red-700 font-medium">
                          Complet (0 unité disponible — double réservation bloquée par le serveur)
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium">
                          Bascule automatique Niveau B (stock expiré, en pause ou passerelle requise)
                        </span>
                      )}{' '}
                      · Source : {st.confirmationSource}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          5. SUIVI DES TRANSMISSIONS & RELANCES PRESTATAIRES (Sections 9 & 11)
         ===================================================================== */}
      {subSection === 'dispatch' && (
        <div className="space-y-4">
          <div className="bg-[var(--color-warm-paper)] border border-[var(--color-sand-line)] rounded-xl p-4 text-xs text-[var(--color-ink-muted)]">
            <strong className="text-[var(--color-ink-main)]">
              Transparence des canaux prestataires non équipés :
            </strong>{' '}
            aucun envoi WhatsApp ou SMS externe n’est simulé. Lorsqu’un hôtel ou transporteur n’a pas
            encore activé son Espace Prestataire AMARO, copiez la fiche de demande normalisée,
            transmettez-la sur son canal vérifié, puis enregistrez l’état réel (envoyée, échec,
            relance, expirée).
          </div>

          {dispatchReservationsQueue.length === 0 ? (
            <div className="bg-white border border-[var(--color-sand-line)] rounded-xl p-8 text-center text-xs text-[var(--color-ink-muted)]">
              Aucune réservation en cours à transmettre sur ce périmètre.
            </div>
          ) : (
            <div className="space-y-3">
              {dispatchReservationsQueue.map((r) => {
                const channel = r.dispatchChannel || 'manual_concierge';
                const dStatus = r.dispatchStatus || 'prepared';
                const summarySheet = [
                  `DEMANDE DE RÉSERVATION AMARO.VOYAGE — RÉF. ${r.id}`,
                  `Prestation : ${r.serviceTitle} (${r.cityId})`,
                  `Date & Heure demandées : ${r.scheduledDate} à ${r.scheduledTime}`,
                  `Nombre de voyageurs : ${r.participants}`,
                  `Montant prestation : ${r.providerPrice.toLocaleString('fr-FR')} ${r.currency}`,
                  `Merci de confirmer : (1) Disponible · (2) Indisponible · (3) Alternative proposée.`,
                ].join('\n');

                return (
                  <div
                    key={r.id}
                    className="bg-white border border-[var(--color-sand-line)] rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-[var(--color-ink-main)]">
                          {r.serviceTitle}
                        </p>
                        <p className="font-mono tabular-nums text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                          Réf. {r.id} · {r.scheduledDate} à {r.scheduledTime} · {r.participants}{' '}
                          pers. · Statut : {r.status}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--color-terracotta)] font-medium">
                        {DISPATCH_STATUS_LABELS[dStatus]} · Relances : {r.followUpCount || 0}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Canal : <strong>{DISPATCH_CHANNEL_LABELS[channel]}</strong>
                      {r.responseDeadlineAt
                        ? ` · Échéance de réponse : ${r.responseDeadlineAt.slice(0, 16).replace('T', ' ')} UTC`
                        : ''}
                      {r.allocatedStockId
                        ? ` · Stock alloué : ${r.allocatedStockId} (${r.allocatedUnits || 1} u.)`
                        : ''}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-sand-line)]">
                      <button
                        type="button"
                        onClick={() => handleCopyText(summarySheet, `Fiche ${r.id}`)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[var(--color-sand-line)] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copier fiche prestataire
                      </button>

                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() =>
                          onDispatchReservationAction({
                            reservationId: r.id,
                            action: 'admin_mark_dispatched',
                            dispatchChannel: 'configured_email',
                          })
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--color-night-indigo)] text-white font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marquer transmise
                      </button>

                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() =>
                          onDispatchReservationAction({
                            reservationId: r.id,
                            action: 'admin_record_followup',
                          })
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[var(--color-sand-line)] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Enregistrer une relance (+24h)
                      </button>

                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() =>
                          onDispatchReservationAction({
                            reservationId: r.id,
                            action: 'admin_mark_send_failed',
                          })
                        }
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900 font-medium cursor-pointer"
                      >
                        Signaler échec d’envoi
                      </button>

                      {r.status === 'pending_provider' && (
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            onDispatchReservationAction({
                              reservationId: r.id,
                              action: 'admin_mark_expired',
                            })
                          }
                          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-red-200 text-red-700 font-medium cursor-pointer"
                        >
                          Clôturer délai expiré
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          6. KIT COMMERCIAL & MODÈLE DE CONVENTION PARAMÉTRABLE (Sections 4, 5 & 6)
         ===================================================================== */}
      {subSection === 'kit' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-4 bg-white border border-[var(--color-sand-line)] rounded-xl p-4 space-y-4 text-xs">
            <h4 className="font-serif text-lg font-semibold">
              10 Outils de prospection & Convention pilote
            </h4>

            <div>
              <label className="block font-medium mb-1">
                Pré-remplir avec une fiche partenaire pilote
              </label>
              <select
                value={selectedKitPilotId}
                onChange={(e) => setSelectedKitPilotId(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-lg border border-[var(--color-sand-line)] bg-white"
              >
                <option value="">Modèle vierge paramétrable</option>
                {pilotPartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.businessName} ({p.cityId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Commission (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={kitCommissionPct}
                  onChange={(e) => setKitCommissionPct(Number(e.target.value || 0))}
                  className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Délai réponse (h)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={kitResponseHours}
                  onChange={(e) => setKitResponseHours(Number(e.target.value || 12))}
                  className="w-full min-h-[40px] px-3 rounded-lg border border-[var(--color-sand-line)] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[var(--color-sand-line)]">
              {PROSPECTION_KIT_CATALOGUE.map((tpl) => {
                const active = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[var(--color-night-indigo)] text-white border-[var(--color-night-indigo)]'
                        : 'bg-[var(--color-warm-paper)]/60 border-[var(--color-sand-line)] hover:border-[var(--color-terracotta)]'
                    }`}
                  >
                    <p className="font-semibold text-xs">{tpl.title}</p>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        active ? 'text-white/80' : 'text-[var(--color-ink-muted)]'
                      }`}
                    >
                      {tpl.purpose}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-8 bg-white border border-[var(--color-sand-line)] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-sand-line)] pb-3">
              <div>
                <h5 className="font-serif text-base font-semibold">
                  {PROSPECTION_KIT_CATALOGUE.find((t) => t.id === selectedTemplateId)?.title}
                </h5>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Document modifiable avant export · Aucun contrat pré-signé · Validation juridique
                  recommandée avant signature.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(editableDocText, 'Document')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[var(--color-night-indigo)] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copier
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument('txt')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[var(--color-sand-line)] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .TXT
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument('md')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[var(--color-sand-line)] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  Export .MD
                </button>
              </div>
            </div>

            {copiedNotice && (
              <p className="text-xs text-emerald-800 font-medium">{copiedNotice}</p>
            )}

            <textarea
              rows={24}
              value={editableDocText}
              onChange={(e) => setEditableDocText(e.target.value)}
              className="w-full p-4 rounded-xl bg-[var(--color-warm-paper)] border border-[var(--color-sand-line)] font-mono text-xs leading-relaxed text-[var(--color-ink-main)]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

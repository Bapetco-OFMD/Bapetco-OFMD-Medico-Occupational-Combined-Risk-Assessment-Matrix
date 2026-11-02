
/*
 * OMHSQ — Occupational Mental Health Screening Questionnaire
 * Application controller
 *
 * Privacy version: OMHSQ-PRIVACY-1.0
 *
 * IMPORTANT:
 * - This is a technical pilot.
 * - Not a diagnostic or clinical assessment tool.
 * - Not for recruitment, promotion, HR or Fitness for Work decisions.
 * - Never place Supabase service_role keys in this file.
 */

(() => {
  "use strict";

  // =========================================================
  // 1. CONFIGURATION
  // =========================================================

  const $ = (id) => document.getElementById(id);

  const CONSENT_VERSION = "OMHSQ-PRIVACY-1.0";

  const config = window.OMHSQ_CONFIG || {};

  const validConfig =
    typeof config.SUPABASE_URL === "string" &&
    config.SUPABASE_URL.includes(".supabase.co") &&
    !config.SUPABASE_URL.includes("YOUR-") &&
    typeof config.SUPABASE_PUBLISHABLE_KEY === "string" &&
    config.SUPABASE_PUBLISHABLE_KEY.length > 10 &&
    !config.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_") &&
    !config.SUPABASE_PUBLISHABLE_KEY.includes("YOUR-");

  let client = null;

  if (validConfig && window.supabase) {
    try {
      client = window.supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_PUBLISHABLE_KEY
      );
    } catch (error) {
      console.error("Supabase initialization failed:", error);
    }
  }

  let authMode = "login";
  let lang = "ar";
  let currentUser = null;
  let currentRole = null;
  let activeConsentVersion = null;
  let recoveryMode = false;
  let loading = false;

  // =========================================================
  // 2. TRANSLATIONS
  // =========================================================

  const translations = {
    en: {
      subtitle: "Occupational Mental Health Screening Questionnaire",

      pilotTitle: "Technical pilot version",

      pilotText:
        "This platform manages confidential support requests. It does not diagnose or classify mental disorders and must not be used for fitness, recruitment, employment or personnel decisions.",

      welcome: "Welcome",

      authIntro:
        "Sign in or create an account to access the confidential support platform.",

      login: "Sign in",
      signup: "Create account",
      email: "Email address",
      password: "Password",
      forgot: "Forgot password?",
      logout: "Sign out",

      recoveryTitle: "Set a new password",
      recoveryIntro: "Enter and confirm your new password.",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      savePassword: "Save password",

      stageOne: "Support services",
      workerTitle: "Support and follow-up request",
      private: "Confidential",

      workerIntro:
        "Use this form to indicate areas in which you would like information or support. You may request help without selecting any area.",

      privacyTitle: "Consent and privacy",

      privacyText:
        "Your information is stored in a restricted-access database. Authorized mental health professionals can access only the support requests assigned to them. The System Owner has elevated administrative access to records for platform governance, administration and security oversight. Administrative changes to records are recorded in the audit log. HR and operational managers have no access to individual support requests and must not use this information for recruitment, promotion or medical fitness decisions. Confidentiality may be subject to limited exceptions where there is an imminent risk to your safety or someone else's, in accordance with applicable medical and legal procedures.",

      consentText:
        "I voluntarily agree to participate and allow my information to be stored for contact and support purposes after reading the privacy statement.",

      grantConsent: "Agree and continue",
      withdrawConsent: "Withdraw my consent",

      consentNotGiven:
        "No active consent is recorded. Please review and accept the privacy statement before submitting a request.",

      consentActive:
        "Your consent is active. You may submit a support request.",

      consentWithdrawn:
        "Your consent has been withdrawn. New support requests are disabled.",

      consentUpdateRequired:
        "The privacy statement has been updated. You must withdraw your previous consent first, then review and accept the new statement to continue.",

      consentGrantedSuccess:
        "Your consent has been recorded successfully.",

      consentWithdrawSuccess:
        "Your consent has been withdrawn successfully.",

      consentWithdrawConfirm:
        "Are you sure you want to withdraw your consent? You will not be able to submit new support requests until you grant consent again.",

      consentRequired:
        "Active consent is required before submitting a request.",

      consentError:
        "Could not update your consent. Please try again.",

      domainsTitle:
        "Which areas would you like information or support about?",

      domainsHint:
        "Select any number of areas, or leave them blank.",

      dMood: "Mood and loss of interest",
      dAnxiety: "Anxiety and stress",
      dSleep: "Sleep and fatigue",
      dStress: "Work and life pressures",
      dTrauma: "Coping with an accident or traumatic experience",
      dRelationships: "Relationships and social support",
      dOther: "Another topic",

      helpTitle:
        "Would you like to be contacted by a professional for support?",

      yes: "Yes",
      no: "Not at this time",
      infoOnly: "Information only",

      safetyTitle: "Immediate safety question",

      safetyQuestion:
        "Do you feel at this moment that you might harm yourself or someone else, or that you cannot keep yourself safe?",

      preferNot: "Prefer not to answer",

      urgentHelp:
        "If you are in immediate danger, do not wait for this app: contact local emergency services or the nearest emergency department now, and ask a trusted person to stay with you. This platform is not an emergency service and is not monitored in real time.",

      notesLabel:
        "Optional note (please do not include highly sensitive details)",

      confirmText:
        "I confirm that the information I entered reflects my current wish to seek support.",

      submitRequest: "Submit confidential request",

      professionalTitle: "Professional dashboard",

      professionalIntro:
        "This dashboard displays only support requests assigned to your professional account.",

      ownerTitle: "System Owner Dashboard",
      ownerBadge: "System Owner",

      ownerIntro:
        "Restricted system-owner view of support requests and platform records.",

      ownerPrivacyNote:
        "HR and operational managers do not have access to individual psychological support records.",

      refresh: "Refresh list",
      date: "Date",
      request: "Contact request",
      domains: "Areas",
      safety: "Immediate safety",
      status: "Status",

      savedTitle: "Your request has been received",

      savedText:
        "Thank you. Your request has been saved. If you requested contact, it will be handled through the approved follow-up process. Do not use this platform in an emergency.",

      backToForm: "Return to the form",

      footer:
        "Pilot version – not for diagnosis or fitness decisions",

      noRequests: "No requests available.",

      yesShort: "Yes",
      noShort: "No",
      statusPreferNot: "Prefer not to answer",
      statusNew: "New",
      statusContacted: "Contacted",
      statusReferred: "Referred",
      statusClosed: "Closed",
      infoShort: "Information only",

      configMissing:
        "Please configure the Supabase URL and publishable key in supabase-config.js.",

      loginError:
        "Sign-in failed. Check your email and password.",

      signupSent:
        "Account created. Check your email for the confirmation link before signing in.",

      signupError:
        "Could not create the account.",

      resetSent:
        "If the address is registered, a password reset email has been sent.",

      resetError:
        "Could not send the reset email.",

      sessionError:
        "Could not verify your session.",

      roleError:
        "Your account role could not be verified. Please contact the system administrator.",

      adminError:
        "Unable to load authorized requests. Check your permissions.",

      professionalError:
        "Unable to load your assigned requests.",

      submitError:
        "Could not save your request. Please try again.",

      invalidPassword:
        "The passwords do not match or are too short.",

      passwordSaved:
        "Your password has been updated successfully.",

      passwordError:
        "Could not update your password.",

      accessDenied: "Access denied.",
      processing: "Please wait...",

      domainMood: "Mood",
      domainAnxiety: "Anxiety",
      domainSleep: "Sleep",
      domainStress: "Work and life pressures",
      domainTrauma: "Trauma",
      domainRelationships: "Relationships",
      domainOther: "Other"
    },

    ar: {
      subtitle: "استبيان الصحة النفسية المهنية",

      pilotTitle: "نسخة تأسيسية تجريبية",

      pilotText:
        "تُستخدم هذه المنصة لإدارة طلبات الدعم السري. لا تقدم تشخيصاً أو تصنيفاً نفسياً، ولا تستخدم في قرارات اللياقة أو التوظيف أو الوضع الوظيفي.",

      welcome: "مرحباً بك",

      authIntro:
        "سجّل الدخول أو أنشئ حساباً للوصول إلى منصة الدعم السري.",

      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      forgot: "نسيت كلمة المرور؟",
      logout: "تسجيل الخروج",

      recoveryTitle: "تعيين كلمة مرور جديدة",
      recoveryIntro: "أدخل كلمة المرور الجديدة وأكدها.",
      newPassword: "كلمة المرور الجديدة",
      confirmPassword: "تأكيد كلمة المرور",
      savePassword: "حفظ كلمة المرور",

      stageOne: "خدمات الدعم",
      workerTitle: "طلب الدعم والمتابعة",
      private: "سري",

      workerIntro:
        "يتيح لك هذا النموذج تحديد مجالات الدعم التي ترغب في مناقشتها. يمكنك طلب المساعدة حتى دون تحديد أي مجال.",

      privacyTitle: "الموافقة والخصوصية",

      privacyText:
        "تُحفظ بياناتك في قاعدة بيانات مقيّدة الوصول. يستطيع المختص النفسي المخوّل الاطلاع على طلبات الدعم المسندة إليه فقط، بينما يمتلك مالك النظام صلاحية إدارية عليا تتيح له الاطلاع على السجلات لأغراض إدارة المنصة وحوكمتها ومراجعة أمنها، وتُسجّل التغييرات الإدارية على السجلات وفق سجل التدقيق. لا تملك إدارة الموارد البشرية أو المديرون التشغيليون صلاحية الاطلاع على طلبات الدعم الفردية أو استخدامها في قرارات التوظيف أو الترقية أو اللياقة الطبية. وقد تُطبق استثناءات السرية عند وجود خطر وشيك على سلامتك أو سلامة الآخرين، وفق الإجراءات الطبية والقانونية المعمول بها.",

      consentText:
        "أوافق طوعياً على المشاركة وحفظ المعلومات لغرض التواصل وتقديم الدعم، بعد قراءة بيان الخصوصية.",

      grantConsent: "الموافقة والمتابعة",
      withdrawConsent: "سحب الموافقة",

      consentNotGiven:
        "لا توجد موافقة سارية مسجلة. يرجى قراءة بيان الخصوصية والموافقة عليه قبل إرسال أي طلب.",

      consentActive:
        "موافقتك سارية. يمكنك الآن إرسال طلب الدعم.",

      consentWithdrawn:
        "تم سحب موافقتك. لن تتمكن من إرسال طلبات دعم جديدة حتى تمنح الموافقة مجدداً.",

      consentUpdateRequired:
        "تم تحديث بيان الخصوصية. يلزم سحب الموافقة السابقة أولاً، ثم مراجعة البيان الجديد والموافقة عليه للمتابعة.",

      consentGrantedSuccess:
        "تم تسجيل موافقتك بنجاح.",

      consentWithdrawSuccess:
        "تم سحب موافقتك بنجاح.",

      consentWithdrawConfirm:
        "هل أنت متأكد من سحب الموافقة؟ لن تتمكن من إرسال طلبات دعم جديدة حتى تمنح الموافقة مرة أخرى.",

      consentRequired:
        "يجب وجود موافقة سارية قبل إرسال الطلب.",

      consentError:
        "تعذر تحديث الموافقة. يرجى المحاولة مرة أخرى.",

      domainsTitle:
        "ما المجالات التي ترغب في الحصول على معلومات أو دعم بشأنها؟",

      domainsHint:
        "يمكنك اختيار أكثر من مجال أو تركها دون تحديد.",

      dMood: "المزاج وفقدان الاهتمام",
      dAnxiety: "القلق والتوتر",
      dSleep: "النوم والإرهاق",
      dStress: "ضغوط العمل والحياة",
      dTrauma: "التعامل مع حادث أو تجربة صادمة",
      dRelationships: "العلاقات والدعم الاجتماعي",
      dOther: "موضوع آخر",

      helpTitle:
        "هل ترغب في التواصل مع مختص لتقديم الدعم؟",

      yes: "نعم",
      no: "لا حالياً",
      infoOnly: "أرغب في معلومات فقط",

      safetyTitle: "سؤال السلامة العاجلة",

      safetyQuestion:
        "هل تشعر الآن أنك قد تؤذي نفسك أو شخصاً آخر، أو أنك غير قادر على الحفاظ على سلامتك؟",

      preferNot: "أفضل عدم الإجابة",

      urgentHelp:
        "إذا كنت في خطر فوري، لا تنتظر رد التطبيق: تواصل فوراً مع خدمات الطوارئ المحلية أو أقرب قسم طوارئ، واطلب من شخص موثوق البقاء معك. هذه المنصة ليست خدمة طوارئ ولا تتم مراقبتها لحظياً.",

      notesLabel:
        "ملاحظة اختيارية (يرجى عدم كتابة تفاصيل شديدة الحساسية)",

      confirmText:
        "أؤكد أن المعلومات التي أدخلتها تعبر عن رغبتي الحالية في طلب الدعم.",

      submitRequest: "إرسال الطلب السري",

      professionalTitle: "لوحة المختص النفسي",

      professionalIntro:
        "تعرض هذه اللوحة طلبات الدعم المسندة إلى حسابك المهني فقط.",

      ownerTitle: "لوحة مالك النظام",
      ownerBadge: "مالك النظام",

      ownerIntro:
        "عرض مقيّد لمالك النظام لمراجعة طلبات الدعم وسجلات المنصة وفق الصلاحيات المعتمدة.",

      ownerPrivacyNote:
        "لا تملك الموارد البشرية أو المديرون التشغيليون صلاحية الاطلاع على سجلات الدعم النفسي الفردية.",

      refresh: "تحديث القائمة",
      date: "التاريخ",
      request: "طلب التواصل",
      domains: "المجالات",
      safety: "السلامة العاجلة",
      status: "الحالة",

      savedTitle: "تم استلام طلبك",

      savedText:
        "شكراً لك. تم حفظ طلبك. إذا طلبت التواصل، فسيتم التعامل معه وفق آلية المتابعة المعتمدة. لا تستخدم هذه المنصة في حالات الطوارئ.",

      backToForm: "العودة إلى النموذج",

      footer:
        "نسخة تجريبية – لا تستخدم للتشخيص أو قرارات اللياقة",

      noRequests: "لا توجد طلبات متاحة.",

      yesShort: "نعم",
      noShort: "لا",
      statusPreferNot: "أفضل عدم الإجابة",
      statusNew: "جديد",
      statusContacted: "تم التواصل",
      statusReferred: "تمت الإحالة",
      statusClosed: "مغلق",
      infoShort: "معلومات فقط",

      configMissing:
        "يرجى إدخال رابط مشروع Supabase والمفتاح العام في ملف supabase-config.js.",

      loginError:
        "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.",

      signupSent:
        "تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.",

      signupError:
        "تعذر إنشاء الحساب.",

      resetSent:
        "إذا كان البريد مسجلاً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.",

      resetError:
        "تعذر إرسال رسالة إعادة تعيين كلمة المرور.",

      sessionError:
        "تعذر التحقق من جلسة الدخول.",

      roleError:
        "تعذر التحقق من صلاحية حسابك. يرجى التواصل مع مسؤول النظام.",

      adminError:
        "تعذر تحميل الطلبات. تحقق من الصلاحيات.",

      professionalError:
        "تعذر تحميل الطلبات المسندة إليك.",

      submitError:
        "تعذر حفظ الطلب. يرجى المحاولة مرة أخرى.",

      invalidPassword:
        "كلمتا المرور غير متطابقتين أو كلمة المرور قصيرة.",

      passwordSaved:
        "تم تحديث كلمة المرور بنجاح.",

      passwordError:
        "تعذر تحديث كلمة المرور.",

      accessDenied: "غير مصرح بالوصول.",
      processing: "يرجى الانتظار...",

      domainMood: "المزاج",
      domainAnxiety: "القلق",
      domainSleep: "النوم",
      domainStress: "ضغوط العمل والحياة",
      domainTrauma: "التجارب الصادمة",
      domainRelationships: "العلاقات",
      domainOther: "موضوع آخر"
    }
  };

  const t = (key) => translations[lang][key] || key;

  // =========================================================
  // 3. GENERAL UI HELPERS
  // =========================================================

  function show(id) {
    const element = $(id);
    if (element) element.classList.remove("hidden");
  }

  function hide(id) {
    const element = $(id);
    if (element) element.classList.add("hidden");
  }

  function message(id, text, kind = "") {
    const element = $(id);
    if (!element) return;

    element.textContent = text || "";
    element.className = `message ${kind}`;
  }

  function setBusy(button, busy, label) {
    if (!button) return;

    button.disabled = busy;

    if (label !== undefined) {
      button.textContent = label;
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString(
      lang === "ar" ? "ar-EG" : "en-GB"
    );
  }

  function translateDomain(value) {
    const keys = {
      mood: "domainMood",
      anxiety: "domainAnxiety",
      sleep: "domainSleep",
      stress: "domainStress",
      trauma: "domainTrauma",
      relationships: "domainRelationships",
      other: "domainOther"
    };

    return keys[value] ? t(keys[value]) : value;
  }

  function translateStatus(value) {
    const keys = {
      new: "statusNew",
      contacted: "statusContacted",
      referred: "statusReferred",
      closed: "statusClosed"
    };

    return keys[value] ? t(keys[value]) : (value || "—");
  }

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;

      if (
        Object.prototype.hasOwnProperty.call(
          translations[lang],
          key
        )
      ) {
        element.textContent = t(key);
      }
    });

    if ($("languageBtn")) {
      $("languageBtn").textContent =
        lang === "ar" ? "English" : "العربية";
    }

    if ($("authSubmit")) {
      $("authSubmit").textContent = t(authMode);
    }

    if ($("password")) {
      $("password").autocomplete =
        authMode === "login"
          ? "current-password"
          : "new-password";
    }

    if (currentUser && currentRole === "professional") {
      loadProfessionalRequests();
    }

    if (currentUser && currentRole === "super_admin") {
      loadOwnerRequests();
    }
  }

  // =========================================================
  // 4. AUTHENTICATION UI
  // =========================================================

  function setAuthMode(mode) {
    authMode = mode;

    if ($("loginTab")) {
      $("loginTab").classList.toggle("active", mode === "login");
    }

    if ($("signupTab")) {
      $("signupTab").classList.toggle("active", mode === "signup");
    }

    if ($("authSubmit")) {
      $("authSubmit").textContent = t(mode);
    }

    if ($("forgotBtn")) {
      $("forgotBtn").classList.toggle("hidden", mode !== "login");
    }

    message("authMessage", "");
  }

  function hideAllPanels() {
    [
      "authPanel",
      "recoveryPanel",
      "workerPanel",
      "professionalPanel",
      "ownerPanel",
      "confirmationPanel"
    ].forEach(hide);
  }

  // =========================================================
  // 5. CONSENT MANAGEMENT
  // =========================================================

  async function loadConsentState() {
    if (!client || !currentUser) return false;

    message("consentMessage", "");

    const { data, error } = await client
      .from("omhsq_consent_records")
      .select("id, action, consent_version, created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Consent read error:", error);
      message("consentMessage", t("consentError"), "error");
      return false;
    }

    activeConsentVersion = null;

    // Current privacy version is granted
    if (
      data?.action === "granted" &&
      data.consent_version === CONSENT_VERSION
    ) {
      activeConsentVersion = data.consent_version;

      message(
        "consentStatus",
        t("consentActive"),
        "success"
      );

      hide("consentForm");
      show("withdrawConsentBtn");
      show("supportForm");

      return true;
    }

    // Older version is still active.
    // The user must withdraw it before accepting the new version.
    if (
      data?.action === "granted" &&
      data.consent_version !== CONSENT_VERSION
    ) {
      activeConsentVersion = data.consent_version;

      message(
        "consentStatus",
        t("consentUpdateRequired"),
        "error"
      );

      hide("consentForm");
      show("withdrawConsentBtn");
      hide("supportForm");

      return false;
    }

    // Previous consent was withdrawn
    if (data?.action === "withdrawn") {
      message(
        "consentStatus",
        t("consentWithdrawn"),
        "error"
      );
    } else {
      message(
        "consentStatus",
        t("consentNotGiven")
      );
    }

    show("consentForm");
    hide("withdrawConsentBtn");
    hide("supportForm");

    return false;
  }

  async function grantConsent(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    if (!$("consentAccept").checked) {
      message(
        "consentMessage",
        t("consentRequired"),
        "error"
      );
      return;
    }

    const button = $("grantConsentBtn");

    setBusy(button, true, t("processing"));

    try {
      const { error } = await client
        .from("omhsq_consent_records")
        .insert({
          user_id: currentUser.id,
          action: "granted",
          consent_version: CONSENT_VERSION,
          language: lang
        });

      if (error) {
        console.error("Consent grant error:", error);

        message(
          "consentMessage",
          t("consentError") + " " + error.message,
          "error"
        );

        return;
      }

      $("consentAccept").checked = false;

      await loadConsentState();

      message(
        "consentMessage",
        t("consentGrantedSuccess"),
        "success"
      );

    } catch (error) {
      console.error("Consent grant exception:", error);

      message(
        "consentMessage",
        t("consentError"),
        "error"
      );

    } finally {
      setBusy(button, false, t("grantConsent"));
    }
  }

  async function withdrawConsent() {
    if (!client || !currentUser || !activeConsentVersion) {
      return;
    }

    if (!window.confirm(t("consentWithdrawConfirm"))) {
      return;
    }

    const button = $("withdrawConsentBtn");

    setBusy(button, true, t("processing"));

    try {
      const { error } = await client
        .from("omhsq_consent_records")
        .insert({
          user_id: currentUser.id,
          action: "withdrawn",
          consent_version: activeConsentVersion,
          language: lang
        });

      if (error) {
        console.error("Consent withdrawal error:", error);

        message(
          "consentMessage",
          t("consentError") + " " + error.message,
          "error"
        );

        return;
      }

      activeConsentVersion = null;

      await loadConsentState();

      message(
        "consentMessage",
        t("consentWithdrawSuccess"),
        "success"
      );

    } catch (error) {
      console.error("Consent withdrawal exception:", error);

      message(
        "consentMessage",
        t("consentError"),
        "error"
      );

    } finally {
      setBusy(button, false, t("withdrawConsent"));
    }
  }

  // =========================================================
  // 6. WORKER VIEW
  // =========================================================

  async function showWorkerView() {
    show("workerPanel");

    if ($("supportForm")) {
      $("supportForm").reset();
    }

    if ($("consentForm")) {
      $("consentForm").reset();
    }

    message("formMessage", "");
    message("consentMessage", "");

    await loadConsentState();
  }

  async function submitSupportRequest(event) {
    event.preventDefault();

    if (!client || !currentUser) return;

    if (!activeConsentVersion) {
      message(
        "formMessage",
        t("consentRequired"),
        "error"
      );

      await loadConsentState();
      return;
    }

    if (!$("confirmAccuracy").checked) {
      message(
        "formMessage",
        t("submitError"),
        "error"
      );
      return;
    }

    const domains = [
      ...document.querySelectorAll(
        'input[name="domains"]:checked'
      )
    ].map((element) => element.value);

    const helpRequest = document.querySelector(
      'input[name="help_request"]:checked'
    )?.value;

    const urgentSafety = document.querySelector(
      'input[name="urgent_safety"]:checked'
    )?.value;

    if (!helpRequest || !urgentSafety) {
      message(
        "formMessage",
        t("submitError"),
        "error"
      );
      return;
    }

    const payload = {
      user_id: currentUser.id,
      consent: true,
      consent_version: activeConsentVersion,
      domains,
      help_request: helpRequest,
      urgent_safety: urgentSafety,
      optional_note: $("notes").value.trim() || null,
      status: "new",
      language: lang
    };

    const button = $("submitRequestBtn");

    setBusy(button, true, t("processing"));

    try {
      const { error } = await client
        .from("omhsq_support_requests")
        .insert(payload);

      if (error) {
        console.error("Support request error:", error);

        message(
          "formMessage",
          t("submitError") + " " + error.message,
          "error"
        );

        return;
      }

      $("supportForm").reset();

      hide("workerPanel");
      show("confirmationPanel");

    } catch (error) {
      console.error("Support request exception:", error);

      message(
        "formMessage",
        t("submitError"),
        "error"
      );

    } finally {
      setBusy(button, false, t("submitRequest"));
    }
  }

  // =========================================================
  // 7. REQUEST TABLE RENDERING
  // =========================================================

  function renderRequests(tbodyId, rows) {
    const tbody = $(tbodyId);

    if (!tbody) return;

    tbody.replaceChildren();

    if (!rows || rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");

      td.colSpan = 5;
      td.textContent = t("noRequests");

      tr.appendChild(td);
      tbody.appendChild(tr);

      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement("tr");

      const helpValue =
        row.help_request === "yes"
          ? t("yesShort")
          : row.help_request === "no"
            ? t("noShort")
            : t("infoShort");

      const safetyValue =
        row.urgent_safety === "yes"
          ? t("yesShort")
          : row.urgent_safety === "no"
            ? t("noShort")
            : t("statusPreferNot");

      const domainValue = (row.domains || [])
        .map(translateDomain)
        .join(", ") || "—";

      const values = [
        formatDate(row.created_at),
        helpValue,
        domainValue,
        safetyValue,
        translateStatus(row.status)
      ];

      values.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  // =========================================================
  // 8. PROFESSIONAL DASHBOARD
  // =========================================================

  async function loadProfessionalRequests() {
    if (
      !client ||
      !currentUser ||
      currentRole !== "professional"
    ) {
      return;
    }

    message("professionalMessage", "");

    try {
      const { data: assignments, error: assignmentError } =
        await client
          .from("omhsq_professional_assignments")
          .select("request_id")
          .eq("professional_id", currentUser.id);

      if (assignmentError) {
        console.error(
          "Assignment read error:",
          assignmentError
        );

        message(
          "professionalMessage",
          t("professionalError"),
          "error"
        );

        return;
      }

      const requestIds = (assignments || [])
        .map((item) => item.request_id)
        .filter(Boolean);

      if (requestIds.length === 0) {
        renderRequests("professionalRows", []);
        return;
      }

      const { data, error } = await client
        .from("omhsq_support_requests")
        .select(
          "id, created_at, help_request, domains, urgent_safety, status"
        )
        .in("id", requestIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Professional request read error:",
          error
        );

        message(
          "professionalMessage",
          t("professionalError"),
          "error"
        );

        return;
      }

      renderRequests("professionalRows", data || []);

    } catch (error) {
      console.error("Professional dashboard error:", error);

      message(
        "professionalMessage",
        t("professionalError"),
        "error"
      );
    }
  }

  // =========================================================
  // 9. SYSTEM OWNER DASHBOARD
  // =========================================================

  async function loadOwnerRequests() {
    if (
      !client ||
      !currentUser ||
      currentRole !== "super_admin"
    ) {
      return;
    }

    message("ownerMessage", "");

    try {
      const { data, error } = await client
        .from("omhsq_support_requests")
        .select(
          "id, created_at, help_request, domains, urgent_safety, status"
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Owner request read error:", error);

        message(
          "ownerMessage",
          t("adminError"),
          "error"
        );

        return;
      }

      renderRequests("ownerRows", data || []);

    } catch (error) {
      console.error("Owner dashboard error:", error);

      message(
        "ownerMessage",
        t("adminError"),
        "error"
      );
    }
  }

  // =========================================================
  // 10. SESSION AND ROLE ROUTING
  // =========================================================

  async function refreshView() {
    if (loading) return;

    loading = true;

    try {
      if (!client) {
        hideAllPanels();
        show("authPanel");
        hide("logoutBtn");

        message(
          "authMessage",
          t("configMissing"),
          "error"
        );

        return;
      }

      const { data, error } = await client.auth.getSession();

      if (error) {
        hideAllPanels();
        show("authPanel");

        message(
          "authMessage",
          t("sessionError"),
          "error"
        );

        return;
      }

      currentUser = data.session?.user || null;

      if (!currentUser) {
        currentRole = null;
        activeConsentVersion = null;

        hideAllPanels();
        show("authPanel");
        hide("logoutBtn");

        return;
      }

      show("logoutBtn");

      const { data: roleRow, error: roleError } = await client
        .from("omhsq_user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (roleError || !roleRow?.role) {
        console.error(
          "Role verification error:",
          roleError
        );

        hideAllPanels();
        show("authPanel");

        message(
          "authMessage",
          t("roleError"),
          "error"
        );

        return;
      }

      currentRole = roleRow.role;

      hideAllPanels();

      if (currentRole === "super_admin") {
        show("ownerPanel");
        await loadOwnerRequests();

      } else if (currentRole === "professional") {
        show("professionalPanel");
        await loadProfessionalRequests();

      } else if (currentRole === "worker") {
        await showWorkerView();

      } else {
        currentRole = null;

        hide("logoutBtn");
        show("authPanel");

        message(
          "authMessage",
          t("accessDenied"),
          "error"
        );
      }

    } catch (error) {
      console.error("View refresh error:", error);

      hideAllPanels();
      show("authPanel");

      message(
        "authMessage",
        t("sessionError"),
        "error"
      );

    } finally {
      loading = false;
    }
  }

  // =========================================================
  // 11. AUTHENTICATION FORM
  // =========================================================

  async function handleAuthentication(event) {
    event.preventDefault();

    if (!client) {
      message(
        "authMessage",
        t("configMissing"),
        "error"
      );
      return;
    }

    const button = $("authSubmit");

    const email = $("email").value.trim();
    const password = $("password").value;

    setBusy(button, true, t("processing"));

    try {
      if (authMode === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              `${location.origin}${location.pathname}`
          }
        });

        if (error) {
          message(
            "authMessage",
            t("signupError") + " " + error.message,
            "error"
          );

        } else if (data.session) {
          message("authMessage", "", "");
          await refreshView();

        } else {
          message(
            "authMessage",
            t("signupSent"),
            "success"
          );
        }

      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          message(
            "authMessage",
            t("loginError"),
            "error"
          );

        } else {
          message("authMessage", "");
          await refreshView();
        }
      }

    } catch (error) {
      console.error("Authentication error:", error);

      message(
        "authMessage",
        t("loginError"),
        "error"
      );

    } finally {
      setBusy(button, false, t(authMode));
    }
  }

  // =========================================================
  // 12. PASSWORD RESET EMAIL
  // =========================================================

  async function sendPasswordReset() {
    if (!client) {
      message(
        "authMessage",
        t("configMissing"),
        "error"
      );
      return;
    }

    const email = $("email").value.trim();

    if (!email) {
      message(
        "authMessage",
        lang === "ar"
          ? "أدخل بريدك الإلكتروني أولاً."
          : "Enter your email address first.",
        "error"
      );

      return;
    }

    const button = $("forgotBtn");

    button.disabled = true;

    try {
      const { error } =
        await client.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${location.origin}${location.pathname}`
          }
        );

      message(
        "authMessage",
        error ? t("resetError") : t("resetSent"),
        error ? "error" : "success"
      );

    } catch (error) {
      console.error("Password reset error:", error);

      message(
        "authMessage",
        t("resetError"),
        "error"
      );

    } finally {
      button.disabled = false;
    }
  }

  // =========================================================
  // 13. PASSWORD RECOVERY FORM
  // =========================================================

  async function handleRecovery(event) {
    event.preventDefault();

    if (!client || !recoveryMode) return;

    const password = $("newPassword").value;
    const confirmation = $("confirmNewPassword").value;

    if (
      password.length < 8 ||
      password !== confirmation
    ) {
      message(
        "recoveryMessage",
        t("invalidPassword"),
        "error"
      );

      return;
    }

    const button = $("recoverySubmit");

    setBusy(button, true, t("processing"));

    try {
      const { error } = await client.auth.updateUser({
        password
      });

      if (error) {
        console.error("Password update error:", error);

        message(
          "recoveryMessage",
          t("passwordError"),
          "error"
        );

        return;
      }

      recoveryMode = false;

      $("recoveryForm").reset();

      message(
        "recoveryMessage",
        t("passwordSaved"),
        "success"
      );

      await client.auth.signOut();

      currentUser = null;
      currentRole = null;

      hideAllPanels();
      show("authPanel");

      message(
        "authMessage",
        t("passwordSaved"),
        "success"
      );

    } catch (error) {
      console.error("Recovery error:", error);

      message(
        "recoveryMessage",
        t("passwordError"),
        "error"
      );

    } finally {
      setBusy(button, false, t("savePassword"));
    }
  }

  // =========================================================
  // 14. LOGOUT
  // =========================================================

  async function logout() {
    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    currentUser = null;
    currentRole = null;
    activeConsentVersion = null;
    recoveryMode = false;

    await refreshView();
  }

  // =========================================================
  // 15. EVENT LISTENERS
  // =========================================================

  $("languageBtn").addEventListener("click", () => {
    lang = lang === "ar" ? "en" : "ar";
    applyLanguage();
  });

  $("loginTab").addEventListener("click", () => {
    setAuthMode("login");
  });

  $("signupTab").addEventListener("click", () => {
    setAuthMode("signup");
  });

  $("authForm").addEventListener(
    "submit",
    handleAuthentication
  );

  $("forgotBtn").addEventListener(
    "click",
    sendPasswordReset
  );

  $("recoveryForm").addEventListener(
    "submit",
    handleRecovery
  );

  $("logoutBtn").addEventListener(
    "click",
    logout
  );

  $("consentForm").addEventListener(
    "submit",
    grantConsent
  );

  $("withdrawConsentBtn").addEventListener(
    "click",
    withdrawConsent
  );

  $("supportForm").addEventListener(
    "submit",
    submitSupportRequest
  );

  $("refreshProfessional").addEventListener(
    "click",
    loadProfessionalRequests
  );

  $("refreshOwner").addEventListener(
    "click",
    loadOwnerRequests
  );

  $("backToWorker").addEventListener(
    "click",
    async () => {
      hide("confirmationPanel");
      show("workerPanel");
      await loadConsentState();
    }
  );

  // =========================================================
  // 16. SUPABASE AUTH STATE CHANGES
  // =========================================================

  if (client) {
    client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;

        hideAllPanels();
        show("recoveryPanel");
        show("logoutBtn");

        return;
      }

      if (event === "SIGNED_OUT") {
        recoveryMode = false;
        currentUser = null;
        currentRole = null;
        activeConsentVersion = null;
      }

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {
        if (!recoveryMode) {
          setTimeout(() => {
            refreshView();
          }, 0);
        }
      }
    });
  }

  // =========================================================
  // 17. INITIALIZATION
  // =========================================================

  applyLanguage();
  setAuthMode("login");
  refreshView();

})();

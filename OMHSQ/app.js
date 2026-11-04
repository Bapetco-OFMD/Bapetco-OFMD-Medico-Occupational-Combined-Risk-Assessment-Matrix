
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

  const CONSENT_VERSION = "OMHSQ-PRIVACY-1.1";

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
  let currentWorkerProfile = null;

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
        "Your occupational profile (including date of birth, company and job details) is visible to you and the System Owner only for platform administration. Mental health professionals cannot access your occupational profile; they can access only support requests assigned to them. HR and operational managers have no access to individual support requests or occupational profiles. This information must not be used for recruitment, promotion or medical fitness decisions. Administrative changes to records are recorded in the audit log. Confidentiality may be subject to limited exceptions where there is an imminent risk to your safety or someone else's, in accordance with applicable medical and legal procedures.",

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
      domainOther: "Other",

      profileTitle: "Worker occupational profile",
      profileIntro: "Complete this once on first use. You can update it later.",
      profilePrivate: "Restricted data",
      fullName: "Full name",
      dob: "Date of birth",
      age: "Age (calculated automatically)",
      company: "Company name",
      sector: "Sector",
      jobTitle: "Job title",
      jobCode: "Internal job code",
      selectSector: "Select a sector",
      selectJob: "Select a job title",
      profileCodeNote: "These are proposed internal platform codes, not official company codes.",
      profileAccessNote: "Workers can view and edit their own profile. The System Owner can view it for platform administration. Professionals cannot access occupational profile data.",
      editProfile: "Edit profile",
      saveProfile: "Save profile",
      cancelEdit: "Cancel editing",
      profileSaved: "Your occupational profile has been saved.",
      profileLoadError: "Unable to load your profile. Please try again or contact the System Owner.",
      profileSaveError: "Unable to save your profile. Please check the information and try again.",
      profileRequired: "Please complete and save your occupational profile before continuing.",
      invalidDob: "Please enter a valid date of birth.",
      workerProfilesTitle: "Worker occupational profiles",
      workerProfilesNote: "Full occupational profile details are visible to the System Owner only, not to professionals.",
      noProfiles: "No worker profiles have been registered yet.",
      ownerProfilesError: "Unable to load worker profiles. Check the System Owner permissions.",
      sectorExploration: "Exploration & Geosciences",
      sectorDrilling: "Drilling Operations",
      sectorWellServices: "Well Services",
      sectorProduction: "Production Operations",
      sectorRefining: "Refining & Petrochemicals",
      sectorMaintenance: "Maintenance & Engineering",
      sectorLogistics: "Lifting & Logistics",
      sectorOffshore: "Offshore & Marine",
      sectorHse: "HSE & Emergency",
      sectorSecurity: "Security",
      sectorCorporate: "Corporate Functions",
      sectorMedical: "Medical & Camp Services",
      identityLabel: "Current account",
      roleOwner: "System Owner — Super Admin",
      roleProfessional: "Mental Health Professional",
      roleWorker: "Worker"
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
        "يظهر ملفك الوظيفي (بما يشمل تاريخ الميلاد واسم الشركة والقطاع والمسمى الوظيفي) لك ولمالك النظام فقط لأغراض إدارة المنصة. لا يستطيع المختص النفسي الاطلاع على ملفك الوظيفي، ويقتصر وصوله على طلبات الدعم المسندة إليه. لا تملك الموارد البشرية أو الإدارات التشغيلية صلاحية الاطلاع على الملفات الوظيفية أو طلبات الدعم الفردية. لا يجوز استخدام هذه المعلومات في قرارات التوظيف أو الترقية أو اللياقة الطبية. تُسجّل التغييرات الإدارية على السجلات وفق سجل التدقيق. وقد تُطبق استثناءات السرية عند وجود خطر وشيك على سلامتك أو سلامة الآخرين وفق الإجراءات الطبية والقانونية المعمول بها.",

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
      domainOther: "موضوع آخر",

      profileTitle: "الملف الوظيفي الأساسي",
      profileIntro: "يُستكمل مرة واحدة عند الاستخدام الأول، ويمكن تحديثه لاحقاً.",
      profilePrivate: "بيانات مقيدة",
      fullName: "الاسم الكامل",
      dob: "تاريخ الميلاد",
      age: "العمر (يُحسب تلقائياً)",
      company: "اسم الشركة",
      sector: "القطاع",
      jobTitle: "المسمى الوظيفي",
      jobCode: "الكود الوظيفي الداخلي",
      selectSector: "اختر القطاع",
      selectJob: "اختر المسمى الوظيفي",
      profileCodeNote: "الأكواد المقترحة أكواد داخلية تنظيمية للمنصة وليست أكواداً رسمية للشركة.",
      profileAccessNote: "يمكن للعامل الاطلاع على ملفه وتعديله، ويستطيع مالك النظام الاطلاع عليه لأغراض إدارة المنصة. لا يستطيع المختص النفسي الاطلاع على بيانات الملف الوظيفي.",
      editProfile: "تعديل الملف الشخصي",
      saveProfile: "حفظ الملف الشخصي",
      cancelEdit: "إلغاء التعديل",
      profileSaved: "تم حفظ ملفك الوظيفي بنجاح.",
      profileLoadError: "تعذر تحميل ملفك الوظيفي. حاول مرة أخرى أو تواصل مع مالك النظام.",
      profileSaveError: "تعذر حفظ الملف الوظيفي. راجع البيانات وحاول مرة أخرى.",
      profileRequired: "يرجى استكمال الملف الوظيفي وحفظه قبل المتابعة.",
      invalidDob: "يرجى إدخال تاريخ ميلاد صحيح.",
      workerProfilesTitle: "الملفات الوظيفية للعاملين",
      workerProfilesNote: "بيانات الملف الوظيفي الكاملة متاحة لمالك النظام فقط ولا تظهر للمختصين.",
      noProfiles: "لم يتم تسجيل ملفات وظيفية للعاملين حتى الآن.",
      ownerProfilesError: "تعذر تحميل الملفات الوظيفية. تحقق من صلاحيات مالك النظام.",
      sectorExploration: "الاستكشاف والمسح الجيولوجي",
      sectorDrilling: "الحفر وعمليات الآبار",
      sectorWellServices: "خدمات الآبار والتدخل والصيانة داخل الآبار",
      sectorProduction: "الإنتاج وتشغيل الحقول",
      sectorRefining: "التكرير والبتروكيماويات",
      sectorMaintenance: "الصيانة والهندسة",
      sectorLogistics: "الرفع والمعدات والنقل والمناولة",
      sectorOffshore: "القطاع البحري والمنصات البحرية",
      sectorHse: "الصحة والسلامة والبيئة والطوارئ",
      sectorSecurity: "الأمن والحماية",
      sectorCorporate: "الإدارة والقيادة والموارد البشرية والمالية",
      sectorMedical: "الخدمات الطبية والمعيشية والمساندة",
      identityLabel: "الحساب الحالي",
      roleOwner: "مالك النظام — Super Admin",
      roleProfessional: "المختص النفسي — Professional",
      roleWorker: "العامل — Worker"
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

  // =========================================================
  // 3A. USER IDENTITY DISPLAY
  // =========================================================

  function updateUserIdentity(user, role) {
    const identityBox = $("userIdentity");
    const emailElement = $("currentUserEmail");
    const roleElement = $("currentUserRole");
    const labelElement = $("identityLabel");

    // If the identity elements are not present in HTML,
    // do not interrupt the rest of the application.
    if (!identityBox || !emailElement || !roleElement) {
      return;
    }

    // Hide identity information when no verified session/role exists.
    if (!user || !role) {
      identityBox.classList.add("hidden");
      emailElement.textContent = "";
      roleElement.textContent = "";

      if (labelElement) {
        labelElement.textContent = t("identityLabel");
      }

      return;
    }

    const roleLabels = {
      super_admin: t("roleOwner"),
      professional: t("roleProfessional"),
      worker: t("roleWorker")
    };

    // Display the actual authenticated email address.
    // Do not substitute a display name for the email.
    emailElement.textContent = user.email || "";

    roleElement.textContent =
      roleLabels[role] || role;

    if (labelElement) {
      labelElement.textContent = t("identityLabel");
    }

    identityBox.classList.remove("hidden");
  }

  function clearUserIdentity() {
    updateUserIdentity(null, null);
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

    // Refresh the displayed account information after language change.
    if (currentUser && currentRole) {
      updateUserIdentity(currentUser, currentRole);
    }

    if (currentUser && currentRole === "professional") {
      loadProfessionalRequests();
    }

    if (currentUser && currentRole === "super_admin") {
      loadOwnerRequests();
      loadOwnerProfiles();
    }
    if (currentWorkerProfile && currentRole === "worker") {
      showProfileSummary(currentWorkerProfile);
    }
    if ($("profileSector")) {
      const selectedSector = $("profileSector").value;
      const selectedJob = $("profileJobTitle").value;
      populateProfileSectors(selectedSector);
      populateProfileJobs(selectedSector, selectedJob);
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

  const PROFILE_CATALOG = [
  {
    "code": "EX",
    "ar": "الاستكشاف والمسح الجيولوجي",
    "en": "Exploration & Geosciences",
    "jobs": [
      {
        "title": "مدير الاستكشاف",
        "code": "EX-001"
      },
      {
        "title": "جيولوجي حقلي",
        "code": "EX-002"
      },
      {
        "title": "جيولوجي بترول",
        "code": "EX-003"
      },
      {
        "title": "جيوفيزيائي",
        "code": "EX-004"
      },
      {
        "title": "مهندس مسح زلزالي",
        "code": "EX-005"
      },
      {
        "title": "مشغل أجهزة المسح",
        "code": "EX-006"
      },
      {
        "title": "فني المسح الجيولوجي",
        "code": "EX-007"
      },
      {
        "title": "محلل بيانات جيوفيزيائية",
        "code": "EX-008"
      },
      {
        "title": "مساح حقلي",
        "code": "EX-009"
      },
      {
        "title": "قائد فريق المسح",
        "code": "EX-010"
      }
    ]
  },
  {
    "code": "DR",
    "ar": "الحفر وعمليات الآبار",
    "en": "Drilling Operations",
    "jobs": [
      {
        "title": "مدير عمليات الحفر",
        "code": "DR-001"
      },
      {
        "title": "مهندس الحفر",
        "code": "DR-002"
      },
      {
        "title": "مشرف الحفر",
        "code": "DR-003"
      },
      {
        "title": "الحفار",
        "code": "DR-004"
      },
      {
        "title": "مساعد الحفار",
        "code": "DR-005"
      },
      {
        "title": "عامل منصة الحفر",
        "code": "DR-006"
      },
      {
        "title": "عامل برج الحفر",
        "code": "DR-007"
      },
      {
        "title": "مهندس سوائل الحفر",
        "code": "DR-008"
      },
      {
        "title": "مشغل مضخات الحفر",
        "code": "DR-009"
      },
      {
        "title": "مشغل معدات الحفر",
        "code": "DR-010"
      },
      {
        "title": "مشرف عمليات الآبار",
        "code": "DR-011"
      },
      {
        "title": "مسؤول التحكم في الآبار",
        "code": "DR-012"
      }
    ]
  },
  {
    "code": "WS",
    "ar": "خدمات الآبار والتدخل والصيانة داخل الآبار",
    "en": "Well Services",
    "jobs": [
      {
        "title": "مهندس خدمات الآبار",
        "code": "WS-001"
      },
      {
        "title": "مهندس التسجيل الكهربائي",
        "code": "WS-002"
      },
      {
        "title": "مشغل وحدات التسجيل",
        "code": "WS-003"
      },
      {
        "title": "فني Wireline",
        "code": "WS-004"
      },
      {
        "title": "فني Coiled Tubing",
        "code": "WS-005"
      },
      {
        "title": "فني Workover",
        "code": "WS-006"
      },
      {
        "title": "مشغل وحدات الإسمنت",
        "code": "WS-007"
      },
      {
        "title": "فني اختبار الآبار",
        "code": "WS-008"
      },
      {
        "title": "مشغل وحدات الضخ",
        "code": "WS-009"
      },
      {
        "title": "مشرف خدمات الآبار",
        "code": "WS-010"
      }
    ]
  },
  {
    "code": "PR",
    "ar": "الإنتاج وتشغيل الحقول",
    "en": "Production Operations",
    "jobs": [
      {
        "title": "مدير الإنتاج",
        "code": "PR-001"
      },
      {
        "title": "مهندس إنتاج",
        "code": "PR-002"
      },
      {
        "title": "مشرف الإنتاج",
        "code": "PR-003"
      },
      {
        "title": "مشغل غرفة التحكم",
        "code": "PR-004"
      },
      {
        "title": "مشغل الإنتاج الميداني",
        "code": "PR-005"
      },
      {
        "title": "مشغل فواصل الضغط",
        "code": "PR-006"
      },
      {
        "title": "مشغل معالجة الغاز",
        "code": "PR-007"
      },
      {
        "title": "مشغل محطات الضخ",
        "code": "PR-008"
      },
      {
        "title": "فني أخذ العينات",
        "code": "PR-009"
      },
      {
        "title": "مشرف الورديات",
        "code": "PR-010"
      },
      {
        "title": "مشغل وحدات فصل الغاز",
        "code": "PR-011"
      },
      {
        "title": "فني الحقول",
        "code": "PR-012"
      }
    ]
  },
  {
    "code": "RP",
    "ar": "التكرير والبتروكيماويات",
    "en": "Refining & Petrochemicals",
    "jobs": [
      {
        "title": "مدير عمليات التكرير",
        "code": "RP-001"
      },
      {
        "title": "مهندس عمليات التكرير",
        "code": "RP-002"
      },
      {
        "title": "مشغل وحدة التقطير",
        "code": "RP-003"
      },
      {
        "title": "مشغل الأفران الصناعية",
        "code": "RP-004"
      },
      {
        "title": "مشغل المفاعلات الكيميائية",
        "code": "RP-005"
      },
      {
        "title": "مشغل وحدات البلمرة",
        "code": "RP-006"
      },
      {
        "title": "مشغل وحدات الكبريت",
        "code": "RP-007"
      },
      {
        "title": "مشغل وحدات الهيدروجين",
        "code": "RP-008"
      },
      {
        "title": "فني المختبر الكيميائي",
        "code": "RP-009"
      },
      {
        "title": "محلل كيميائي",
        "code": "RP-010"
      },
      {
        "title": "مشرف وحدات المعالجة",
        "code": "RP-011"
      },
      {
        "title": "مشغل وحدات تحميل المنتجات",
        "code": "RP-012"
      }
    ]
  },
  {
    "code": "ME",
    "ar": "الصيانة والهندسة",
    "en": "Maintenance & Engineering",
    "jobs": [
      {
        "title": "مدير الصيانة",
        "code": "ME-001"
      },
      {
        "title": "مهندس الصيانة الميكانيكية",
        "code": "ME-002"
      },
      {
        "title": "فني الصيانة الميكانيكية",
        "code": "ME-003"
      },
      {
        "title": "فني الكهرباء",
        "code": "ME-004"
      },
      {
        "title": "فني الأجهزة والتحكم",
        "code": "ME-005"
      },
      {
        "title": "مهندس الأجهزة والتحكم",
        "code": "ME-006"
      },
      {
        "title": "فني اللحام",
        "code": "ME-007"
      },
      {
        "title": "فني السقالات",
        "code": "ME-008"
      },
      {
        "title": "فني العزل الحراري",
        "code": "ME-009"
      },
      {
        "title": "مفتش المعدات",
        "code": "ME-010"
      },
      {
        "title": "مهندس الاعتمادية",
        "code": "ME-011"
      },
      {
        "title": "فني صيانة المضخات والضواغط",
        "code": "ME-012"
      }
    ]
  },
  {
    "code": "LL",
    "ar": "الرفع والمعدات والنقل والمناولة",
    "en": "Lifting & Logistics",
    "jobs": [
      {
        "title": "مشغل الرافعات المتحركة",
        "code": "LL-001"
      },
      {
        "title": "مشغل الرافعات البرجية",
        "code": "LL-002"
      },
      {
        "title": "مشغل الرافعات العلوية",
        "code": "LL-003"
      },
      {
        "title": "مشغل الرافعة الشوكية",
        "code": "LL-004"
      },
      {
        "title": "سائق الشاحنات الثقيلة",
        "code": "LL-005"
      },
      {
        "title": "سائق الحافلات",
        "code": "LL-006"
      },
      {
        "title": "سائق المركبات الخفيفة",
        "code": "LL-007"
      },
      {
        "title": "مشغل معدات التحميل",
        "code": "LL-008"
      },
      {
        "title": "مراقب حركة المركبات",
        "code": "LL-009"
      },
      {
        "title": "مسؤول المخازن",
        "code": "LL-010"
      }
    ]
  },
  {
    "code": "OM",
    "ar": "القطاع البحري والمنصات البحرية",
    "en": "Offshore & Marine",
    "jobs": [
      {
        "title": "مدير المنصة البحرية",
        "code": "OM-001"
      },
      {
        "title": "مشرف المنصة البحرية",
        "code": "OM-002"
      },
      {
        "title": "العامل البحري",
        "code": "OM-003"
      },
      {
        "title": "ضابط السطح",
        "code": "OM-004"
      },
      {
        "title": "ضابط الملاحة",
        "code": "OM-005"
      },
      {
        "title": "مهندس السفينة",
        "code": "OM-006"
      },
      {
        "title": "بحار",
        "code": "OM-007"
      },
      {
        "title": "مشغل الرافعات البحرية",
        "code": "OM-008"
      },
      {
        "title": "فني الغوص",
        "code": "OM-009"
      },
      {
        "title": "مسؤول الإخلاء والإنقاذ البحري",
        "code": "OM-010"
      }
    ]
  },
  {
    "code": "HS",
    "ar": "الصحة والسلامة والبيئة والطوارئ",
    "en": "HSE & Emergency",
    "jobs": [
      {
        "title": "مدير الصحة والسلامة",
        "code": "HS-001"
      },
      {
        "title": "مهندس السلامة",
        "code": "HS-002"
      },
      {
        "title": "مراقب السلامة",
        "code": "HS-003"
      },
      {
        "title": "مسؤول تصاريح العمل",
        "code": "HS-004"
      },
      {
        "title": "مسؤول العزل الكهربائي والميكانيكي",
        "code": "HS-005"
      },
      {
        "title": "مدير الطوارئ",
        "code": "HS-006"
      },
      {
        "title": "رجل الإطفاء",
        "code": "HS-007"
      },
      {
        "title": "فني مكافحة التسرب",
        "code": "HS-008"
      },
      {
        "title": "عضو فريق الإنقاذ",
        "code": "HS-009"
      },
      {
        "title": "مسؤول إدارة الأزمات",
        "code": "HS-010"
      }
    ]
  },
  {
    "code": "SE",
    "ar": "الأمن والحماية",
    "en": "Security",
    "jobs": [
      {
        "title": "مدير الأمن",
        "code": "SE-001"
      },
      {
        "title": "مشرف الأمن",
        "code": "SE-002"
      },
      {
        "title": "فرد الأمن",
        "code": "SE-003"
      },
      {
        "title": "مراقب كاميرات المراقبة",
        "code": "SE-004"
      },
      {
        "title": "مسؤول التحكم في الدخول",
        "code": "SE-005"
      },
      {
        "title": "مشرف الأمن الصناعي",
        "code": "SE-006"
      }
    ]
  },
  {
    "code": "CF",
    "ar": "الإدارة والقيادة والموارد البشرية والمالية",
    "en": "Corporate Functions",
    "jobs": [
      {
        "title": "الرئيس التنفيذي",
        "code": "CF-001"
      },
      {
        "title": "مدير العمليات",
        "code": "CF-002"
      },
      {
        "title": "مدير الموارد البشرية",
        "code": "CF-003"
      },
      {
        "title": "مدير الشؤون المالية",
        "code": "CF-004"
      },
      {
        "title": "محاسب",
        "code": "CF-005"
      },
      {
        "title": "مراجع داخلي",
        "code": "CF-006"
      },
      {
        "title": "مسؤول المشتريات",
        "code": "CF-007"
      },
      {
        "title": "موظف إداري",
        "code": "CF-008"
      },
      {
        "title": "مسؤول تقنية المعلومات",
        "code": "CF-009"
      },
      {
        "title": "مسؤول الأمن السيبراني",
        "code": "CF-010"
      }
    ]
  },
  {
    "code": "MC",
    "ar": "الخدمات الطبية والمعيشية والمساندة",
    "en": "Medical & Camp Services",
    "jobs": [
      {
        "title": "طبيب الموقع",
        "code": "MC-001"
      },
      {
        "title": "ممرض الموقع",
        "code": "MC-002"
      },
      {
        "title": "مسعف الموقع",
        "code": "MC-003"
      },
      {
        "title": "فني المختبر الطبي",
        "code": "MC-004"
      },
      {
        "title": "صيدلي الموقع",
        "code": "MC-005"
      },
      {
        "title": "طباخ الموقع",
        "code": "MC-006"
      },
      {
        "title": "مسؤول الإعاشة",
        "code": "MC-007"
      },
      {
        "title": "عامل النظافة الصناعية",
        "code": "MC-008"
      },
      {
        "title": "مسؤول السكن البحري",
        "code": "MC-009"
      },
      {
        "title": "مسؤول الخدمات العامة",
        "code": "MC-010"
      }
    ]
  }
];

  // =========================================================
  // 4A. WORKER PROFILE (worker and System Owner only)
  // =========================================================

  const PROFILE_SECTOR_KEYS = {
    EX: "sectorExploration", DR: "sectorDrilling", WS: "sectorWellServices",
    PR: "sectorProduction", RP: "sectorRefining", ME: "sectorMaintenance",
    LL: "sectorLogistics", OM: "sectorOffshore", HS: "sectorHse",
    SE: "sectorSecurity", CF: "sectorCorporate", MC: "sectorMedical"
  };

  function calculateAge(dateValue) {
    if (!dateValue) return null;
    const parts = dateValue.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayPending = (today.getMonth() + 1 < month) ||
      ((today.getMonth() + 1 === month) && today.getDate() < day);
    if (birthdayPending) age -= 1;
    if (age < 0 || age > 120) return null;
    return age;
  }

  function sectorLabel(code) {
    const sector = PROFILE_CATALOG.find((item) => item.code === code);
    return sector ? (lang === "ar" ? sector.ar : sector.en) : "—";
  }

  function populateProfileSectors(selectedCode = "") {
    const select = $("profileSector");
    if (!select) return;
    select.replaceChildren();
    const first = document.createElement("option");
    first.value = "";
    first.textContent = t("selectSector");
    select.appendChild(first);
    PROFILE_CATALOG.forEach((sector) => {
      const option = document.createElement("option");
      option.value = sector.code;
      option.textContent = lang === "ar" ? sector.ar : sector.en;
      select.appendChild(option);
    });
    select.value = selectedCode;
    populateProfileJobs(selectedCode);
  }

  function populateProfileJobs(sectorCode, selectedCode = "") {
    const select = $("profileJobTitle");
    if (!select) return;
    select.replaceChildren();
    const first = document.createElement("option");
    first.value = "";
    first.textContent = t("selectJob");
    select.appendChild(first);
    const sector = PROFILE_CATALOG.find((item) => item.code === sectorCode);
    if (sector) {
      sector.jobs.forEach((job) => {
        const option = document.createElement("option");
        option.value = job.code;
        option.textContent = job.title;
        select.appendChild(option);
      });
    }
    select.disabled = !sector;
    select.value = selectedCode;
    updateProfileJobCode();
  }

  function updateProfileJobCode() {
    const select = $("profileJobTitle");
    const code = select?.value || "";
    if ($("profileJobCode")) $("profileJobCode").value = code;
  }

  function updateProfileAge() {
    const age = calculateAge($("profileDob")?.value);
    if ($("profileAge")) {
      $("profileAge").value = age === null ? "" : String(age);
    }
  }

  function setProfileFormValues(profile) {
    $("profileFullName").value = profile?.full_name || "";
    $("profileDob").value = profile?.date_of_birth || "";
    $("profileCompany").value = profile?.company_name || "";
    populateProfileSectors(profile?.sector_code || "");
    populateProfileJobs(profile?.sector_code || "", profile?.job_code || "");
    updateProfileAge();
  }

  function showProfileSummary(profile) {
    const age = calculateAge(profile.date_of_birth);
    $("profileViewName").textContent = profile.full_name || "—";
    $("profileViewDob").textContent = profile.date_of_birth || "—";
    $("profileViewAge").textContent = age === null ? "—" : String(age);
    $("profileViewCompany").textContent = profile.company_name || "—";
    $("profileViewSector").textContent = sectorLabel(profile.sector_code);
    const sector = PROFILE_CATALOG.find((item) => item.code === profile.sector_code);
    const job = sector?.jobs.find((item) => item.code === profile.job_code);
    $("profileViewJob").textContent = job?.title || profile.job_title || "—";
    $("profileViewCode").textContent = profile.job_code || "—";
  }

  async function loadWorkerProfile() {
    if (!client || !currentUser || currentRole !== "worker") return false;
    hide("consentPanel");
    hide("supportForm");
    hide("profileSummary");
    message("profileMessage", "");
    const { data, error } = await client
      .from("omhsq_worker_profiles")
      .select("user_id, full_name, date_of_birth, company_name, sector_code, job_title, job_code")
      .eq("user_id", currentUser.id)
      .maybeSingle();
    if (error) {
      currentWorkerProfile = null;
      console.error("Worker profile read error:", error);
      hide("profileForm");
      message("profileMessage", t("profileLoadError"), "error");
      return false;
    }
    if (!data) {
      currentWorkerProfile = null;
      setProfileFormValues(null);
      show("profileForm");
      hide("cancelProfileEditBtn");
      hide("consentPanel");
      message("profileMessage", t("profileRequired"));
      return false;
    }
    currentWorkerProfile = data;
    setProfileFormValues(data);
    showProfileSummary(data);
    show("profileSummary");
    hide("profileForm");
    show("consentPanel");
    await loadConsentState();
    return true;
  }

  async function saveWorkerProfile(event) {
    event.preventDefault();
    if (!client || !currentUser || currentRole !== "worker") return;
    const fullName = $("profileFullName").value.trim();
    const dob = $("profileDob").value;
    const company = $("profileCompany").value.trim();
    const sectorCode = $("profileSector").value;
    const jobCode = $("profileJobTitle").value;
    const sector = PROFILE_CATALOG.find((item) => item.code === sectorCode);
    const job = sector?.jobs.find((item) => item.code === jobCode);
    const age = calculateAge(dob);
    if (!fullName || !dob || age === null || !company || !sector || !job) {
      message("profileMessage", dob && age === null ? t("invalidDob") : t("profileRequired"), "error");
      return;
    }
    const payload = {
      user_id: currentUser.id,
      full_name: fullName,
      date_of_birth: dob,
      company_name: company,
      sector_code: sectorCode,
      job_title: job.title,
      job_code: job.code
    };
    const button = $("saveProfileBtn");
    setBusy(button, true, t("processing"));
    try {
      const { error } = await client
        .from("omhsq_worker_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) {
        console.error("Worker profile save error:", error);
        message("profileMessage", t("profileSaveError") + " " + error.message, "error");
        return;
      }
      await loadWorkerProfile();
      message("profileMessage", t("profileSaved"), "success");
    } catch (error) {
      console.error("Worker profile save exception:", error);
      message("profileMessage", t("profileSaveError"), "error");
    } finally {
      setBusy(button, false, t("saveProfile"));
    }
  }

  function editWorkerProfile() {
    if (!currentUser || currentRole !== "worker" || !currentWorkerProfile) return;
    setProfileFormValues(currentWorkerProfile);
    hide("profileSummary");
    show("profileForm");
    show("cancelProfileEditBtn");
    message("profileMessage", "");
  }

  async function cancelWorkerProfileEdit() {
    await loadWorkerProfile();
  }

  async function loadOwnerProfiles() {
    if (!client || !currentUser || currentRole !== "super_admin") return;
    const tbody = $("ownerProfileRows");
    if (!tbody) return;
    tbody.replaceChildren();
    message("ownerProfileMessage", "");
    const { data, error } = await client
      .from("omhsq_worker_profiles")
      .select("user_id, full_name, date_of_birth, company_name, sector_code, job_title, job_code")
      .order("full_name", { ascending: true })
      .limit(500);
    if (error) {
      console.error("Owner profile read error:", error);
      message("ownerProfileMessage", t("ownerProfilesError") + " " + error.message, "error");
      return;
    }
    if (!data?.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.textContent = t("noProfiles");
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }
    data.forEach((profile) => {
      const tr = document.createElement("tr");
      const values = [
        profile.full_name,
        profile.date_of_birth,
        calculateAge(profile.date_of_birth) ?? "—",
        profile.company_name,
        sectorLabel(profile.sector_code),
        profile.job_title,
        profile.job_code
      ];
      values.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = String(value ?? "—");
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
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

    // Current privacy version is granted.
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

    // Previous consent was withdrawn.
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

    await loadWorkerProfile();
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
        currentUser = null;
        currentRole = null;

        clearUserIdentity();

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
        currentUser = null;
        currentRole = null;

        clearUserIdentity();

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

      // No authenticated user.
      if (!currentUser) {
        currentRole = null;
        activeConsentVersion = null;

        clearUserIdentity();

        hideAllPanels();
        show("authPanel");
        hide("logoutBtn");

        return;
      }

      show("logoutBtn");

      // Verify the role directly from Supabase.
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

        currentRole = null;
        clearUserIdentity();

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

      // Display authenticated email and verified role.
      updateUserIdentity(currentUser, currentRole);

      hideAllPanels();

      if (currentRole === "super_admin") {
        show("ownerPanel");
        await loadOwnerRequests();
        await loadOwnerProfiles();

      } else if (currentRole === "professional") {
        show("professionalPanel");
        await loadProfessionalRequests();

      } else if (currentRole === "worker") {
        await showWorkerView();

      } else {
        currentRole = null;
        clearUserIdentity();

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

      currentRole = null;
      clearUserIdentity();

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
      activeConsentVersion = null;

      clearUserIdentity();

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

    clearUserIdentity();

    await refreshView();
  }

  // =========================================================
  // 15. EVENT LISTENERS
  // =========================================================

  if ($("languageBtn")) {
    $("languageBtn").addEventListener("click", () => {
      lang = lang === "ar" ? "en" : "ar";
      applyLanguage();
    });
  }

  if ($("loginTab")) {
    $("loginTab").addEventListener("click", () => {
      setAuthMode("login");
    });
  }

  if ($("signupTab")) {
    $("signupTab").addEventListener("click", () => {
      setAuthMode("signup");
    });
  }

  if ($("authForm")) {
    $("authForm").addEventListener(
      "submit",
      handleAuthentication
    );
  }

  if ($("forgotBtn")) {
    $("forgotBtn").addEventListener(
      "click",
      sendPasswordReset
    );
  }

  if ($("recoveryForm")) {
    $("recoveryForm").addEventListener(
      "submit",
      handleRecovery
    );
  }

  if ($("logoutBtn")) {
    $("logoutBtn").addEventListener(
      "click",
      logout
    );
  }

  if ($("consentForm")) {
    $("consentForm").addEventListener(
      "submit",
      grantConsent
    );
  }

  if ($("withdrawConsentBtn")) {
    $("withdrawConsentBtn").addEventListener(
      "click",
      withdrawConsent
    );
  }

  if ($("supportForm")) {
    $("supportForm").addEventListener(
      "submit",
      submitSupportRequest
    );
  }

  if ($("profileSector")) {
    $("profileSector").addEventListener("change", () => {
      populateProfileJobs($("profileSector").value);
    });
  }
  if ($("profileJobTitle")) {
    $("profileJobTitle").addEventListener("change", updateProfileJobCode);
  }
  if ($("profileDob")) {
    $("profileDob").addEventListener("change", updateProfileAge);
    $("profileDob").max = new Date().toISOString().slice(0, 10);
  }
  if ($("profileForm")) {
    $("profileForm").addEventListener("submit", saveWorkerProfile);
  }
  if ($("editProfileBtn")) {
    $("editProfileBtn").addEventListener("click", editWorkerProfile);
  }
  if ($("cancelProfileEditBtn")) {
    $("cancelProfileEditBtn").addEventListener("click", cancelWorkerProfileEdit);
  }

  if ($("refreshProfessional")) {
    $("refreshProfessional").addEventListener(
      "click",
      loadProfessionalRequests
    );
  }

  if ($("refreshOwner")) {
    $("refreshOwner").addEventListener(
      "click",
      async () => {
        await loadOwnerRequests();
        await loadOwnerProfiles();
      }
    );
  }

  if ($("backToWorker")) {
    $("backToWorker").addEventListener(
      "click",
      async () => {
        hide("confirmationPanel");
        show("workerPanel");
        await loadConsentState();
      }
    );
  }

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

        clearUserIdentity();

        hideAllPanels();
        show("authPanel");
        hide("logoutBtn");
      }

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION"
      ) {
        if (!recoveryMode) {
          // Let Supabase finish the auth event before querying
          // the session and the user's database role.
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
  populateProfileSectors();
  setAuthMode("login");
  clearUserIdentity();
  refreshView();

})();
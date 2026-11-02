(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const config = window.OMHSQ_CONFIG || {};
  const validConfig = config.SUPABASE_URL?.includes(".supabase.co") &&
    !config.SUPABASE_URL.includes("YOUR-") &&
    config.SUPABASE_PUBLISHABLE_KEY &&
    !config.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
  const client = (validConfig && window.supabase)
    ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY)
    : null;

  let authMode = "login";
  let lang = "ar";
  let currentUser = null;
  const translations = {
    en: {
      subtitle:"Occupational Mental Health Screening Questionnaire", pilotTitle:"Technical pilot version",
      pilotText:"This version manages support requests and establishes the technical platform. It does not diagnose or classify mental disorders and must not be used for fitness, employment or personnel decisions.",
      welcome:"Welcome", authIntro:"Sign in or create an account to access the confidential support form.", login:"Sign in", signup:"Create account",
      email:"Email address", password:"Password", forgot:"Forgot password?", logout:"Sign out", stageOne:"Stage 1",
      workerTitle:"Support and follow-up request", private:"Confidential", workerIntro:"Use this form to indicate areas in which you would like information or support. You may request help without selecting any area.",
      privacyTitle:"Consent and privacy", privacyText:"Your responses are stored in a restricted database and are accessible only to authorized professionals providing support. They are not used for recruitment, promotion or medical fitness decisions. Confidentiality may have limits where there is an imminent risk to your safety or someone else's, in accordance with applicable medical and legal procedures.",
      consentText:"I voluntarily agree to participate and allow my information to be stored for contact and support purposes after reading the privacy statement.",
      domainsTitle:"Which areas would you like information or support about?", domainsHint:"Select any number of areas, or leave them blank.",
      dMood:"Mood and loss of interest", dAnxiety:"Anxiety and stress", dSleep:"Sleep and fatigue", dStress:"Work and life pressures",
      dTrauma:"Coping with an accident or traumatic experience", dRelationships:"Relationships and social support", dOther:"Another topic",
      helpTitle:"Would you like to be contacted by a professional for support?", yes:"Yes", no:"Not at this time", infoOnly:"Information only",
      safetyTitle:"Immediate safety question", safetyQuestion:"Do you feel at this moment that you might harm yourself or someone else, or that you cannot keep yourself safe?",
      preferNot:"Prefer not to answer", urgentHelp:"If you are in immediate danger, do not wait for this app: contact local emergency services or the nearest emergency department now, and ask a trusted person to stay with you. This form is not an emergency service and is not monitored in real time.",
      notesLabel:"Optional note (please do not include highly sensitive details)", confirmText:"I confirm that the information I entered reflects my current wish to seek support.",
      submitRequest:"Submit confidential request", adminTitle:"Authorized professional dashboard", restricted:"Restricted access",
      adminIntro:"This dashboard displays support requests that database permissions allow the authorized professional to review. It does not display diagnostic results.",
      refresh:"Refresh list", date:"Date", request:"Contact request", domains:"Areas", safety:"Immediate safety", status:"Status",
      savedTitle:"Your request has been received", savedText:"Thank you. Your request has been saved. If you requested contact, it will be handled through the approved follow-up process. Do not use this app in an emergency.",
      footer:"Pilot version – not for diagnosis or fitness decisions", noRequests:"No requests available.", yesShort:"Yes", noShort:"No",
      statusNew:"New", statusPreferNot:"Prefer not to answer", configMissing:"Please configure the Supabase URL and publishable key in supabase-config.js.",
      consentRequired:"Please read and accept the consent statement.", submitError:"Could not save your request. Please try again or contact the support team.",
      configReady:"", loginError:"Sign-in failed. Check your email and password.", signupSent:"Account created. Check your email for the confirmation link before signing in.",
      signupError:"Could not create the account. The email may already be registered.", resetSent:"If the address is registered, a password reset email has been sent.",
      resetError:"Could not send the reset email.", sessionError:"Could not verify your session.", adminError:"Unable to load requests. Check your authorized role and database policies."
    },
    ar: {
      subtitle:"استبيان الصحة النفسية المهنية", pilotTitle:"نسخة تأسيسية تجريبية",
      pilotText:"هذه النسخة لإدارة طلبات الدعم وبناء النظام التقني. لا تقدم تشخيصاً أو تصنيفاً نفسياً، ولا تستخدم في قرارات اللياقة أو التوظيف أو الوضع الوظيفي.",
      welcome:"مرحباً بك", authIntro:"سجّل الدخول أو أنشئ حساباً للوصول إلى نموذج الدعم السري.", login:"تسجيل الدخول", signup:"إنشاء حساب",
      email:"البريد الإلكتروني", password:"كلمة المرور", forgot:"نسيت كلمة المرور؟", logout:"تسجيل الخروج", stageOne:"المرحلة الأولى",
      workerTitle:"طلب الدعم والمتابعة", private:"سري", workerIntro:"يتيح لك هذا النموذج تحديد مجالات الدعم التي ترغب في مناقشتها. يمكنك طلب المساعدة حتى دون تحديد أي مجال.",
      privacyTitle:"الموافقة والخصوصية", privacyText:"تُحفظ إجاباتك في قاعدة بيانات مقيّدة الوصول، وتُتاح فقط للمختصين المخوّلين بتقديم الدعم. لا تُستخدم هذه البيانات لاتخاذ قرارات التوظيف أو الترقية أو اللياقة الطبية. توجد حدود للسرية إذا ظهر خطر وشيك على سلامتك أو سلامة الآخرين، وفق الإجراءات الطبية والقانونية المعمول بها.",
      consentText:"أوافق طوعياً على المشاركة وحفظ المعلومات لغرض التواصل وتقديم الدعم، بعد قراءة بيان الخصوصية.",
      domainsTitle:"ما المجالات التي ترغب في الحصول على معلومات أو دعم بشأنها؟", domainsHint:"يمكنك اختيار أكثر من مجال أو تركها دون تحديد.",
      dMood:"المزاج وفقدان الاهتمام", dAnxiety:"القلق والتوتر", dSleep:"النوم والإرهاق", dStress:"ضغوط العمل والحياة",
      dTrauma:"التعامل مع حادث أو تجربة صادمة", dRelationships:"العلاقات والدعم الاجتماعي", dOther:"موضوع آخر",
      helpTitle:"هل ترغب في التواصل مع مختص لتقديم الدعم؟", yes:"نعم", no:"لا حالياً", infoOnly:"أرغب في معلومات فقط",
      safetyTitle:"سؤال السلامة العاجلة", safetyQuestion:"هل تشعر الآن أنك قد تؤذي نفسك أو شخصاً آخر، أو أنك غير قادر على الحفاظ على سلامتك؟",
      preferNot:"أفضل عدم الإجابة", urgentHelp:"إذا كنت في خطر فوري، لا تنتظر رد التطبيق: تواصل فوراً مع خدمات الطوارئ المحلية أو أقرب قسم طوارئ، واطلب من شخص موثوق البقاء معك. هذا النموذج ليس خدمة طوارئ ولا تتم مراقبته لحظياً.",
      notesLabel:"ملاحظة اختيارية (يرجى عدم كتابة تفاصيل شديدة الحساسية)", confirmText:"أؤكد أن المعلومات التي أدخلتها تعبر عن رغبتي الحالية في طلب الدعم.",
      submitRequest:"إرسال الطلب السري", adminTitle:"لوحة المختص المخوّل", restricted:"وصول مقيّد",
      adminIntro:"تعرض هذه اللوحة طلبات الدعم التي تسمح صلاحيات قاعدة البيانات للمختص المخوّل بمراجعتها. لا تعرض نتائج تشخيصية.",
      refresh:"تحديث القائمة", date:"التاريخ", request:"طلب التواصل", domains:"المجالات", safety:"السلامة العاجلة", status:"الحالة",
      savedTitle:"تم استلام طلبك", savedText:"شكراً لك. تم حفظ طلبك. إذا طلبت التواصل، فسيتم التعامل معه وفق آلية المتابعة المعتمدة. لا تستخدم هذا التطبيق في حالات الطوارئ.",
      footer:"نسخة تجريبية – لا تستخدم للتشخيص أو قرارات اللياقة", noRequests:"لا توجد طلبات متاحة.", yesShort:"نعم", noShort:"لا",
      statusNew:"جديد", statusPreferNot:"أفضل عدم الإجابة", configMissing:"يرجى إدخال رابط مشروع Supabase والمفتاح العام في ملف supabase-config.js.",
      consentRequired:"يرجى قراءة بيان الموافقة والموافقة عليه.", submitError:"تعذر حفظ الطلب. يرجى المحاولة مرة أخرى أو التواصل مع فريق الدعم.",
      configReady:"", loginError:"تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.", signupSent:"تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.",
      signupError:"تعذر إنشاء الحساب. قد يكون البريد مسجلاً بالفعل.", resetSent:"إذا كان البريد مسجلاً، فسيتم إرسال رابط إعادة تعيين كلمة المرور.",
      resetError:"تعذر إرسال رسالة إعادة تعيين كلمة المرور.", sessionError:"تعذر التحقق من جلسة الدخول.", adminError:"تعذر تحميل الطلبات. تحقق من صلاحية المختص وسياسات قاعدة البيانات."
    }
  };
  const t = (key) => translations[lang][key] || key;
  const show = (id) => $(id).classList.remove("hidden");
  const hide = (id) => $(id).classList.add("hidden");
  const message = (id, text, kind="") => { $(id).textContent = text; $(id).className = `message ${kind}`; };
  const setBusy = (button, busy, label) => { button.disabled = busy; if (label) button.textContent = label; };

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang][key]) el.textContent = t(key);
    });
    $("languageBtn").textContent = lang === "ar" ? "English" : "العربية";
    $("authSubmit").textContent = t(authMode);
    $("password").autocomplete = authMode === "login" ? "current-password" : "new-password";
  }

  function setAuthMode(mode) {
    authMode = mode;
    $("loginTab").classList.toggle("active", mode === "login");
    $("signupTab").classList.toggle("active", mode === "signup");
    $("authSubmit").textContent = t(mode);
    $("forgotBtn").classList.toggle("hidden", mode !== "login");
    message("authMessage", "");
  }

  async function refreshView() {
    if (!client) {
      show("authPanel");
      message("authMessage", t("configMissing"), "error");
      return;
    }
    const { data, error } = await client.auth.getSession();
    if (error) { message("authMessage", t("sessionError"), "error"); return; }
    currentUser = data.session?.user || null;
    hide("authPanel"); hide("workerPanel"); hide("adminPanel"); hide("confirmationPanel");
    if (!currentUser) {
      show("authPanel"); hide("logoutBtn"); return;
    }
    show("logoutBtn");
    const { data: roleRow } = await client.from("omhsq_user_roles").select("role").eq("user_id", currentUser.id).maybeSingle();
    if (roleRow?.role === "admin" || roleRow?.role === "professional") {
      show("adminPanel"); await loadAdminRequests();
    } else {
      show("workerPanel");
    }
  }

  async function loadAdminRequests() {
    if (!client) return;
    message("adminMessage", "");
    const { data, error } = await client.from("omhsq_support_requests")
      .select("id, created_at, help_request, domains, urgent_safety, status")
      .order("created_at", { ascending: false }).limit(100);
    if (error) { message("adminMessage", t("adminError"), "error"); return; }
    const tbody = $("adminRows");
    tbody.replaceChildren();
    if (!data?.length) {
      const tr = document.createElement("tr"); const td = document.createElement("td");
      td.colSpan = 5; td.textContent = t("noRequests"); tr.appendChild(td); tbody.appendChild(tr); return;
    }
    data.forEach(row => {
      const tr = document.createElement("tr");
      const values = [
        new Date(row.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB"),
        row.help_request === "yes" ? t("yesShort") : row.help_request === "no" ? t("noShort") : t("infoOnly"),
        (row.domains || []).join(", ") || "—",
        row.urgent_safety === "yes" ? t("yesShort") : row.urgent_safety === "no" ? t("noShort") : t("statusPreferNot"),
        row.status || t("statusNew")
      ];
      values.forEach(value => { const td = document.createElement("td"); td.textContent = value; tr.appendChild(td); });
      tbody.appendChild(tr);
    });
  }

  $("languageBtn").addEventListener("click", () => { lang = lang === "ar" ? "en" : "ar"; applyLanguage(); });
  $("loginTab").addEventListener("click", () => setAuthMode("login"));
  $("signupTab").addEventListener("click", () => setAuthMode("signup"));

  $("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!client) { message("authMessage", t("configMissing"), "error"); return; }
    const button = $("authSubmit");
    const email = $("email").value.trim();
    const password = $("password").value;
    setBusy(button, true, "…");
    if (authMode === "signup") {
      const { error } = await client.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${location.origin}${location.pathname}` }
      });
      if (error) message("authMessage", t("signupError") + " " + error.message, "error");
      else message("authMessage", t("signupSent"), "success");
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) message("authMessage", t("loginError"), "error");
      else await refreshView();
    }
    setBusy(button, false, t(authMode));
  });

  $("forgotBtn").addEventListener("click", async () => {
    if (!client) return message("authMessage", t("configMissing"), "error");
    const email = $("email").value.trim();
    if (!email) return message("authMessage", lang === "ar" ? "أدخل بريدك الإلكتروني أولاً." : "Enter your email address first.", "error");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}`
    });
    message("authMessage", error ? t("resetError") : t("resetSent"), error ? "error" : "success");
  });

  $("logoutBtn").addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    await refreshView();
  });

  $("supportForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!client || !currentUser) return;
    if (!$("consent").checked) return message("formMessage", t("consentRequired"), "error");
    const domains = [...document.querySelectorAll('input[name="domains"]:checked')].map(el => el.value);
    const helpRequest = document.querySelector('input[name="help_request"]:checked')?.value;
    const urgentSafety = document.querySelector('input[name="urgent_safety"]:checked')?.value;
    const payload = {
      user_id: currentUser.id,
      consent: true,
      consent_version: "OMHSQ-PRIVACY-0.1",
      domains,
      help_request: helpRequest,
      urgent_safety: urgentSafety,
      optional_note: $("notes").value.trim() || null,
      status: "new",
      language: lang
    };
    const button = $("supportForm").querySelector('button[type="submit"]');
    setBusy(button, true, "…");
    const { error } = await client.from("omhsq_support_requests").insert(payload);
    setBusy(button, false, t("submitRequest"));
    if (error) return message("formMessage", t("submitError") + " " + error.message, "error");
    hide("workerPanel"); show("confirmationPanel");
  });

  $("refreshAdmin").addEventListener("click", loadAdminRequests);

  if (client) {
    client.auth.onAuthStateChange(() => { setTimeout(refreshView, 0); });
  }
  applyLanguage();
  refreshView();
})();

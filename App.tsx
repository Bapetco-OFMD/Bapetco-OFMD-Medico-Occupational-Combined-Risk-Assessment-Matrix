import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase, supabaseConfigured, roleNames, siteNames } from './supabase'
import type { RoleAssignment, RoleCode } from './supabase'

type CaseRow = { id: string; case_number: number; workflow_status: string; site_id: string; created_at: string; review_round: number; worker_user_id: string; worker_record_id: string }
type CaseWorker = { id:string; full_name:string; employee_number:string; company_name:string; job_title:string; job_code:string|null; site_id:string; date_of_birth:string }
type MedicalProfile = { conditions:unknown[]; medications:unknown[]; allergies:unknown[]; medical_notes:string|null; height_cm:number|null; weight_kg:number|null }
type AdminUser = { id:string; email:string|null; created_at:string; last_sign_in_at:string|null; confirmed:boolean }
type AdminAssignment = { id:string; user_id:string; role_code:RoleCode; site_id:string|null; is_active:boolean }
type CaseEvent = { id:number; event_type:string; from_status:string|null; to_status:string|null; reason:string|null; created_at:string; actor_user_id:string|null }
type SafetyReview = { decision:string; control_measure_grade:number|null; control_measure_notes:string|null; comments:string|null; review_round:number }
type MedicalReview = { decision:string; health_status_indicator:number|null; comments:string|null; review_round:number }
type WorkerRow = { id: string; full_name: string; employee_number: string; job_title: string; site_id: string; date_of_birth: string | null }
type HazardRow = { id: string; hazard_name: string; hazard_category: string; severity_level: number; exposure_level: number; control_availability: number | null; control_description?:string|null; case_id: string }
type HazardGrade = { severity_level: number; exposure_level: number }

function canViewMedicalData(role: RoleCode | ''): boolean {
  return role === 'worker' || role === 'site_doctor' || role === 'review_doctor' || role === 'occupational_health_responsible'
}
const statusAr: Record<string,string> = { worker_draft:'مسودة', submitted:'تم الإرسال', parallel_review:'مراجعة الموقع', central_review:'مراجعة مركزية', finalized:'مكتمل', returned_for_correction:'معاد للتصحيح', closed:'مغلق' }

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [assignments, setAssignments] = useState<RoleAssignment[]>([])
  const [role, setRole] = useState<RoleCode | ''>('')
  const [lang, setLang] = useState<'ar'|'en'>('ar')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [cases, setCases] = useState<CaseRow[]>([])
  const [worker, setWorker] = useState<WorkerRow | null>(null)
  const [hazards, setHazards] = useState<HazardRow[]>([])
  const [safetyGrades, setSafetyGrades] = useState<Record<string,HazardGrade>>({})
  const [tab, setTab] = useState('overview')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState({full_name:'',employee_number:'',date_of_birth:'',company_name:'',job_title:'',job_code:'',site_id:'badr_3'})
  const [medical, setMedical] = useState({conditions:'',medications:'',allergies:'',medical_notes:'',height_cm:'',weight_kg:''})
  const [hazardForm, setHazardForm] = useState({hazard_name:'',hazard_category:'',severity_level:'2',exposure_level:'2',control_description:''})
  const [reviewForm, setReviewForm] = useState({decision:'approved',health_status_indicator:'',comments:'',control_measure_grade:'',control_measure_notes:''})
  const [selectedCase, setSelectedCase] = useState('')
  const [caseWorker, setCaseWorker] = useState<CaseWorker|null>(null)
  const [caseMedical, setCaseMedical] = useState<MedicalProfile|null>(null)
  const [caseEvents, setCaseEvents] = useState<CaseEvent[]>([])
  const [caseSafetyReview, setCaseSafetyReview] = useState<SafetyReview|null>(null)
  const [caseMedicalReview, setCaseMedicalReview] = useState<MedicalReview|null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminAssignments, setAdminAssignments] = useState<AdminAssignment[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [newRole, setNewRole] = useState<RoleCode>('worker')
  const [newSite, setNewSite] = useState('badr_3')
  const t = (ar:string,en:string) => lang === 'ar' ? ar : en

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({data}) => setSession(data.session))
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setAssignments([]); setRole(''); setCases([]); setWorker(null); setHazards([]); setCaseWorker(null); setCaseMedical(null); setCaseEvents([]); setCaseSafetyReview(null); setCaseMedicalReview(null); setAdminUsers([]); setAdminAssignments([]) })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session?.user?.id) void loadAssignments() }, [session?.user?.id])
  useEffect(() => { if (session?.user?.id && role) void loadWorkspace() }, [session?.user?.id, role])

  async function loadAssignments() {
    if (!supabase || !session) return
    setBusy(true)
    const {data,error} = await supabase.from('mhr_role_assignments').select('id,role_code,site_id,is_active').eq('user_id',session.user.id).eq('is_active',true)
    if (error) setNotice(error.message)
    else { const list = (data || []) as RoleAssignment[]; setAssignments(list); if (list.length === 1) setRole(list[0].role_code) }
    setBusy(false)
  }
  async function loadCaseDetail(caseId:string) {
    if (!supabase) return
    setCaseWorker(null); setCaseMedical(null); setCaseEvents([]); setCaseSafetyReview(null); setCaseMedicalReview(null)
    const {data:c,error:ce}=await supabase.from('mhr_cases').select('id,worker_record_id,review_round').eq('id',caseId).maybeSingle()
    if (ce) { setNotice(ce.message); return }
    if (!c) return
    const {data:wr,error:we} = await supabase.from('mhr_worker_records').select('id,full_name,employee_number,company_name,job_title,job_code,site_id,date_of_birth').eq('id',c.worker_record_id).maybeSingle()
    if (we) { setNotice(we.message); return }
    if (wr) setCaseWorker(wr as CaseWorker)
    const {data:sr,error:se}=await supabase.from('mhr_safety_reviews').select('decision,control_measure_grade,control_measure_notes,comments,review_round').eq('case_id',caseId).eq('review_round',c.review_round).order('created_at',{ascending:false}).limit(1).maybeSingle()
    if (se) setNotice(se.message); else if (sr) setCaseSafetyReview(sr as SafetyReview)
    if (canViewMedicalData(role) && wr) {
      const {data:mp,error:me} = await supabase.from('mhr_worker_medical_profiles').select('conditions,medications,allergies,medical_notes,height_cm,weight_kg').eq('worker_record_id',wr.id).maybeSingle()
      if (me) setNotice(me.message)
      if (mp) setCaseMedical(mp as MedicalProfile)
      const {data:mr,error:me2}=await supabase.from('mhr_medical_reviews').select('decision,health_status_indicator,comments,review_round').eq('case_id',caseId).eq('review_round',c.review_round).order('created_at',{ascending:false}).limit(1).maybeSingle()
      if (me2) setNotice(me2.message); else if (mr) setCaseMedicalReview(mr as MedicalReview)
    }
    if (role !== 'site_safety_officer') {
      const {data:ev,error:ee} = await supabase.from('mhr_case_events').select('id,event_type,from_status,to_status,reason,created_at,actor_user_id').eq('case_id',caseId).order('created_at',{ascending:true})
      if (ee) setNotice(ee.message); else setCaseEvents((ev||[]) as CaseEvent[])
    }
  }
  function selectCase(id:string) { setSelectedCase(id); setReviewForm({decision:'approved',health_status_indicator:'',comments:'',control_measure_grade:'',control_measure_notes:''}); void loadHazards(id); void loadCaseDetail(id) }
  async function loadAdminData() {
    if (!supabase) return
    const {data,error} = await supabase.functions.invoke('mhr-admin-users',{body:{action:'list',page:1}})
    if (error) { setNotice(error.message); return }
    if (data?.error) { setNotice(data.error); return }
    setAdminUsers((data?.users||[]) as AdminUser[])
    const {data:ra,error:re} = await supabase.from('mhr_role_assignments').select('id,user_id,role_code,site_id,is_active').order('created_at',{ascending:false})
    if (re) setNotice(re.message); else setAdminAssignments((ra||[]) as AdminAssignment[])
  }
  async function inviteAccount(e:FormEvent) {
    e.preventDefault(); if (!supabase || !inviteEmail.trim()) return
    setBusy(true); setNotice('')
    const {data,error} = await supabase.functions.invoke('mhr-admin-users',{body:{action:'invite',email:inviteEmail.trim()}})
    if (error) setNotice(error.message)
    else if (data?.error) setNotice(data.error)
    else { setNotice(t('تم إرسال دعوة الحساب. لم تُمنح له صلاحية بعد.','Invitation sent. No role has been assigned yet.')); setInviteEmail(''); await loadAdminData() }
    setBusy(false)
  }
  async function assignRole(e:FormEvent) {
    e.preventDefault(); if (!supabase || !targetUserId) return
    setBusy(true); setNotice('')
    const site_id = (newRole==='site_doctor'||newRole==='site_safety_officer') ? newSite : null
    if (adminAssignments.some(a=>a.user_id===targetUserId&&a.role_code===newRole&&a.site_id===site_id&&a.is_active)) { setNotice(t('هذا الدور مسند بالفعل لهذا الحساب.','This role is already assigned to this account.')); setBusy(false); return }
    const {error} = await supabase.from('mhr_role_assignments').insert({user_id:targetUserId,role_code:newRole,site_id,is_active:true,created_by:session.user.id})
    if (error) setNotice(error.message)
    else { setNotice(t('تم إسناد الدور.','Role assigned.')); await loadAdminData() }
    setBusy(false)
  }
  async function deactivateAssignment(id:string) {
    if (!supabase) return
    setBusy(true); const {error}=await supabase.from('mhr_role_assignments').update({is_active:false}).eq('id',id)
    setNotice(error?error.message:t('تم إيقاف التعيين.','Assignment deactivated.')); await loadAdminData(); setBusy(false)
  }
  async function loadWorkspace() {
    if (!supabase || !role) return
    setBusy(true)
    if (role === 'worker') {
      const {data:wr,error:we} = await supabase.from('mhr_worker_records').select('*').eq('worker_user_id',session.user.id).maybeSingle()
      if (we) setNotice(we.message)
      if (wr) {
        setWorker(wr as WorkerRow); setProfile({full_name:wr.full_name||'',employee_number:wr.employee_number||'',date_of_birth:wr.date_of_birth||'',company_name:wr.company_name||'',job_title:wr.job_title||'',job_code:wr.job_code||'',site_id:wr.site_id||'badr_3'})
        const {data:mp} = await supabase.from('mhr_worker_medical_profiles').select('*').eq('worker_record_id',wr.id).maybeSingle()
        if (mp) setMedical({conditions:JSON.stringify(mp.conditions||[]),medications:JSON.stringify(mp.medications||[]),allergies:JSON.stringify(mp.allergies||[]),medical_notes:mp.medical_notes||'',height_cm:String(mp.height_cm||''),weight_kg:String(mp.weight_kg||'')})
        const {data:cs} = await supabase.from('mhr_cases').select('*').eq('worker_user_id',session.user.id).order('created_at',{ascending:false})
        setCases((cs||[]) as CaseRow[])
      } else { setWorker(null); setCases([]); setMedical({conditions:'',medications:'',allergies:'',medical_notes:'',height_cm:'',weight_kg:''}) }
    } else {
      let q = supabase.from('mhr_cases').select('*').order('created_at',{ascending:false}).limit(100)
      if (role === 'site_safety_officer' || role === 'site_doctor') {
        const siteIds = assignments.filter(a=>a.role_code===role).map(a=>a.site_id).filter(Boolean) as string[]
        if (siteIds.length) q = q.in('site_id',siteIds)
      }
      if (role === 'site_safety_officer' || role === 'site_doctor') q = q.in('workflow_status',['submitted','parallel_review'])
      if (role === 'review_doctor' || role === 'occupational_health_responsible') q = q.in('workflow_status',['central_review','finalized'])
      const {data,error} = await q
      if (error) { setNotice(error.message); setCases([]) } else { setCases((data||[]) as CaseRow[]); if (role==='system_owner') await loadAdminData() }
    }
    setBusy(false)
  }
  async function signIn(e:FormEvent) { e.preventDefault(); if(!supabase)return; setBusy(true); setNotice(''); const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)setNotice(error.message); setBusy(false) }
  async function saveWorker(e:FormEvent) {
    e.preventDefault(); if(!supabase)return; if(cases.some(c=>['submitted','parallel_review','central_review'].includes(c.workflow_status))){setNotice(t('لا يمكن تعديل البيانات الأساسية أثناء وجود ملف قيد المراجعة.','Profile editing is locked while a case is under review.'));return} setBusy(true); setNotice('')
    const payload = {...profile, worker_user_id:session.user.id, date_of_birth:profile.date_of_birth||null}
    const result = worker ? await supabase.from('mhr_worker_records').update(payload).eq('id',worker.id).select().single() : await supabase.from('mhr_worker_records').insert(payload).select().single()
    if(result.error) setNotice(result.error.message)
    else {
      setWorker(result.data as WorkerRow)
      const parseArray=(v:string)=>{try{const x=JSON.parse(v||'[]');return Array.isArray(x)?x:[v].filter(Boolean)}catch{return v.split(/[،,\n]/).map(x=>x.trim()).filter(Boolean)}}
      const mp={worker_record_id:result.data.id,conditions:parseArray(medical.conditions),medications:parseArray(medical.medications),allergies:parseArray(medical.allergies),medical_notes:medical.medical_notes,height_cm:medical.height_cm?Number(medical.height_cm):null,weight_kg:medical.weight_kg?Number(medical.weight_kg):null,updated_by:session.user.id}
      const {error:me}=await supabase.from('mhr_worker_medical_profiles').upsert(mp,{onConflict:'worker_record_id'})
      if(me)setNotice(t('تم حفظ البيانات المهنية، لكن تعذر حفظ الملف الطبي: ','Professional data saved, but medical profile failed: ')+me.message)
      else setNotice(t('تم حفظ البيانات.','Profile saved.'))
    }
    setBusy(false); await loadWorkspace()
  }
  async function createCase() {
    if(!supabase||!worker)return; if(cases.some(c=>['submitted','parallel_review','central_review'].includes(c.workflow_status))){setNotice(t('يوجد ملف قيد المراجعة بالفعل.','A case is already under review.'));return} setBusy(true); setNotice('')
    const {data,error}=await supabase.from('mhr_cases').insert({worker_record_id:worker.id,worker_user_id:session.user.id,site_id:worker.site_id,created_by:session.user.id}).select().single()
    if(error)setNotice(error.message); else {setSelectedCase(data.id);setNotice(t('تم إنشاء مسودة ملف جديدة.','New case draft created.'));}
    setBusy(false); await loadWorkspace()
  }
  async function addHazard(e:FormEvent) {
    e.preventDefault(); if(!supabase||!selectedCase)return; const c=cases.find(x=>x.id===selectedCase); if(!c || !['worker_draft','returned_for_correction'].includes(c.workflow_status)){setNotice(t('هذا الملف مقفل ولا يقبل إضافة أخطار.','This case is locked and cannot accept hazard edits.'));return} setBusy(true); setNotice('')
    
    const {error}=await supabase.from('mhr_hazard_assessments').insert({case_id:selectedCase,hazard_name:hazardForm.hazard_name,hazard_category:hazardForm.hazard_category||'غير مصنف',severity_level:Number(hazardForm.severity_level),exposure_level:Number(hazardForm.exposure_level),control_description:hazardForm.control_description,entered_by:session.user.id,version_no:1,review_round:c?.review_round||1})
    if(error)setNotice(error.message); else setNotice(t('تمت إضافة الخطر.','Hazard added.'))
    setBusy(false); await loadHazards(selectedCase)
  }
  async function loadHazards(caseId:string) { if(!supabase)return; const {data:caseRow,error:caseError}=await supabase.from('mhr_cases').select('review_round').eq('id',caseId).maybeSingle(); if(caseError||!caseRow){setHazards([]);setSafetyGrades({});if(caseError)setNotice(caseError.message);return;} const {data,error}=await supabase.from('mhr_hazard_assessments').select('*').eq('case_id',caseId).eq('review_round',caseRow.review_round).order('entered_at'); if(error)setNotice(error.message); else { const rows=(data||[]) as HazardRow[]; setHazards(rows); setSafetyGrades(Object.fromEntries(rows.map(h=>[h.id,{severity_level:h.severity_level,exposure_level:h.exposure_level}]))); } }
  async function submitCase() { if(!supabase||!selectedCase)return; setBusy(true); const {error}=await supabase.rpc('submit_worker_case',{p_case:selectedCase}); setNotice(error?error.message:t('تم إرسال الملف للمراجعة وقفل التعديل.','Case submitted and editing locked.')); setBusy(false); await loadWorkspace(); if(!error) await loadCaseDetail(selectedCase) }
  async function saveReview(e:FormEvent) {
    e.preventDefault(); if(!supabase||!selectedCase)return;
    if (reviewForm.decision==='approved'&&((role==='site_safety_officer'&&!reviewForm.control_measure_grade)||((role==='site_doctor'||role==='review_doctor')&&!reviewForm.health_status_indicator))) { setNotice(t('يرجى اختيار الدرجة المطلوبة قبل الاعتماد.','Select the required grade before approving.')); return }
    setBusy(true);setNotice('')
    const c=cases.find(x=>x.id===selectedCase); if(!c){setNotice(t('اختر ملفاً أولاً.','Select a case first.'));setBusy(false);return}
    let reviewNotice=''; let table=''; let payload:any={case_id:selectedCase,reviewer_user_id:session.user.id,decision:reviewForm.decision,comments:reviewForm.comments,version_no:1,review_round:c.review_round}
    if(role==='site_safety_officer') {
      if(reviewForm.decision==='approved'&&hazards.length===0){setNotice(t('لا يمكن اعتماد مراجعة السلامة دون أخطار مسجلة.','A safety review cannot be approved without recorded hazards.'));setBusy(false);return}
      table='mhr_safety_reviews'
      const reviewed=hazards.map(h=>({id:h.id,hazard_name:h.hazard_name,hazard_category:h.hazard_category,severity_level:safetyGrades[h.id]?.severity_level??h.severity_level,exposure_level:safetyGrades[h.id]?.exposure_level??h.exposure_level,control_description:h.control_description??null}))
      const top=[...reviewed].sort((a,b)=>(b.severity_level*b.exposure_level)-(a.severity_level*a.exposure_level))[0]
      payload={...payload,reviewed_hazards:reviewed,highest_risk_hazard_id:top?.id||null,control_measure_grade:reviewForm.control_measure_grade?Number(reviewForm.control_measure_grade):null,control_measure_notes:reviewForm.control_measure_notes}
    }
    else if(role==='site_doctor') {table='mhr_medical_reviews';payload={...payload,review_stage:'site_doctor',health_status_indicator:reviewForm.health_status_indicator?Number(reviewForm.health_status_indicator):null,examination_summary:{summary:reviewForm.comments}}}
    else if(role==='review_doctor') {
      table='mhr_central_reviews'
      const {data:siteMedical,error:siteMedicalError}=await supabase.from('mhr_medical_reviews').select('health_status_indicator').eq('case_id',selectedCase).eq('review_round',c.review_round).eq('review_stage','site_doctor').order('created_at',{ascending:false}).limit(1).maybeSingle()
      if(siteMedicalError){setNotice(siteMedicalError.message);setBusy(false);return}
      const siteGrade=Number(siteMedical?.health_status_indicator||0)
      if(reviewForm.decision==='approved'&&!siteGrade){setNotice(t('اعتماد طبيب الموقع غير موجود لهذه الجولة؛ راجع الملف قبل اعتماد المؤشر النهائي.','The site-doctor indicator is missing for this round; verify the case before approving the final indicator.'));setBusy(false);return}
      const entered=reviewForm.health_status_indicator?Number(reviewForm.health_status_indicator):null
      const finalGrade=reviewForm.decision==='approved'&&siteGrade&&entered?Math.max(entered,siteGrade):null
      payload={...payload,review_stage:role,final_health_indicator:finalGrade,recommendation:reviewForm.comments,medical_fitness_summary:{site_doctor_indicator:siteGrade||null,review_doctor_indicator:entered,aggregation_rule:'maximum_of_two_indicators'}}
      if(finalGrade) reviewNotice=t('المؤشر الصحي النهائي هو الأعلى بين تقييم طبيب الموقع وتقييم طبيب المراجعة: ','Final health indicator is the higher of the site-doctor and review-doctor values: ')+finalGrade
    }
    else {
      table='mhr_central_reviews'
      const {data:safetyReview,error:safetyError}=await supabase.from('mhr_safety_reviews').select('reviewed_hazards,highest_risk_hazard_id,control_measure_grade,control_measure_notes').eq('case_id',selectedCase).eq('review_round',c.review_round).order('created_at',{ascending:false}).limit(1).maybeSingle()
      if(safetyError){setNotice(safetyError.message);setBusy(false);return}
      if(reviewForm.decision==='approved'&&!safetyReview){setNotice(t('اعتماد مسؤول السلامة غير موجود لهذه الجولة.','The site-safety approval is missing for this round.'));setBusy(false);return}
      payload={...payload,review_stage:role,final_health_indicator:null,recommendation:reviewForm.comments,occupational_risk_summary:safetyReview?{reviewed_hazards:safetyReview.reviewed_hazards,highest_risk_hazard_id:safetyReview.highest_risk_hazard_id,control_measure_grade:safetyReview.control_measure_grade,control_measure_notes:safetyReview.control_measure_notes}:{}}
    }
    const {error}=await supabase.from(table).insert(payload)
    setNotice(error?error.message:(reviewNotice||t('تم تسجيل المراجعة.','Review saved.')));setBusy(false);await loadWorkspace();if(!error)await loadCaseDetail(selectedCase)
  }

  const currentAssignment = useMemo(()=>assignments.find(a=>a.role_code===role),[assignments,role])
  const selectedCaseRow = cases.find(c=>c.id===selectedCase)
  const mayViewMedical = canViewMedicalData(role)
  const userDisplayName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || t('مستخدم النظام','System user')
  const workflowProgress:Record<string,number> = {worker_draft:20,returned_for_correction:25,submitted:40,parallel_review:60,central_review:80,finalized:100,closed:100}
  const activeProgress = selectedCaseRow ? (workflowProgress[selectedCaseRow.workflow_status] ?? 0) : cases.length ? Math.round(cases.reduce((sum,c)=>sum+(workflowProgress[c.workflow_status]??0),0)/cases.length) : 0
  const progressLabel = selectedCaseRow ? t('تقدم الملف المحدد','Selected case progress') : t('متوسط تقدم الملفات المعروضة','Average progress of visible cases')
  const canReviewSelectedCase = Boolean(selectedCaseRow && ((['site_safety_officer','site_doctor'].includes(role) && ['submitted','parallel_review'].includes(selectedCaseRow.workflow_status)) || (['review_doctor','occupational_health_responsible'].includes(role) && selectedCaseRow.workflow_status==='central_review')))
  if (!supabaseConfigured) return <main className="setup"><section className="login-card"><Brand/><h1>{t('إعداد الاتصال بقاعدة البيانات','Connect your database')}</h1><p>{t('أضف مفتاح Supabase Publishable/anon في ملف البيئة المحلي. لا تستخدم service_role في المتصفح.','Add the Supabase publishable/anon key to the local environment file. Never use service_role in the browser.')}</p><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_ANON_KEY</code><p className="muted">Project: oafvsazddiwgjjhwwgix</p></section></main>
  if (!session) return <main className="setup"><form className="login-card" onSubmit={signIn}><Brand/><h1>{t('تسجيل الدخول','Sign in')}</h1><p className="muted">{t('منصة اللياقة الصحية والمهنية','Medico-occupational fitness platform')}</p><label>{t('البريد الإلكتروني','Email')}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>{t('كلمة المرور','Password')}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={busy}>{busy?t('جارٍ الدخول…','Signing in…'):t('دخول آمن','Secure sign in')}</button><div className="notice">{notice}</div></form></main>
  return <div className="app" dir={lang==='ar'?'rtl':'ltr'}>
    <header className="topbar"><Brand/><div className="top-actions"><div className="identity-chip"><strong>{userDisplayName}</strong><small>{role?roleNames[role][lang]:t('لم يتم اختيار دور','No role selected')}</small></div><button className="ghost" onClick={()=>setLang(lang==='ar'?'en':'ar')}>{lang==='ar'?'English':'العربية'}</button><button className="ghost" onClick={()=>supabase?.auth.signOut()}>{t('خروج','Sign out')}</button></div></header>
    <div className="shell"><aside className="sidebar"><div className="side-label">{t('مساحة العمل','WORKSPACE')}</div>{assignments.map(a=><button key={a.id} className={'role-button '+(role===a.role_code?'active':'')} onClick={()=>{setRole(a.role_code);setTab('overview');setNotice('');setSelectedCase('');setCases([]);setWorker(null);setCaseWorker(null);setCaseMedical(null);setCaseEvents([]);setCaseSafetyReview(null);setCaseMedicalReview(null);setHazards([])}}><span>{roleNames[a.role_code][lang]}</span><small>{a.site_id?siteNames[a.site_id]:t('مركزي','Central')}</small></button>)}<div className="side-foot">MHR Scale · v2.0.6<br/><span>{t('بيئة تجريبية حتى اعتماد التشغيل','Pre-production until approved')}</span></div></aside>
      <main className="content"><div className="page-head"><div><div className="eyebrow">{t('لوحة التحكم','DASHBOARD')}</div><h1>{role?roleNames[role][lang]:t('اختر دوراً','Select a role')}</h1><p>{currentAssignment?.site_id?siteNames[currentAssignment.site_id]:t('إدارة آمنة لمسارات اللياقة المهنية والصحية','Secure occupational and medical workflow')}</p></div><button className="outline" onClick={()=>{setNotice('');void loadWorkspace()}}>{t('تحديث البيانات','Refresh')}</button></div>
        {role&&<section className="progress-panel" aria-label={t('تقدم المهام','Task progress')}><div className="progress-heading"><div><strong>{progressLabel}</strong><small>{selectedCaseRow?`#${selectedCaseRow.case_number} · ${statusAr[selectedCaseRow.workflow_status]||selectedCaseRow.workflow_status}`:t(`${cases.length} ملف في نطاق العرض`,`${cases.length} cases in view`)}</small></div><b>{activeProgress}%</b></div><div className="progress-track"><span style={{width:`${activeProgress}%`}}/></div><div className="progress-foot">{activeProgress===100?t('اكتملت مراحل الملفات المعروضة','Visible case workflow is complete'):t('النسبة تعكس مراحل سير الملف، ولا تعني اعتماداً طبياً نهائياً.','This reflects workflow stages, not a medical fitness decision.')}</div></section>}
        {notice&&<div className="notice">{notice}</div>}
        {!role&&<section className="panel"><h2>{t('لا توجد صلاحية محددة','No active role selected')}</h2><p>{t('اختر أحد الأدوار المخصصة لحسابك. إذا لم تظهر الأدوار، راجع مالك النظام.','Choose one of the roles assigned to your account. If none appear, contact the system owner.')}</p></section>}
        {role==='worker'&&<><div className="stats"><Stat n={String(cases.length)} label={t('ملفاتي','My cases')}/><Stat n={String(cases.filter(c=>c.workflow_status==='finalized').length)} label={t('ملفات مكتملة','Finalized')}/><Stat n={String(cases.filter(c=>c.workflow_status==='returned_for_correction').length)} label={t('تحتاج تصحيحاً','Needs correction')}/></div><section className="panel"><div className="panel-title"><div><h2>{t('البيانات الأساسية','Personal and job profile')}</h2><p>{t('تُحفظ البيانات الطبية في جدول منفصل وتخضع لصلاحيات الطبيب فقط.','Medical information is stored separately and restricted to authorized doctors.')}</p></div></div><form className={"form-grid "+(cases.some(c=>['submitted','parallel_review','central_review'].includes(c.workflow_status))?'locked-form':'')} onSubmit={saveWorker}><Field label={t('الاسم الكامل','Full name')}><input required value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></Field><Field label={t('الرقم الوظيفي','Employee number')}><input required value={profile.employee_number} onChange={e=>setProfile({...profile,employee_number:e.target.value})}/></Field><Field label={t('تاريخ الميلاد','Date of birth')}><input type="date" required value={profile.date_of_birth} onChange={e=>setProfile({...profile,date_of_birth:e.target.value})}/></Field><Field label={t('الشركة','Company')}><input required value={profile.company_name} onChange={e=>setProfile({...profile,company_name:e.target.value})}/></Field><Field label={t('الوظيفة','Job title')}><input required value={profile.job_title} onChange={e=>setProfile({...profile,job_title:e.target.value})}/></Field><Field label={t('كود الوظيفة','Job code')}><input value={profile.job_code} onChange={e=>setProfile({...profile,job_code:e.target.value})}/></Field><Field label={t('الموقع','Site')}><select value={profile.site_id} onChange={e=>setProfile({...profile,site_id:e.target.value})}>{Object.entries(siteNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field><div className="section-break"><h3>{t('الملف الصحي الخاص','Confidential health profile')}</h3><p>{t('لا يظهر لمسؤول السلامة بالموقع.','Not visible to site safety officers.')}</p></div><Field label={t('الأمراض والحالات الصحية','Conditions')}><textarea value={medical.conditions} onChange={e=>setMedical({...medical,conditions:e.target.value})} placeholder={t('اكتب قائمة أو JSON array','List or JSON array')}/></Field><Field label={t('الأدوية والعلاج','Medications')}><textarea value={medical.medications} onChange={e=>setMedical({...medical,medications:e.target.value})}/></Field><Field label={t('الحساسية','Allergies')}><textarea value={medical.allergies} onChange={e=>setMedical({...medical,allergies:e.target.value})}/></Field><Field label={t('ملاحظات طبية','Medical notes')}><textarea value={medical.medical_notes} onChange={e=>setMedical({...medical,medical_notes:e.target.value})}/></Field><Field label={t('الطول (سم)','Height (cm)')}><input type="number" min="50" max="250" value={medical.height_cm} onChange={e=>setMedical({...medical,height_cm:e.target.value})}/></Field><Field label={t('الوزن (كجم)','Weight (kg)')}><input type="number" min="10" max="500" value={medical.weight_kg} onChange={e=>setMedical({...medical,weight_kg:e.target.value})}/></Field><div className="form-actions"><button disabled={busy||cases.some(c=>['submitted','parallel_review','central_review'].includes(c.workflow_status))}>{t('حفظ البيانات','Save profile')}</button></div></form></section><section className="panel"><div className="panel-title"><div><h2>{t('ملفات التقييم','Assessment cases')}</h2><p>{t('بعد الإرسال يُقفل التعديل حتى إعادة الملف للتصحيح.','Editing is locked after submission until a case is formally returned.')}</p></div><button onClick={createCase} disabled={!worker||busy||cases.some(c=>['submitted','parallel_review','central_review'].includes(c.workflow_status))}>{t('إنشاء ملف جديد','New case')}</button></div><CaseList cases={cases} lang={lang} onSelect={selectCase} selected={selectedCase}/>{selectedCase&&<><CaseTimeline events={caseEvents} lang={lang}/><div className="section-break"><h3>{t('الأخطار المهنية','Occupational hazards')}</h3></div><form className={"form-grid "+(!cases.find(c=>c.id===selectedCase)||!(['worker_draft','returned_for_correction'].includes(cases.find(c=>c.id===selectedCase)!.workflow_status))?'locked-form':'')} onSubmit={addHazard}><Field label={t('الخطر','Hazard')}><input required value={hazardForm.hazard_name} onChange={e=>setHazardForm({...hazardForm,hazard_name:e.target.value})}/></Field><Field label={t('الفئة','Category')}><input value={hazardForm.hazard_category} onChange={e=>setHazardForm({...hazardForm,hazard_category:e.target.value})}/></Field><GradeField label={t('الشدة','Severity')} value={hazardForm.severity_level} onChange={v=>setHazardForm({...hazardForm,severity_level:v})}/><GradeField label={t('مستوى التعرض','Exposure level')} value={hazardForm.exposure_level} onChange={v=>setHazardForm({...hazardForm,exposure_level:v})}/><Field label={t('ملاحظات العامل عن وسائل التحكم (اختياري)','Worker notes on existing controls (optional)')}><textarea value={hazardForm.control_description} onChange={e=>setHazardForm({...hazardForm,control_description:e.target.value})}/></Field><div className="form-actions"><button disabled={busy||!cases.find(c=>c.id===selectedCase)||!(['worker_draft','returned_for_correction'].includes(cases.find(c=>c.id===selectedCase)!.workflow_status))}>{t('إضافة الخطر','Add hazard')}</button></div></form><HazardList hazards={hazards} lang={lang}/><button className="submit-case" onClick={submitCase} disabled={busy||hazards.length===0||!cases.find(c=>c.id===selectedCase)||!(['worker_draft','returned_for_correction'].includes(cases.find(c=>c.id===selectedCase)!.workflow_status))}>{t('إرسال الملف للمراجعة','Submit case for review')}</button></>}</section></>}
        {(role==='site_safety_officer'||role==='site_doctor'||role==='review_doctor'||role==='occupational_health_responsible'||role==='system_owner')&&<><div className="stats"><Stat n={String(cases.length)} label={t('ملفات ظاهرة وفق صلاحيتك','Cases in your scope')}/><Stat n={String(cases.filter(c=>c.workflow_status==='central_review').length)} label={t('مراجعة مركزية','Central review')}/><Stat n={String(cases.filter(c=>c.workflow_status==='finalized').length)} label={t('مكتملة','Finalized')}/></div><section className="panel"><div className="panel-title"><div><h2>{t('قائمة الملفات','Case queue')}</h2><p>{t('البيانات المعروضة تخضع لسياسات RLS في قاعدة البيانات.','Visible records are enforced by database RLS.')}</p></div></div><CaseList cases={cases} lang={lang} onSelect={selectCase} selected={selectedCase}/>{selectedCase&&<><CaseWorkerPanel worker={caseWorker} medical={mayViewMedical?caseMedical:null} lang={lang}/><CaseReviewSnapshot safety={caseSafetyReview} medical={mayViewMedical?caseMedicalReview:null} lang={lang}/><CaseTimeline events={caseEvents} lang={lang}/><HazardList hazards={hazards} lang={lang} editable={role==='site_safety_officer'} grades={safetyGrades} onGradeChange={(id,field,value)=>setSafetyGrades(prev=>({...prev,[id]:{...(prev[id]||{severity_level:2,exposure_level:2}),[field]:value}}))}/>{role!=='system_owner'&&canReviewSelectedCase&&<form className="form-grid review-form" onSubmit={saveReview}><div className="section-break"><h3>{t('تسجيل المراجعة','Record review')}</h3></div><Field label={t('القرار','Decision')}><select value={reviewForm.decision} onChange={e=>setReviewForm({...reviewForm,decision:e.target.value})}><option value="approved">{t('اعتماد','Approve')}</option><option value="returned">{t('إعادة للتصحيح','Return')}</option><option value="needs_clarification">{t('طلب استيضاح','Needs clarification')}</option></select></Field>{(role==='site_doctor'||role==='review_doctor')&&<GradeField label={t('مؤشر الحالة الصحية 1–4','Health status indicator 1–4')} value={reviewForm.health_status_indicator} required={reviewForm.decision==='approved'} onChange={v=>setReviewForm({...reviewForm,health_status_indicator:v})}/ >}{role==='site_safety_officer'&&<><GradeField label={t('تقييم وسائل التحكم 1–4','Control measures grade 1–4')} value={reviewForm.control_measure_grade} required={reviewForm.decision==='approved'} onChange={v=>setReviewForm({...reviewForm,control_measure_grade:v})}/><p className="field-hint">{t('1: موجودة ومستخدمة أو لا تلزم. 2: موجودة ومستخدمة لكنها غير كافية. 3: موجودة ولكن لا تُستخدم. 4: غير متاحة بالموقع.','1: Available and used, or not required. 2: Available and used but insufficient. 3: Available but not used. 4: Not available at the site.')}</p></>}<Field label={t('الملاحظات','Comments')}><textarea value={reviewForm.comments} onChange={e=>setReviewForm({...reviewForm,comments:e.target.value})}/></Field>{role==='site_safety_officer'&&<Field label={t('تفاصيل التحكم','Control notes')}><textarea value={reviewForm.control_measure_notes} onChange={e=>setReviewForm({...reviewForm,control_measure_notes:e.target.value})}/></Field>}<div className="form-actions"><button disabled={busy}>{t('حفظ المراجعة','Save review')}</button></div></form>}</>}</section></>}
        {role==='system_owner'&&<section className="panel"><div className="panel-title"><div><h2>{t('إدارة الحسابات والصلاحيات','Accounts and permissions')}</h2><p>{t('إرسال دعوة لا يمنح صلاحية تلقائياً؛ يجب إسناد الدور بعد إنشاء الحساب.','An invitation does not grant access; assign a role after the account is created.')}</p></div><button className="outline" onClick={()=>void loadAdminData()}>{t('تحديث القائمة','Refresh list')}</button></div><form className="form-grid" onSubmit={inviteAccount}><Field label={t('دعوة مستخدم بالبريد','Invite user by email')}><input type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="name@example.com"/></Field><div className="form-actions"><button disabled={busy}>{t('إرسال الدعوة','Send invitation')}</button></div></form><form className="form-grid review-form" onSubmit={assignRole}><Field label={t('الحساب','Account')}><select required value={targetUserId} onChange={e=>setTargetUserId(e.target.value)}><option value="">{t('اختر حساباً','Select account')}</option>{adminUsers.map(u=><option key={u.id} value={u.id}>{u.email||u.id}</option>)}</select></Field><Field label={t('الدور','Role')}><select value={newRole} onChange={e=>setNewRole(e.target.value as RoleCode)}>{Object.entries(roleNames).map(([k,v])=><option key={k} value={k}>{v[lang]}</option>)}</select></Field>{(newRole==='site_doctor'||newRole==='site_safety_officer')&&<Field label={t('الموقع','Site')}><select value={newSite} onChange={e=>setNewSite(e.target.value)}>{Object.entries(siteNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>}<div className="form-actions"><button disabled={busy||!targetUserId}>{t('إسناد الصلاحية','Assign role')}</button></div></form><div className="admin-table"><h3>{t('الحسابات المسجلة','Registered accounts')}</h3>{adminUsers.map(u=><div className="admin-row" key={u.id}><span><b>{u.email||u.id}</b><small>{u.confirmed?t('مؤكد','Confirmed'):t('بانتظار التأكيد','Pending confirmation')}</small></span><span>{adminAssignments.filter(a=>a.user_id===u.id&&a.is_active).map(a=>roleNames[a.role_code][lang]+(a.site_id?' · '+siteNames[a.site_id]:'')).join('، ')||t('بلا صلاحية','No role')}</span></div>)}</div><div className="admin-table"><h3>{t('التعيينات النشطة','Active assignments')}</h3>{adminAssignments.filter(a=>a.is_active).map(a=><div className="admin-row" key={a.id}><span><b>{adminUsers.find(u=>u.id===a.user_id)?.email||a.user_id}</b><small>{roleNames[a.role_code][lang]}{a.site_id?' · '+siteNames[a.site_id]:''}</small></span><button className="danger-button" disabled={busy||(a.role_code==='system_owner'&&adminAssignments.filter(x=>x.role_code==='system_owner'&&x.is_active).length<=1)} onClick={()=>void deactivateAssignment(a.id)}>{t('إيقاف','Deactivate')}</button></div>)}</div></section>}
        {busy&&<div className="loading">{t('جارٍ تحميل البيانات…','Loading…')}</div>}
        <footer>{t('تنبيه: هذه نسخة تطويرية. القرار الطبي النهائي للطبيب المختص، ولا يصدر النظام حكماً آلياً باللياقة.','Notice: Development version. Final medical decisions belong to the authorized physician; the system does not make automated fitness determinations.')}</footer>
      </main></div>
  </div>
}
function CaseWorkerPanel({worker,medical,lang}:{worker:CaseWorker|null;medical:MedicalProfile|null;lang:'ar'|'en'}){const t=(a:string,e:string)=>lang==='ar'?a:e;if(!worker)return <div className="panel-sub">{t('تعذر تحميل بيانات العامل أو لا تسمح الصلاحيات بعرضها.','Worker details unavailable or access is restricted.')}</div>;return <div className="worker-detail"><h3>{t('بيانات العامل','Worker details')}</h3><div className="detail-grid"><span>{t('الاسم','Name')}: <b>{worker.full_name}</b></span><span>{t('الرقم الوظيفي','Employee no.')}: <b>{worker.employee_number}</b></span><span>{t('الوظيفة','Job')}: <b>{worker.job_title}</b></span><span>{t('الشركة','Company')}: <b>{worker.company_name}</b></span><span>{t('الموقع','Site')}: <b>{siteNames[worker.site_id]||worker.site_id}</b></span></div>{medical&&<><h3>{t('الملف الطبي المقيد','Restricted medical profile')}</h3><div className="detail-grid"><span>{t('الأمراض','Conditions')}: <b>{(medical.conditions||[]).join('، ')||'—'}</b></span><span>{t('الأدوية','Medications')}: <b>{(medical.medications||[]).join('، ')||'—'}</b></span><span>{t('الحساسية','Allergies')}: <b>{(medical.allergies||[]).join('، ')||'—'}</b></span><span>{t('الطول','Height')}: <b>{medical.height_cm??'—'} cm</b></span><span>{t('الوزن','Weight')}: <b>{medical.weight_kg??'—'} kg</b></span><span>{t('ملاحظات طبية','Medical notes')}: <b>{medical.medical_notes||'—'}</b></span></div></>}</div>}
function CaseReviewSnapshot({safety,medical,lang}:{safety:SafetyReview|null;medical:MedicalReview|null;lang:'ar'|'en'}){const t=(a:string,e:string)=>lang==='ar'?a:e;return <div className="review-snapshot"><h3>{t('ملخص المراجعات المسجلة','Recorded review summary')}</h3><div className="detail-grid"><span>{t('قرار السلامة','Safety decision')}: <b>{safety?.decision||'—'}</b></span><span>{t('درجة وسائل التحكم','Control grade')}: <b>{safety?.control_measure_grade??'—'}</b></span><span>{t('ملاحظات مسؤول السلامة','Safety notes')}: <b>{safety?.control_measure_notes||safety?.comments||'—'}</b></span>{medical&&<><span>{t('قرار طبيب الموقع','Site doctor decision')}: <b>{medical.decision}</b></span><span>{t('مؤشر الحالة الصحية','Health indicator')}: <b>{medical.health_status_indicator??'—'}</b></span><span>{t('ملاحظات الطبيب','Doctor notes')}: <b>{medical.comments||'—'}</b></span></>}</div></div>}
function CaseTimeline({events,lang}:{events:CaseEvent[];lang:'ar'|'en'}){const labels:Record<string,string>={worker_submitted:'إرسال الملف',case_submitted:'إرسال الملف',parallel_review_updated:'تحديث المراجعة المتوازية',parallel_reviews_completed:'اكتمال مراجعات الموقع',review_returned:'إعادة للتصحيح',central_review_returned:'إعادة مركزية للتصحيح',case_finalized:'اعتماد نهائي',safety_reviewed:'مراجعة السلامة',medical_reviewed:'المراجعة الطبية',central_reviewed:'المراجعة المركزية',case_returned:'إعادة للتصحيح'};return <div className="timeline"><h3>{lang==='ar'?'سجل الإجراءات':'Case timeline'}</h3>{events.length===0?<p className="muted">{lang==='ar'?'لا توجد أحداث مسجلة.':'No events recorded.'}</p>:events.map(ev=><div className="timeline-row" key={ev.id}><b>{lang==='ar'?(labels[ev.event_type]||ev.event_type):ev.event_type}</b><span>{ev.from_status||'—'} → {ev.to_status||'—'}</span><small>{new Date(ev.created_at).toLocaleString(lang==='ar'?'ar-EG':'en-GB')}{ev.reason?' · '+ev.reason:''}</small></div>)}</div>}
function Brand(){return <div className="brand"><div className="brand-mark">M</div><div><strong>MHR Scale</strong><small>Medico-Occupational Fitness</small></div></div>}
function Field({label,children}:{label:string;children:any}){return <label className="field"><span>{label}</span>{children}</label>}
function GradeField({label,value,onChange,required=true}:{label:string;value:string;onChange:(v:string)=>void;required?:boolean}){return <Field label={label}><select required={required} value={value} onChange={e=>onChange(e.target.value)}>{value===''&&<option value="">اختر الدرجة / Select grade</option>}{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></Field>}
function Stat({n,label}:{n:string;label:string}){return <div className="stat"><strong>{n}</strong><span>{label}</span></div>}
function CaseList({cases,lang,onSelect,selected}:{cases:CaseRow[];lang:'ar'|'en';onSelect:(id:string)=>void;selected:string}){return <div className="case-list">{cases.length===0?<p className="muted">{lang==='ar'?'لا توجد ملفات في الوقت الحالي.':'No cases available.'}</p>:cases.map(c=><button key={c.id} className={'case-row '+(selected===c.id?'chosen':'')} onClick={()=>onSelect(c.id)}><span><b>#{c.case_number}</b><small>{siteNames[c.site_id]||c.site_id} · {new Date(c.created_at).toLocaleDateString(lang==='ar'?'ar-EG':'en-GB')}</small></span><span className="status">{lang==='ar'?(statusAr[c.workflow_status]||c.workflow_status):c.workflow_status}</span></button>)}</div>}
function HazardList({hazards,lang,editable=false,grades={},onGradeChange}:{hazards:HazardRow[];lang:'ar'|'en';editable?:boolean;grades?:Record<string,HazardGrade>;onGradeChange?:(id:string,field:'severity_level'|'exposure_level',value:number)=>void}){return <div className="hazards">{hazards.length===0?<p className="muted">{lang==='ar'?'لا توجد أخطار مسجلة لهذا الملف.':'No hazards recorded for this case.'}</p>:hazards.map(h=>{const g=grades[h.id]||h;return <div className="hazard-row" key={h.id}><b>{h.hazard_name}</b>{editable?<><label>{lang==='ar'?'الشدة المعتمدة':'Reviewed severity'} <select value={g.severity_level} onChange={e=>onGradeChange?.(h.id,'severity_level',Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>{lang==='ar'?'التعرض المعتمد':'Reviewed exposure'} <select value={g.exposure_level} onChange={e=>onGradeChange?.(h.id,'exposure_level',Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label></>:<><span>H: {h.severity_level}</span><span>E: {h.exposure_level}</span></>}{h.control_description&&<small className="hazard-note">{h.control_description}</small>}</div>})}{editable&&<p className="field-hint">{lang==='ar'?'راجع واعتمد الشدة والتعرض لكل خطر. سيُحفظ هذا التقييم في سجل مراجعة مستقل دون تغيير إدخال العامل الأصلي.':'Review and confirm severity and exposure for each hazard. Your assessment is stored separately without overwriting the worker submission.'}</p>}<p className="scientific-note">{lang==='ar'?'H×E أداة ترتيب داخلية أولية فقط وليست تصنيفاً معتمداً أو قياساً للتعرض. تبقى وسائل التحكم والمؤشر الطبي أبعاداً مستقلة.':'H×E is only an internal preliminary prioritization aid, not a validated classification or exposure measurement. Controls and medical indicators remain separate dimensions.'}</p></div>}

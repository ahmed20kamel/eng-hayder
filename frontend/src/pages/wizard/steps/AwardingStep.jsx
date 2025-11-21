import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import Field from "../../../components/fields/Field";
import Dialog from "../../../components/Dialog";
import StepActions from "../components/StepActions";
import WizardShell from "../components/WizardShell";
import Button from "../../../components/Button";
import FileAttachmentView from "../../../components/FileAttachmentView";
import { extractFileNameFromUrl } from "../../../utils/fileHelpers";

export default function AwardingStep({ projectId, onPrev, onNext, isView }) {
  const { t, i18n } = useTranslation();
  const isAR = i18n.language === "ar";
  const navigate = useNavigate();
  const [license, setLicense] = useState(null);
  const [siteplan, setSiteplan] = useState(null);
  const [existingId, setExistingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  // ✅ توحيد السلوك: إذا كان isView محدد من الخارج (من WizardPage)، نستخدمه مباشرة
  // الوضع الافتراضي هو التعديل (false) وليس الفيو
  const [localIsView, setLocalIsView] = useState(() => {
    // إذا كان isView محدد صراحة (true أو false)، نستخدمه
    if (isView !== undefined) return isView === true;
    // الوضع الافتراضي هو التعديل
    return false;
  });

  const [awardDate, setAwardDate] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("VR-");
  const [projectNumber, setProjectNumber] = useState("");

  const [contractorRegNo, setContractorRegNo] = useState("VR-");
  const [awardingFile, setAwardingFile] = useState(null); // ← ارفاق امر الترسية
  const [awardingFileName, setAwardingFileName] = useState(""); // ← اسم الملف المحفوظ
  const [awardingFileUrl, setAwardingFileUrl] = useState(""); // ← URL الملف المحفوظ
  
  // ✅ تتبع ما إذا كان تم البحث عن أرقام التسجيل
  const [hasSearchedConsultant, setHasSearchedConsultant] = useState(false);
  const [hasSearchedContractor, setHasSearchedContractor] = useState(false);

  const handleContractorRegChange = (e) => {
    let v = e.target.value;
    v = v.replace(/^VR-/i, "").replace(/[^0-9]/g, "");
    setContractorRegNo("VR-" + v);
  };

  // ✅ البحث عن رقم تسجيل الاستشاري من مشاريع أخرى
  const searchConsultantRegistrationNumber = async (consultantName) => {
    if (!consultantName) return;
    try {
      const { data: projects } = await api.get("projects/");
      const items = Array.isArray(projects) ? projects : (projects?.results || projects?.items || []);
      
      // البحث في جميع المشاريع
      for (const project of items) {
        if (project.id === projectId) continue; // تخطي المشروع الحالي
        
        try {
          const { data: licenseRes } = await api.get(`projects/${project.id}/license/`);
          const licenseData = Array.isArray(licenseRes) ? licenseRes[0] : licenseRes;
          
          if (licenseData) {
            const isMatch = 
              (licenseData.design_consultant_name && 
               licenseData.design_consultant_name.toLowerCase().trim() === consultantName.toLowerCase().trim()) ||
              (licenseData.supervision_consultant_name && 
               licenseData.supervision_consultant_name.toLowerCase().trim() === consultantName.toLowerCase().trim());
            
            if (isMatch) {
              // البحث عن رقم التسجيل في awarding
              try {
                const { data: awardingRes } = await api.get(`projects/${project.id}/awarding/`);
                const awardingData = Array.isArray(awardingRes) ? awardingRes[0] : awardingRes;
                
                if (awardingData?.consultant_registration_number) {
                  setRegistrationNumber(awardingData.consultant_registration_number);
                  return; // وجدنا الرقم، نتوقف
                }
              } catch (e) {}
            }
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error("Error searching for consultant registration number:", e);
    }
  };
  
  // ✅ البحث عن رقم تسجيل المقاول من مشاريع أخرى
  const searchContractorRegistrationNumber = async (contractorName) => {
    if (!contractorName) return;
    try {
      const { data: projects } = await api.get("projects/");
      const items = Array.isArray(projects) ? projects : (projects?.results || projects?.items || []);
      
      // البحث في جميع المشاريع
      for (const project of items) {
        if (project.id === projectId) continue; // تخطي المشروع الحالي
        
        try {
          const { data: licenseRes } = await api.get(`projects/${project.id}/license/`);
          const licenseData = Array.isArray(licenseRes) ? licenseRes[0] : licenseRes;
          
          if (licenseData?.contractor_name && 
              licenseData.contractor_name.toLowerCase().trim() === contractorName.toLowerCase().trim()) {
            // البحث عن رقم التسجيل في awarding
            try {
              const { data: awardingRes } = await api.get(`projects/${project.id}/awarding/`);
              const awardingData = Array.isArray(awardingRes) ? awardingRes[0] : awardingRes;
              
              if (awardingData?.contractor_registration_number) {
                setContractorRegNo(awardingData.contractor_registration_number);
                return; // وجدنا الرقم، نتوقف
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error("Error searching for contractor registration number:", e);
    }
  };

  /* تحميل الرخصة والبحث عن أرقام التسجيل */
  useEffect(() => {
    if (!projectId || !license) return;
    
    // ✅ البحث عن رقم تسجيل الاستشاري من مشاريع أخرى
    // (فقط إذا لم يكن موجود بالفعل ولم نبحث من قبل)
    if (!hasSearchedConsultant && (license.design_consultant_name || license.supervision_consultant_name)) {
      const consultantName = license.consultant_same 
        ? license.design_consultant_name 
        : license.supervision_consultant_name;
      
      if (consultantName && (registrationNumber === "VR-" || !registrationNumber)) {
        setHasSearchedConsultant(true);
        searchConsultantRegistrationNumber(consultantName);
      }
    }
    
    // ✅ البحث عن رقم تسجيل المقاول من مشاريع أخرى
    // (فقط إذا لم يكن موجود بالفعل ولم نبحث من قبل)
    if (!hasSearchedContractor && license.contractor_name && (contractorRegNo === "VR-" || !contractorRegNo)) {
      setHasSearchedContractor(true);
      searchContractorRegistrationNumber(license.contractor_name);
    }
  }, [license, registrationNumber, contractorRegNo, hasSearchedConsultant, hasSearchedContractor, projectId]);
  
  /* تحميل الرخصة */
  useEffect(() => {
    if (!projectId) return;
    api.get(`projects/${projectId}/license/`).then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setLicense(res.data[0]);
      }
    }).catch(() => {});
  }, [projectId]);

  /* تحميل بيانات مخطط الأرض */
  useEffect(() => {
    api.get(`projects/${projectId}/siteplan/`).then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSiteplan(res.data[0]);
      }
    });
  }, [projectId]);

  /* تحميل بيانات أمر الترسية إن وجدت */
  useEffect(() => {
    if (!projectId) return;
    api.get(`projects/${projectId}/awarding/`).then((res) => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        const data = res.data[0];
        setExistingId(data.id);
        setAwardDate(data.award_date || "");
        // ✅ إذا كان هناك رقم تسجيل محفوظ، نستخدمه
        if (data.consultant_registration_number) {
          setRegistrationNumber(data.consultant_registration_number);
          setHasSearchedConsultant(true); // لا نبحث مرة أخرى
        } else {
          setRegistrationNumber("VR-");
        }
        setProjectNumber(data.project_number || "");
        // ✅ إذا كان هناك رقم تسجيل محفوظ، نستخدمه
        if (data.contractor_registration_number) {
          setContractorRegNo(data.contractor_registration_number);
          setHasSearchedContractor(true); // لا نبحث مرة أخرى
        } else {
          setContractorRegNo("VR-");
        }
        if (data.awarding_file) {
          setAwardingFileUrl(data.awarding_file);
          setAwardingFileName(extractFileNameFromUrl(data.awarding_file));
        }
      } else {
        // ✅ إذا لم يكن هناك awarding، نضع القيم الافتراضية
        setRegistrationNumber("VR-");
        setContractorRegNo("VR-");
      }
    }).catch(() => {
      // ✅ في حالة الخطأ، نضع القيم الافتراضية
      setRegistrationNumber("VR-");
      setContractorRegNo("VR-");
    });
  }, [projectId]);

  // ✅ مزامنة مع isView من الخارج
  useEffect(() => {
    if (isView !== undefined) {
      setLocalIsView(isView === true);
    }
  }, [isView]);

  if (!license || !siteplan)
    return <div className="card mt-12">{t("loading_data")}</div>;

  /* استخراج اسم المالك */
  const owners = siteplan.owners || [];
  let ownerFullName = "";

  if (owners.length > 0) {
    ownerFullName = owners[0].owner_name_ar || owners[0].owner_name_en || "";
    if (owners.length > 1) ownerFullName += ` ${t("and_partners")}`;
  }

  /* تحديد الاستشاري */
  const consultantToShow = license.consultant_same
    ? license.design_consultant_name
    : license.supervision_consultant_name;

  const save = async () => {
    if (!projectId) {
      setErrorMsg(t("open_specific_project_to_save"));
      return;
    }

    try {
      const payload = new FormData();
      if (awardDate) payload.append("award_date", awardDate);
      payload.append("consultant_registration_number", registrationNumber);
      payload.append("project_number", projectNumber);
      payload.append("contractor_registration_number", contractorRegNo);
      if (awardingFile) payload.append("awarding_file", awardingFile);

      if (existingId) {
        await api.patch(`projects/${projectId}/awarding/${existingId}/`, payload);
      } else {
        const { data: created } = await api.post(`projects/${projectId}/awarding/`, payload);
        if (created?.id) setExistingId(created.id);
      }
      setErrorMsg("");
      // ✅ أمر الترسية هو الخطوة الأخيرة - دائماً ننتقل إلى قائمة المشاريع بعد الحفظ
      setLocalIsView(true);
      navigate("/projects");
    } catch (err) {
      const serverData = err?.response?.data;
      const fallback = err?.message || (serverData ? JSON.stringify(serverData, null, 2) : t("save_failed"));
      setErrorMsg(fallback);
    }
  };

  return (
    <WizardShell title={t("awarding_gulf_bank_contract_info")}>
      <Dialog
        open={!!errorMsg}
        title={t("error")}
        desc={<pre className="pre-wrap m-0">{errorMsg}</pre>}
        confirmLabel={t("ok")}
        onClose={() => setErrorMsg("")}
        onConfirm={() => setErrorMsg("")}
      />

      {localIsView && (
        <div className={`row ${isAR ? "justify-start" : "justify-end"} mb-12`}>
          <Button variant="secondary" onClick={() => setLocalIsView(false)}>
            {t("edit")}
          </Button>
        </div>
      )}

      {/* ===================================== */}
      {/* 🔵 البلوك الأول — التاريخ + الاستشاري */}
      {/* ===================================== */}
      <div className="form-grid cols-3 mt-16">
        {/* تاريخ أمر الترسية */}
        <Field label={t("awarding_date")}>
          {localIsView ? (
            <div className="card">
              <div className="p-8">{awardDate || t("empty_value")}</div>
            </div>
          ) : (
            <input
              type="date"
              className="input"
              value={awardDate}
              onChange={(e) => setAwardDate(e.target.value)}
            />
          )}
        </Field>

        {/* الاستشاري */}
        <Field label={t("consultant_from_license")}>
          <div className="card">
            <div className="p-8">{consultantToShow || t("empty_value")}</div>
          </div>
        </Field>

        {/* رقم تسجيل الاستشاري */}
        <Field label={t("consultant_registration_number")}>
          {localIsView ? (
            <div className="card">
              <div className="p-8">{registrationNumber || t("empty_value")}</div>
            </div>
          ) : (
            <input
              className="input"
              value={registrationNumber}
              onChange={(e) => {
                let v = e.target.value.replace(/^VR-/i, "").replace(/[^0-9]/g, "");
                setRegistrationNumber("VR-" + v);
              }}
            />
          )}
        </Field>
      </div>

      {/* ===================================== */}
      {/* 🔵 البلوك الثاني — رقم المشروع + المالك */}
      {/* ===================================== */}
      <div className="form-grid cols-2 mt-12">
        {/* رقم المشروع */}
        <Field label={t("project_number")}>
          {localIsView ? (
            <div className="card">
              <div className="p-8">{projectNumber || t("empty_value")}</div>
            </div>
          ) : (
            <input
              className="input"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
            />
          )}
        </Field>

        {/* اسم المالك */}
        <Field label={t("owner_from_siteplan")}>
          <div className="card">
            <div className="p-8">{ownerFullName || t("empty_value")}</div>
          </div>
        </Field>
      </div>

      {/* ===================================== */}
      {/* 🔵 البلوك الثالث — المقاول + تسجيله */}
      {/* ===================================== */}
      <div className="form-grid cols-2 mt-12">
        {/* المقاول */}
        <Field label={t("contractor_from_license")}>
          <div className="card">
            <div className="p-8">{license.contractor_name || t("empty_value")}</div>
          </div>
        </Field>

        {/* رقم تسجيل المقاول */}
        <Field label={t("contractor_registration_number")}>
          {localIsView ? (
            <div className="card">
              <div className="p-8">{contractorRegNo || t("empty_value")}</div>
            </div>
          ) : (
            <input
              className="input"
              value={contractorRegNo}
              onChange={handleContractorRegChange}
            />
          )}
        </Field>
      </div>

      {/* ===================================== */}
      {/* 🔵 البلوك الرابع — إرفاق أمر الترسية */}
      {/* ===================================== */}
      <div className="form-grid cols-1 mt-12">
        <Field label={t("attach_awarding_order")}>
          {localIsView ? (
            <FileAttachmentView
              fileUrl={awardingFileUrl}
              fileName={awardingFileName || awardingFile?.name}
              projectId={projectId}
              endpoint={`projects/${projectId}/awarding/`}
            />
          ) : (
            <input
              type="file"
              className="input"
              onChange={(e) => {
                setAwardingFile(e.target.files?.[0] || null);
                if (e.target.files?.[0]) {
                  setAwardingFileName(e.target.files[0].name);
                }
              }}
            />
          )}
        </Field>
      </div>

      {!localIsView && (
        <StepActions
          onPrev={onPrev}
          onNext={save}
          nextLabel={t("finish")}
          nextClassName="primary"
        />
      )}
    </WizardShell>
  );
}

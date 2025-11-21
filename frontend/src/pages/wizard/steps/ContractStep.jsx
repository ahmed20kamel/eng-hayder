import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../../../services/api";
import Dialog from "../../../components/Dialog";
import WizardShell from "../components/WizardShell";
import StepActions from "../components/StepActions";
import Field from "../../../components/fields/Field";
import ViewRow from "../../../components/fields/ViewRow";
import ConsultantFeesSection from "../components/ConsultantFeesSection";
import YesNoChips from "../../../components/YesNoChips";
import RtlSelect from "../../../components/fields/RtlSelect";
import InfoTip from "../components/InfoTip";
import NumberField from "../../../components/fields/NumberField";
import Button from "../../../components/Button";
import FileAttachmentView from "../../../components/FileAttachmentView";
import FileUpload from "../../../components/FileUpload";
import useContract from "../../../hooks/useContract";
import { formatMoney, formatMoneyArabic, toIsoDate, getDayName } from "../../../utils/formatters";
import { numberToArabicWords } from "../../../utils/numberFormatting";
import { num, toBool, formatServerErrors, flattenEntries, labelForKey, PRIMARY_ORDER } from "../../../utils/helpers";
import { getErrorMessage } from "../../../utils/errorHandler";
import { extractFileNameFromUrl } from "../../../utils/fileHelpers";

export default function ContractStep({ projectId, onPrev, onNext, isView: isViewProp }) {
  const { t, i18n: i18next } = useTranslation();
  const isAR = i18next.language === "ar";
  const navigate = useNavigate();
  const { form, setF, existingId, setExistingId, isView: isViewState, setIsView } = useContract(projectId);
  // ✅ توحيد السلوك: إذا كان isViewProp محدد من الخارج (من WizardPage)، نستخدمه مباشرة
  // الوضع الافتراضي هو التعديل (false) وليس الفيو
  const [viewMode, setViewMode] = useState(() => {
    // إذا كان isViewProp محدد صراحة (true أو false)، نستخدمه
    if (isViewProp !== undefined) return isViewProp === true;
    // إذا لم يكن محدد، نستخدم isViewState من الـ hook
    return isViewState === true;
  });
  const hasNextStep = typeof onNext === "function";
  
  // ✅ مزامنة مع isViewProp من الخارج
  useEffect(() => {
    if (isViewProp !== undefined) {
      setViewMode(isViewProp === true);
    } else {
      // إذا لم يكن محدد من الخارج، نستخدم isViewState من الـ hook
      setViewMode(isViewState === true);
    }
  }, [isViewProp, isViewState]);

  const updateViewMode = (next) => {
    setViewMode(next);
    // ✅ تحديث isViewState في الـ hook فقط إذا لم يكن isViewProp محدد من الخارج
    if (isViewProp === undefined) {
      setIsView(next);
    }
  };
  const [errorMsg, setErrorMsg] = useState("");
  const [startOrderFileUrl, setStartOrderFileUrl] = useState("");
  const [startOrderFileName, setStartOrderFileName] = useState(""); // اسم الملف المحفوظ محلياً
  const [contractFileUrl, setContractFileUrl] = useState("");
  const [contractFileName, setContractFileName] = useState("");
  const [contractAppendixFileUrl, setContractAppendixFileUrl] = useState("");
  const [contractAppendixFileName, setContractAppendixFileName] = useState("");
  const [contractExplanationFileUrl, setContractExplanationFileUrl] = useState("");
  const [contractExplanationFileName, setContractExplanationFileName] = useState("");

  // قوائم ثابتة
  const CONTRACT_CLASSIFICATION = useMemo(
    () => [
      {
        value: "housing_loan_program",
        label: t("contract.classification.housing_loan_program.label"),
        desc: t("contract.classification.housing_loan_program.desc"),
      },
      {
        value: "private_funding",
        label: t("contract.classification.private_funding.label"),
        desc: t("contract.classification.private_funding.desc"),
      },
    ],
    [t]
  );

  const CONTRACT_TYPES = useMemo(
    () => [
      { value: "lump_sum", label: t("contract.types.lump_sum") },
      { value: "percentage", label: t("contract.types.percentage") },
      { value: "design_build", label: t("contract.types.design_build") },
      { value: "re_measurement", label: t("contract.types.re_measurement") },
    ],
    [t]
  );

  // حساب تاريخ نهاية المشروع
  useEffect(() => {
    if (!form.start_order_date || !form.project_duration_months) return;
    try {
      const d = new Date(form.start_order_date);
      const months = Number(form.project_duration_months);
      if (isNaN(months) || months <= 0) return;
      d.setMonth(d.getMonth() + months);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const end = `${yyyy}-${mm}-${dd}`;
      if (end !== form.project_end_date) {
        setF("project_end_date", end);
      }
    } catch {}
  }, [form.start_order_date, form.project_duration_months, setF]);

  // حساب تمويل المالك تلقائيًا
  useEffect(() => {
    const total = num(form.total_project_value, 0);
    const bank = num(form.total_bank_value, 0);
    const owner = Math.max(0, total - bank);
    const currentOwner = num(form.total_owner_value, 0);
    // تحديث فقط إذا كان هناك فرق كبير (أكثر من 0.01 لتجنب مشاكل الفاصلة العشرية)
    if (Math.abs(owner - currentOwner) > 0.01) {
      setF("total_owner_value", String(owner));
    }
  }, [form.total_project_value, form.total_bank_value, setF]);

  // تحميل URLs الملفات
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (Array.isArray(data) && data.length > 0) {
          const contractData = data[0];
          if (contractData.start_order_file) {
            setStartOrderFileUrl(contractData.start_order_file);
            setStartOrderFileName(extractFileNameFromUrl(contractData.start_order_file));
          }
          if (contractData.contract_file) {
            setContractFileUrl(contractData.contract_file);
            setContractFileName(extractFileNameFromUrl(contractData.contract_file));
          }
          if (contractData.contract_appendix_file) {
            setContractAppendixFileUrl(contractData.contract_appendix_file);
            setContractAppendixFileName(extractFileNameFromUrl(contractData.contract_appendix_file));
          }
          if (contractData.contract_explanation_file) {
            setContractExplanationFileUrl(contractData.contract_explanation_file);
            setContractExplanationFileName(extractFileNameFromUrl(contractData.contract_explanation_file));
          }
        }
      } catch (e) {}
    })();
  }, [projectId]);

  // بناء الحمولة والحفظ
  const buildPayload = () => {
    if (!form.contract_classification) throw new Error(t("contract.errors.select_classification"));
    if (!form.contract_type) throw new Error(t("contract.errors.select_type"));
    if (!form.contract_date) throw new Error(t("contract.errors.select_date"));

    const total = num(form.total_project_value, NaN);
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error(t("contract.errors.total_project_value_positive"));
    }

    const isHousing = form.contract_classification === "housing_loan_program";
    const bank = num(form.total_bank_value, isHousing ? NaN : 0);
    const owner = Math.max(0, total - bank);

    if (isHousing) {
      if (!Number.isFinite(bank) || bank < 0) {
        throw new Error(t("contract.errors.bank_value_nonnegative"));
      }
      // التحقق من أن قيمة المالك محسوبة بشكل صحيح (مع هامش خطأ صغير)
      const currentOwner = num(form.total_owner_value, NaN);
      if (Math.abs(currentOwner - owner) > 0.01) {
        throw new Error(t("contract.errors.owner_value_autocalc"));
      }
    }

    // التحقق من أمر المباشرة إذا كان موجود
    if (form.has_start_order === "yes") {
      if (!form.start_order_file && !startOrderFileUrl) {
        throw new Error(t("start_order_required"));
      }
      if (!form.start_order_date) {
        throw new Error(t("contract.errors.select_date") || "Start order date is required");
      }
    }

    const jsonPayload = {
      contract_classification: form.contract_classification,
      contract_type: form.contract_type,
      tender_no: form.tender_no || "",
      contract_date: toIsoDate(form.contract_date),
      owners: form.owners || [],
      contractor_name: form.contractor_name || "",
      contractor_trade_license: form.contractor_trade_license || "",
      total_project_value: total,
      total_bank_value: isHousing ? bank : 0,
      total_owner_value: isHousing ? owner : total,
      project_duration_months: num(form.project_duration_months, 0),
      owner_includes_consultant: toBool(form.owner_includes_consultant),
      owner_fee_design_percent: num(form.owner_fee_design_percent, 0),
      owner_fee_supervision_percent: num(form.owner_fee_supervision_percent, 0),
      owner_fee_extra_mode: form.owner_fee_extra_mode || "percent",
      owner_fee_extra_value: num(form.owner_fee_extra_value, 0),
      bank_includes_consultant: toBool(form.bank_includes_consultant),
      bank_fee_design_percent: num(form.bank_fee_design_percent, 0),
      bank_fee_supervision_percent: num(form.bank_fee_supervision_percent, 0),
      bank_fee_extra_mode: form.bank_fee_extra_mode || "percent",
      bank_fee_extra_value: num(form.bank_fee_extra_value, 0),
      start_order_exists: toBool(form.has_start_order),
      start_order_date: form.start_order_date || null,
      project_end_date: form.project_end_date || null,
    };

    // إذا كان هناك ملف جديد، نستخدم FormData
    const hasFiles = 
      (form.start_order_file && form.start_order_file instanceof File) ||
      (form.contract_file && form.contract_file instanceof File) ||
      (form.contract_appendix_file && form.contract_appendix_file instanceof File) ||
      (form.contract_explanation_file && form.contract_explanation_file instanceof File);
    
    // ✅ دائماً نستخدم FormData (حتى لو لم يكن هناك ملفات) لضمان إرسال owners بشكل صحيح
    const fd = new FormData();
    
    // إضافة الحقول النصية
    Object.entries(jsonPayload).forEach(([k, v]) => {
      // تخطي الملفات - سنضيفها لاحقاً
      if (k === "start_order_file" || k === "contract_file" || 
          k === "contract_appendix_file" || k === "contract_explanation_file") {
        return;
      }
      // ✅ معالجة owners بشكل خاص - إرسالها كـ JSON string
      if (k === "owners") {
        if (Array.isArray(v) && v.length > 0) {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, "[]"); // قائمة فارغة
        }
        return;
      }
      if (v === null || v === undefined || v === "") return;
      if (typeof v === "object" && !(v instanceof File) && !(v instanceof Blob) && !Array.isArray(v)) {
        fd.append(k, JSON.stringify(v));
      } else if (Array.isArray(v)) {
        fd.append(k, JSON.stringify(v));
      } else {
        fd.append(k, v);
      }
    });
    
    // إضافة الملفات بشكل منفصل
    if (form.start_order_file && form.start_order_file instanceof File) {
      fd.append("start_order_file", form.start_order_file);
    }
    if (form.contract_file && form.contract_file instanceof File) {
      fd.append("contract_file", form.contract_file);
    }
    if (form.contract_appendix_file && form.contract_appendix_file instanceof File) {
      fd.append("contract_appendix_file", form.contract_appendix_file);
    }
    if (form.contract_explanation_file && form.contract_explanation_file instanceof File) {
      fd.append("contract_explanation_file", form.contract_explanation_file);
    }
    
    return fd;
  };

  const save = async () => {
    if (!projectId) {
      setErrorMsg(t("open_specific_project_to_save"));
      return;
    }
    try {
      const payload = buildPayload();
      const isHousing = form.contract_classification === "housing_loan_program";
      const hasFiles = 
        (form.start_order_file && form.start_order_file instanceof File) ||
        (form.contract_file && form.contract_file instanceof File) ||
        (form.contract_appendix_file && form.contract_appendix_file instanceof File) ||
        (form.contract_explanation_file && form.contract_explanation_file instanceof File);
      
      if (existingId) {
        await api.patch(`projects/${projectId}/contract/${existingId}/`, payload);
      } else {
        const { data: created } = await api.post(`projects/${projectId}/contract/`, payload);
        if (created?.id) setExistingId(created.id);
      }
      setErrorMsg("");
      
      // بعد الحفظ الناجح، نحدث URLs للملفات دائماً
      try {
        const { data } = await api.get(`projects/${projectId}/contract/`);
        if (Array.isArray(data) && data.length > 0) {
          const contractData = data[0];
          if (contractData.start_order_file) {
            setStartOrderFileUrl(contractData.start_order_file);
            setStartOrderFileName(extractFileNameFromUrl(contractData.start_order_file));
          }
          if (contractData.contract_file) {
            setContractFileUrl(contractData.contract_file);
            setContractFileName(extractFileNameFromUrl(contractData.contract_file));
          }
          if (contractData.contract_appendix_file) {
            setContractAppendixFileUrl(contractData.contract_appendix_file);
            setContractAppendixFileName(extractFileNameFromUrl(contractData.contract_appendix_file));
          }
          if (contractData.contract_explanation_file) {
            setContractExplanationFileUrl(contractData.contract_explanation_file);
            setContractExplanationFileName(extractFileNameFromUrl(contractData.contract_explanation_file));
          }
        }
      } catch (e) {
        console.error("Error loading contract file URLs:", e);
      }
      
      // إزالة File objects من form بعد الحفظ الناجح
      if (form.start_order_file instanceof File) setF("start_order_file", null);
      if (form.contract_file instanceof File) setF("contract_file", null);
      if (form.contract_appendix_file instanceof File) setF("contract_appendix_file", null);
      if (form.contract_explanation_file instanceof File) setF("contract_explanation_file", null);
      
      // عند الحفظ وانتقال للخطوة التالية، نضع في وضع view
      updateViewMode(true);
      
      if (!isHousing) {
        // التمويل الخاص - انتهاء، ننتقل للصفحة الرئيسية
        navigate("/projects");
        return;
      }
      
      // القرض السكني - الانتقال للخطوة التالية (أمر الترسية)
      // ✅ دائماً ننتقل للخطوة التالية إذا كان onNext متاحاً
      if (onNext && typeof onNext === "function") {
        onNext();
        return;
      }
      
      // ✅ إذا لم يكن onNext متاحاً، نبقى في وضع العرض بعد الحفظ
      // (updateViewMode(true) تم استدعاؤه بالفعل أعلاه)
    } catch (err) {
      // محاولة استخدام formatServerErrors أولاً
      const serverData = err?.response?.data;
      const formatted = formatServerErrors(serverData);
      
      // إذا لم يكن هناك تنسيق محدد، استخدم معالج الأخطاء الموحد
      if (formatted) {
        setErrorMsg(formatted);
      } else {
        const errorMessage = getErrorMessage(err, "حفظ العقد");
        setErrorMsg(errorMessage || t("save_failed"));
      }
    }
  };

  const isHousing = form.contract_classification === "housing_loan_program";
  // ✅ للقرض السكني: إذا كان هناك onNext، نعرض "حفظ و التالي"، وإلا "حفظ"
  const finishLabel = isHousing && onNext ? `${t("save_next")} →` : (isHousing ? t("save") : t("finish"));

  return (
    <WizardShell title={t("contract.title")}>
      <Dialog
        open={!!errorMsg}
        title={t("warning")}
        desc={<pre className="pre-wrap m-0">{errorMsg}</pre>}
        confirmLabel={t("ok")}
        onClose={() => setErrorMsg("")}
        onConfirm={() => setErrorMsg("")}
      />

      {viewMode && (
        <div className={`row ${isAR ? "justify-start" : "justify-end"} mb-12`}>
          <Button variant="secondary" onClick={() => updateViewMode(false)}>
            {t("edit")}
          </Button>
        </div>
      )}

      {/* 1) تصنيف العقد */}
      <h4>1) {t("contract.sections.classification")}</h4>
      {viewMode ? (
        <div className="card">
          <div className="p-8 row row--align-center row--gap-8">
            <span>{CONTRACT_CLASSIFICATION.find(m => m.value === form.contract_classification)?.label || t("empty_value")}</span>
            {form.contract_classification && (
              <InfoTip
                align="start"
                text={
                  form.contract_classification === "housing_loan_program"
                    ? t("contract.classification.housing_loan_program.desc")
                    : t("contract.classification.private_funding.desc")
                }
              />
            )}
          </div>
        </div>
      ) : (
        <div className="row row--align-center flex-wrap">
          <div className="chips flex-1">
            {CONTRACT_CLASSIFICATION.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`chip ${form.contract_classification === m.value ? "active" : ""}`}
                onClick={() => setF("contract_classification", m.value)}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
          {form.contract_classification && (
            <InfoTip
              align="start"
              text={
                form.contract_classification === "housing_loan_program"
                  ? t("contract.classification.housing_loan_program.desc")
                  : t("contract.classification.private_funding.desc")
              }
            />
          )}
        </div>
      )}

      {/* 2) نوع العقد */}
      <h4 className="mt-16">2) {t("contract.sections.type")}</h4>
      {viewMode ? (
        <div className="form-grid cols-4">
          <ViewRow
            label={t("contract.fields.contract_type")}
            value={CONTRACT_TYPES.find((x) => x.value === form.contract_type)?.label || form.contract_type}
          />
          <Field label={t("contract.fields.contract_file") || "ملف العقد"}>
            <FileAttachmentView
              fileUrl={contractFileUrl}
              fileName={contractFileName || (contractFileUrl ? extractFileNameFromUrl(contractFileUrl) : "") || (form.contract_file?.name || "")}
              projectId={projectId}
              endpoint={`projects/${projectId}/contract/`}
            />
          </Field>
          <Field label={t("contract.fields.contract_appendix_file") || "ملف ملحق العقد"}>
            <FileAttachmentView
              fileUrl={contractAppendixFileUrl}
              fileName={contractAppendixFileName || (contractAppendixFileUrl ? extractFileNameFromUrl(contractAppendixFileUrl) : "") || (form.contract_appendix_file?.name || "")}
              projectId={projectId}
              endpoint={`projects/${projectId}/contract/`}
            />
          </Field>
          <Field label={t("contract.fields.contract_explanation_file") || "ملف شرح العقد"}>
            <FileAttachmentView
              fileUrl={contractExplanationFileUrl}
              fileName={contractExplanationFileName || (contractExplanationFileUrl ? extractFileNameFromUrl(contractExplanationFileUrl) : "") || (form.contract_explanation_file?.name || "")}
              projectId={projectId}
              endpoint={`projects/${projectId}/contract/`}
            />
          </Field>
        </div>
      ) : (
        <div className="form-grid cols-4">
          <Field label={t("contract.fields.contract_type")}>
            <RtlSelect
              className="rtl-select"
              dir={isAR ? "rtl" : "ltr"}
              options={CONTRACT_TYPES}
              value={form.contract_type}
              onChange={(v) => setF("contract_type", v)}
              placeholder={t("contract.placeholders.select_contract_type")}
            />
          </Field>
          <Field label={t("contract.fields.contract_file") || "ملف العقد"}>
            <FileUpload
              value={form.contract_file}
              onChange={(file) => {
                setF("contract_file", file);
                if (file) {
                  setContractFileName(file.name);
                }
              }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSizeMB={10}
              showPreview={true}
              existingFileUrl={contractFileUrl}
              existingFileName={contractFileName || (contractFileUrl ? extractFileNameFromUrl(contractFileUrl) : "")}
              onRemoveExisting={() => {
                setF("contract_file", null);
                setContractFileName("");
              }}
              compressionOptions={{
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
              }}
            />
          </Field>
          <Field label={t("contract.fields.contract_appendix_file") || "ملف ملحق العقد"}>
            <FileUpload
              value={form.contract_appendix_file}
              onChange={(file) => {
                setF("contract_appendix_file", file);
                if (file) {
                  setContractAppendixFileName(file.name);
                }
              }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSizeMB={10}
              showPreview={true}
              existingFileUrl={contractAppendixFileUrl}
              existingFileName={contractAppendixFileName || (contractAppendixFileUrl ? extractFileNameFromUrl(contractAppendixFileUrl) : "")}
              onRemoveExisting={() => {
                setF("contract_appendix_file", null);
                setContractAppendixFileName("");
              }}
              compressionOptions={{
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
              }}
            />
          </Field>
          <Field label={t("contract.fields.contract_explanation_file") || "ملف شرح العقد"}>
            <FileUpload
              value={form.contract_explanation_file}
              onChange={(file) => {
                setF("contract_explanation_file", file);
                if (file) {
                  setContractExplanationFileName(file.name);
                }
              }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSizeMB={10}
              showPreview={true}
              existingFileUrl={contractExplanationFileUrl}
              existingFileName={contractExplanationFileName || (contractExplanationFileUrl ? extractFileNameFromUrl(contractExplanationFileUrl) : "")}
              onRemoveExisting={() => {
                setF("contract_explanation_file", null);
                setContractExplanationFileName("");
              }}
              compressionOptions={{
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
              }}
            />
          </Field>
        </div>
      )}

      {/* 3) بيانات العقد */}
      <h4 className="mt-16">3) {t("contract.sections.details")}</h4>
      {viewMode ? (
        <div className="form-grid cols-3">
          <ViewRow
            label={t("contract.fields.contract_number")}
            value={form.tender_no}
            tip={isHousing ? t("contract.notes.housing_tender_info") : undefined}
          />
          <ViewRow
            label={t("contract.fields.contract_date")}
            value={form.contract_date}
            tip={form.contract_date ? `${t("contract.labels.day")}: ${getDayName(form.contract_date, i18next.language)}` : undefined}
          />
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("contract.fields.contract_number")}>
            <div className="row row--align-center row--gap-8">
              <input
                className="input"
                value={form.tender_no}
                onChange={(e) => setF("tender_no", e.target.value)}
                placeholder={t("contract.placeholders.contract_number")}
              />
              {isHousing && <InfoTip align="start" text={t("contract.notes.housing_tender_info")} />}
            </div>
          </Field>
          <Field label={t("contract.fields.contract_date")}>
            <div className="row row--align-center row--gap-8">
              <input
                className="input"
                type="date"
                value={form.contract_date || ""}
                onChange={(e) => setF("contract_date", e.target.value)}
              />
              {form.contract_date && (
                <InfoTip
                  align="start"
                  text={`${t("contract.labels.day")}: ${getDayName(form.contract_date, i18next.language)}`}
                />
              )}
            </div>
          </Field>
        </div>
      )}

      {/* 4) أطراف العقد */}
      <h4 className="mt-16">4) {t("contract.sections.parties")}</h4>
      <div className="form-grid cols-2">
        <Field label={t("contract.fields.first_party_owner")}>
          {form.owners?.length ? (
            <div className="mini lh-18">
              {form.owners.map((o, i) => {
                const entries = flattenEntries(o);
                const sorted = entries.sort(([kA], [kB]) => {
                  const a = PRIMARY_ORDER.indexOf(kA.split(".")[0]);
                  const b = PRIMARY_ORDER.indexOf(kB.split(".")[0]);
                  if (a !== -1 || b !== -1) {
                    return (a === -1 ? 999 : a) - (b === -1 ? 999 : b);
                  }
                  return kA.localeCompare(kB);
                });

                return (
                  <div key={i} className="owner-block">
                    {sorted.map(([k, v]) => (
                      <div key={k}>
                        <strong>{labelForKey(k)}:</strong> {String(v)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="row row--align-center row--gap-8">
              <InfoTip align="start" text={t("contract.notes.no_owners_siteplan")} />
            </div>
          )}
        </Field>

        <Field label={t("contract.fields.second_party_contractor")}>
          {viewMode ? (
            <>
              <div className="row row--align-center row--gap-8">
                <span>{form.contractor_name || t("empty_value")}</span>
                <InfoTip align="start" text={t("contract.notes.autofill_from_license")} />
              </div>
              <div className="row mt-8 row--gap-8">
                <div>{form.contractor_trade_license || t("empty_value")}</div>
              </div>
            </>
          ) : (
            <>
              <div className="row row--align-center row--gap-8">
                <input
                  className="input"
                  placeholder={t("contract.placeholders.contractor_name")}
                  value={form.contractor_name}
                  onChange={(e) => setF("contractor_name", e.target.value)}
                />
                <InfoTip align="start" text={t("contract.notes.autofill_from_license")} />
              </div>
              <div className="row mt-8 row--gap-8">
                <input
                  className="input"
                  placeholder={t("contract.placeholders.trade_license")}
                  value={form.contractor_trade_license}
                  onChange={(e) => setF("contractor_trade_license", e.target.value)}
                />
              </div>
            </>
          )}
        </Field>
      </div>

      {/* 5) قيمة العقد والمدة */}
      <h4 className="mt-16">5) {t("contract.sections.value_duration")}</h4>
      {viewMode ? (
        <div className="form-grid cols-4">
          <Field label={t("contract_amount")}>
            <div>
              <div className="font-mono fw-600">
                {formatMoney(form.total_project_value)}
              </div>
                  <div className="mini mt-8">
                    {formatMoneyArabic(form.total_project_value)}
                  </div>
                  {form.total_project_value && (
                    <div className="mini mt-8 font-italic">
                      {numberToArabicWords(form.total_project_value)}
                    </div>
                  )}
            </div>
          </Field>
          {isHousing && (
            <>
              <Field label={t("contract.fields.total_bank_value")}>
                <div>
                  <div className="font-mono fw-600">
                    {formatMoney(form.total_bank_value)}
                  </div>
                  <div className="mini mt-8">
                    {formatMoneyArabic(form.total_bank_value)}
                  </div>
                  {form.total_bank_value && (
                    <div className="mini mt-8 font-italic">
                      {numberToArabicWords(form.total_bank_value)}
                    </div>
                  )}
                </div>
              </Field>
              <Field label={t("contract.fields.total_owner_value_calc")}>
                <div>
                  <div className="font-mono fw-600">
                    {formatMoney(form.total_owner_value)}
                  </div>
                  <div className="mini mt-8">
                    {formatMoneyArabic(form.total_owner_value)}
                  </div>
                  {form.total_owner_value && (
                    <div className="mini mt-8 font-italic">
                      {numberToArabicWords(form.total_owner_value)}
                    </div>
                  )}
                </div>
              </Field>
            </>
          )}
          <ViewRow label={t("contract.fields.project_duration_months")} value={form.project_duration_months} />
        </div>
      ) : (
        <div className="form-grid cols-4">
          <Field label={t("contract.fields.total_project_value")}>
            <NumberField
              value={form.total_project_value}
              onChange={(v) => setF("total_project_value", v)}
            />
          </Field>
          {isHousing && (
            <>
              <Field label={t("contract.fields.total_bank_value")}>
                <NumberField
                  value={form.total_bank_value}
                  onChange={(v) => setF("total_bank_value", v)}
                />
              </Field>
              <Field label={t("contract.fields.total_owner_value_calc")}>
                <NumberField
                  value={form.total_owner_value}
                  onChange={() => {}}
                  readOnly
                />
                {form.total_owner_value && (
                  <div className="mini mt-4">
                    {numberToArabicWords(form.total_owner_value)}
                  </div>
                )}
              </Field>
            </>
          )}
          <Field label={t("contract.fields.project_duration_months")}>
            <input
              className="input"
              type="number"
              min="0"
              value={form.project_duration_months}
              onChange={(e) => setF("project_duration_months", e.target.value)}
              placeholder={t("empty_value")}
            />
          </Field>
        </div>
      )}

      {/* 6) أتعاب الاستشاري */}
      <h4 className="mt-16">6) {t("contract.sections.consultant_fees")}</h4>
      <h5 className="mt-8">{t("contract.fees.owner.title")}</h5>
      <ConsultantFeesSection prefix="owner" form={form} setF={setF} isView={viewMode} isAR={isAR} />

      <h5 className="mt-16">{t("contract.fees.bank.title")}</h5>
      <ConsultantFeesSection prefix="bank" form={form} setF={setF} isView={viewMode} isAR={isAR} />

      {/* 7) أمر المباشرة */}
      <h4 className="mt-16">7) {t("start_order_title")}</h4>
      {viewMode ? (
        <div className="form-grid cols-3">
          <ViewRow
            label={t("start_order_exists")}
            value={form.has_start_order === "yes" ? t("yes") : t("no")}
          />
          {form.has_start_order === "yes" && (
            <>
              <Field label={t("start_order_file")}>
                <FileAttachmentView
                  fileUrl={startOrderFileUrl}
                  fileName={startOrderFileName || (startOrderFileUrl ? extractFileNameFromUrl(startOrderFileUrl) : "") || (form.start_order_file?.name || "")}
                  projectId={projectId}
                  endpoint={`projects/${projectId}/contract/`}
                />
              </Field>
              <ViewRow label={t("start_order_date")} value={form.start_order_date} />
              <ViewRow label={t("project_end_date_calculated")} value={form.project_end_date} />
            </>
          )}
        </div>
      ) : (
        <div className="form-grid cols-3">
          <Field label={t("start_order_exists")}>
            <YesNoChips
              value={form.has_start_order}
              onChange={(v) => setF("has_start_order", v)}
            />
          </Field>
          {form.has_start_order === "yes" && (
            <>
              <Field label={t("attach_start_order")}>
                <div className="row row--align-center row--gap-8">
                  <div style={{ flex: 1 }}>
                    <FileUpload
                      value={form.start_order_file}
                      onChange={(file) => {
                        setF("start_order_file", file);
                        if (file) {
                          setStartOrderFileName(file.name);
                        }
                      }}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      maxSizeMB={10}
                      showPreview={true}
                      existingFileUrl={startOrderFileUrl}
                      existingFileName={startOrderFileName || (startOrderFileUrl ? extractFileNameFromUrl(startOrderFileUrl) : "")}
                      onRemoveExisting={() => {
                        setF("start_order_file", null);
                        setStartOrderFileName("");
                      }}
                      compressionOptions={{
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                      }}
                    />
                  </div>
                  <InfoTip align="start" text={t("start_order_required")} />
                </div>
              </Field>
              {/* عرض حقول التاريخ إذا كان هناك ملف (جديد أو موجود سابقاً) */}
              {(form.start_order_file || startOrderFileUrl) && (
                <>
                  <Field label={t("start_order_date")}>
                    <input
                      type="date"
                      className="input"
                      value={form.start_order_date || ""}
                      onChange={(e) => setF("start_order_date", e.target.value)}
                    />
                  </Field>
                  <Field label={t("project_end_date_calculated")}>
                    <input className="input" value={form.project_end_date} readOnly />
                  </Field>
                </>
              )}
            </>
          )}
        </div>
      )}


      {!viewMode && (
        <StepActions
          onPrev={onPrev}
          onNext={save}
          nextLabel={hasNextStep ? finishLabel : t("save")}
          nextClassName="primary"
        />
      )}
    </WizardShell>
  );
}

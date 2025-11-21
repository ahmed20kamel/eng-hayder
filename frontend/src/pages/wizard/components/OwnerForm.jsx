// مكون موحد لنموذج المالك
import { useTranslation } from "react-i18next";
import Field from "../../../components/fields/Field";
import ViewRow from "../../../components/fields/ViewRow";
import RtlSelect from "../../../components/fields/RtlSelect";
import Button from "../../../components/Button";
import FileAttachmentView from "../../../components/FileAttachmentView";
import FileUpload from "../../../components/FileUpload";
import { NATIONALITIES } from "../../../utils/constants";
import { handleEmiratesIdInput } from "../../../utils/idFormatters";
import { extractFileNameFromUrl } from "../../../utils/fileHelpers";

export const EMPTY_OWNER = {
  owner_name_ar: "",
  owner_name_en: "",
  nationality: "",
  id_number: "",
  id_issue_date: "",
  id_expiry_date: "",
  id_attachment: null,
  right_hold_type: "Ownership",
  share_possession: "",
  share_percent: "100",
  phone: "",
  email: "",
};

export default function OwnerForm({ owner, index, isView, onUpdate, onRemove, canRemove, isAR, idAttachmentUrl, projectId, idAttachmentFileName }) {
  const { t } = useTranslation();
  const nationalityOptions = NATIONALITIES.map(n => ({
    value: n.value,
    label: isAR ? n.label.ar : n.label.en
  }));

  if (isView) {
    return (
      <div className="card">
        <div className="form-grid cols-4">
          <ViewRow label={t("owner_name_ar")} value={owner.owner_name_ar} />
          <ViewRow label={t("owner_name_en")} value={owner.owner_name_en} />
          <ViewRow label={t("nationality")} value={owner.nationality} />
          <ViewRow label={t("share_percent")} value={owner.share_percent ? `${owner.share_percent}%` : "0%"} />
          <ViewRow label={t("phone")} value={owner.phone} />
          <ViewRow label={t("email")} value={owner.email} />
          <ViewRow label={t("id_number")} value={owner.id_number} />
          {owner.nationality !== "Emirati" && (
            <ViewRow label={t("issue_date")} value={owner.id_issue_date} />
          )}
          <ViewRow label={t("expiry_date")} value={owner.id_expiry_date} />
          <Field label={t("id_attachment")}>
            <FileAttachmentView
              fileUrl={idAttachmentUrl}
              fileName={idAttachmentFileName || (idAttachmentUrl ? extractFileNameFromUrl(idAttachmentUrl) : "") || (owner.id_attachment?.name || "")}
              projectId={projectId}
              endpoint={`projects/${projectId}/siteplan/`}
            />
          </Field>
          <ViewRow label={t("right_hold_type")} value={owner.right_hold_type} />
        </div>
      </div>
    );
  }

  return (
    <div className="owner-block">
      <div className="form-grid cols-3">
        <Field label={t("owner_name_ar")}>
          <input
            className="input"
            value={owner.owner_name_ar}
            onChange={(e) => onUpdate(index, "owner_name_ar", e.target.value)}
          />
        </Field>
        <Field label={t("owner_name_en")}>
          <input
            className="input"
            value={owner.owner_name_en}
            onChange={(e) => onUpdate(index, "owner_name_en", e.target.value)}
          />
        </Field>
        <Field label={t("nationality")}>
          <RtlSelect
            className="rtl-select"
            options={nationalityOptions}
            value={owner.nationality}
            onChange={(v) => onUpdate(index, "nationality", v)}
            placeholder={t("select_nationality")}
          />
        </Field>
      </div>

      <div className="form-grid cols-3 mt-8">
        <Field label={t("phone")}>
          <input
            className="input"
            value={owner.phone}
            onChange={(e) => onUpdate(index, "phone", e.target.value)}
          />
        </Field>
        <Field label={t("email")}>
          <input
            className="input"
            type="email"
            value={owner.email}
            onChange={(e) => onUpdate(index, "email", e.target.value)}
          />
        </Field>
        <div />
      </div>

      <div className="form-grid cols-4 mt-8">
        <Field label={t("id_number")}>
          <input
            className="input"
            value={owner.id_number || ""}
            onChange={(e) => handleEmiratesIdInput(e, (v) => onUpdate(index, "id_number", v))}
            maxLength={18}
            placeholder={t("id_placeholder")}
          />
        </Field>
        {owner.nationality !== "Emirati" && (
          <Field label={t("issue_date")}>
            <input
              className="input"
              type="date"
              value={owner.id_issue_date || ""}
              onChange={(e) => onUpdate(index, "id_issue_date", e.target.value)}
            />
          </Field>
        )}
        <Field label={t("expiry_date")}>
          <input
            className="input"
            type="date"
            value={owner.id_expiry_date || ""}
            onChange={(e) => onUpdate(index, "id_expiry_date", e.target.value)}
          />
        </Field>
        <Field label={t("id_attachment")}>
          <FileUpload
            value={owner.id_attachment}
            onChange={(file) => onUpdate(index, "id_attachment", file)}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            maxSizeMB={10}
            showPreview={true}
            existingFileUrl={idAttachmentUrl}
            existingFileName={idAttachmentFileName || (idAttachmentUrl ? extractFileNameFromUrl(idAttachmentUrl) : "")}
            onRemoveExisting={() => onUpdate(index, "id_attachment", null)}
            compressionOptions={{
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
            }}
          />
        </Field>
      </div>

      <div className="form-grid cols-4 mt-8">
        <Field label={t("right_hold_type")}>
          <select
            className="input"
            value={owner.right_hold_type}
            onChange={(e) => onUpdate(index, "right_hold_type", e.target.value)}
          >
            <option value={t("right_hold_type_grant")}>{t("right_hold_type_grant")}</option>
            <option value={t("right_hold_type_purchase")}>{t("right_hold_type_purchase")}</option>
          </select>
        </Field>
        <Field label={t("share_percent")}>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={owner.share_percent}
            onChange={(e) => onUpdate(index, "share_percent", e.target.value)}
          />
        </Field>
        <Field label={t("action")}>
          <Button
            variant="secondary"
            type="button"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            title={t("remove")}
          >
            {t("remove")}
          </Button>
        </Field>
        <div />
      </div>
    </div>
  );
}


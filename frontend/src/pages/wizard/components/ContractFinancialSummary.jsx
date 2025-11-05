// src/pages/wizard/components/ContractFinancialSummary.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../services/api";
import InfoTip from "./InfoTip";

/* ================= Helpers ================= */
const n = (v) => {
  if (v === undefined || v === null || v === "" || Number.isNaN(v)) return 0;
  const x = parseFloat(String(v).replace(/[^\d.+-]/g, ""));
  return Number.isFinite(x) ? x : 0;
};
const round = (v) => Math.round(n(v));
const fmtAED = (v) => `AED ${round(n(v)).toLocaleString("en-US")}`; // أرقام إنجليزي

// استخراج أتعاب الاستشاري عندما تكون نسبة الاستشاري مشمولة ضمن المبلغ
const feeInclusive = (gross, pct) => {
  const g = n(gross), r = n(pct);
  if (g <= 0 || r <= 0) return { fee: 0, net: g };
  const fee = round(g * (r / (100 + r)));
  return { fee, net: g - fee };
};

/* =================== Main =================== */
export default function ContractFinancialSummary({ projectId }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // تحميل العقد
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api
      .get(`projects/${projectId}/contract/`)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) setContract(data[0]);
        else if (data && typeof data === "object") setContract(data);
        else setContract(null);
      })
      .catch((e) => {
        console.error("Contract fetch error", e);
        setContract(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // كل الحسابات تتم هنا بشكل آمن؛ لو حصل خطأ نرجّع error بدل ما نغيّر state أثناء الريندر
  const computed = useMemo(() => {
    try {
      if (!contract) return { error: null, data: null };

      const c = contract;

      // إجماليات
      const grossTotal = n(c.total_project_value);
      const grossBank =
        c.contract_classification === "housing_loan_program" ? n(c.total_bank_value) : 0;
      const grossOwner = n(c.total_owner_value) || Math.max(0, grossTotal - grossBank);

      // نسب الاستشاري
      const ownerIncludes = c.owner_includes_consultant === true || c.owner_includes_consultant === "yes";
      const bankIncludes  = c.bank_includes_consultant  === true || c.bank_includes_consultant  === "yes";

      const ownerPct = ownerIncludes
        ? n(c.owner_fee_design_percent) + n(c.owner_fee_supervision_percent) +
          (c.owner_fee_extra_mode === "percent" ? n(c.owner_fee_extra_value) : 0)
        : 0;

      const bankPct = bankIncludes
        ? n(c.bank_fee_design_percent) + n(c.bank_fee_supervision_percent) +
          (c.bank_fee_extra_mode === "percent" ? n(c.bank_fee_extra_value) : 0)
        : 0;

      const totalPct =
        ownerPct && bankPct && Math.abs(ownerPct - bankPct) < 1e-6
          ? ownerPct
          : ownerPct || bankPct || 0;

      // تفكيك الأتعاب من الإجماليات
      const total  = feeInclusive(grossTotal, totalPct);
      const bank   = feeInclusive(grossBank,  bankPct  || totalPct);
      const owner  = feeInclusive(grossOwner, ownerPct || totalPct);

      // دوال العرض
      const A   = (v) => fmtAED(v);
      const vat = (v) => round(n(v) * 0.05);
      const inc = (v)  => round(n(v) + vat(v));

      return {
        error: null,
        data: {
          c, grossTotal, grossBank, grossOwner,
          ownerPct, bankPct, totalPct,
          total, bank, owner,
          A, vat, inc,
        }
      };
    } catch (e) {
      console.error("Summary compute error:", e, { contract });
      return { error: e, data: null };
    }
  }, [contract]);

  if (loading) return <div style={{ padding: 20 }}>⏳ جاري تحميل بيانات العقد...</div>;
  if (!contract) return <div style={{ padding: 20 }}>⚠️ لا توجد بيانات عقد متاحة.</div>;
  if (computed.error) {
    return (
      <div className="card" style={{ padding: 16, direction: "rtl", color: "#b00020" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>حدث خطأ أثناء عرض الملخص.</div>
        <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", background: "#fff7f7", padding: 10, borderRadius: 6, border: "1px solid #ffd0d0" }}>
          {`Error: ${computed.error?.message || computed.error}\n\nContract payload:\n` +
            JSON.stringify(contract, null, 2)}
        </div>
      </div>
    );
  }

  // تفكيك القيم المحسوبة
  const { grossTotal, grossBank, grossOwner, ownerPct, bankPct, totalPct, total, bank, owner, A, vat, inc } = computed.data;

  /* ===== ستايل شبيه بالإكسيل ===== */
  const S = {
    y: {
      background: "#ffe400",
      fontWeight: 700,
      border: "1px solid #cfcfcf",
      padding: "8px 10px",
      direction: "rtl",
    },
    th: {
      background: "#f7f7f7",
      border: "1px solid #dcdcdc",
      padding: "10px 8px",
      textAlign: "center",
    },
    td: {
      border: "1px solid #e4e4e4",
      padding: "8px 8px",
      verticalAlign: "top",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      direction: "rtl",
    },
    gap: { height: 14 },
  };

  /* ===== الملاحظات ===== */
  const notes = {
    total_contract:
      "المبلغ الإجمالي للتعاقد، وهو مجموع أعمال المقاول مضافًا إليها أتعاب الاستشاري إن وُجدت.",
    fee_total:
      "إجمالي أتعاب الاستشاري، المستقطعة من القيمة الإجمالية للعقد.",
    net_total:
      "القيمة الصافية لأعمال المقاول بعد خصم أتعاب الاستشاري.",
    bank_total:
      "إجمالي مبلغ تمويل البنك (يشمل أتعاب الاستشاري إن وُجدت).",
    bank_fee: "أتعاب الاستشاري المستقطعة من تمويل البنك.",
    bank_net: "القيمة الفعلية لأعمال المقاول الممولة من البنك.",
    owner_total: "إجمالي مبلغ تمويل المالك (يشمل أتعاب الاستشاري إن وُجدت).",
    owner_fee: "أتعاب الاستشاري المستقطعة من تمويل المالك.",
    owner_net: "القيمة الفعلية لأعمال المقاول الممولة من المالك.",
  };

  /* ===== صفوف الجداول ===== */
  const RowAmount = (label, value, noteKey, percent = null) => (
    <tr key={label}>
      <td style={S.td}>
        {label}
        <InfoTip text={notes[noteKey]} />
        {percent !== null && (
          <span style={{ color: "#666", fontSize: 13, marginInlineStart: 8 }}>
            ({percent}%)
          </span>
        )}
      </td>
      <td style={{ ...S.td, textAlign: "center" }}>{A(value)}</td>
    </tr>
  );

  const RowVAT = (label, amt) => (
    <tr key={label}>
      <td style={S.td}>{label}</td>
      <td style={{ ...S.td, textAlign: "center" }}>{A(amt)}</td>
      <td style={{ ...S.td, textAlign: "center" }}>{A(vat(amt))}</td>
      <td style={{ ...S.td, textAlign: "center" }}>{A(inc(amt))}</td>
    </tr>
  );

  return (
    <div className="card" style={{ overflowX: "auto", padding: 0 }}>
      {/* ① إجمالي مبالغ العقد */}
      <div style={S.y}>① إجمالي مبالغ العقد (أعمال المقاولة) / Total Contract Amounts</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>البيان</th>
            <th style={S.th}>القيمة (AED) غير شاملة الضريبة</th>
          </tr>
        </thead>
        <tbody>
          {RowAmount("إجمالي مبلغ المقاولة التعاقدي", grossTotal, "total_contract")}
          {RowAmount("نسبة الاستشاري", 0, "fee_total", `${totalPct || 0}`)}
          {RowAmount("إجمالي مبلغ أتعاب الاستشاري", total.fee, "fee_total")}
          {RowAmount("إجمالي مبلغ المقاولة الفعلية", total.net, "net_total")}
        </tbody>
      </table>

      <div style={S.gap} />

      {/* ② بنك */}
      <div style={S.y}>② تفصيل حصة تمويل البنك / Bank Share Details</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>البيان</th>
            <th style={S.th}>القيمة (AED)</th>
          </tr>
        </thead>
        <tbody>
          {RowAmount("إجمالي مبلغ حصة تمويل البنك", grossBank, "bank_total")}
          {RowAmount("نسبة الاستشاري", 0, "bank_fee", `${bankPct || totalPct || 0}`)}
          {RowAmount("أتعاب الاستشاري ضمن إجمالي حصة تمويل البنك", bank.fee, "bank_fee")}
          {RowAmount("مبلغ المقاولة الفعلية من حصة تمويل البنك", bank.net, "bank_net")}
        </tbody>
      </table>

      <div style={S.gap} />

      {/* ③ مالك */}
      <div style={S.y}>③ تفصيل حصة تمويل المالك / Owner Share Details</div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>البيان</th>
            <th style={S.th}>القيمة (AED)</th>
          </tr>
        </thead>
        <tbody>
          {RowAmount("إجمالي مبلغ حصة تمويل المالك", grossOwner, "owner_total")}
          {RowAmount("نسبة الاستشاري", 0, "owner_fee", `${ownerPct || totalPct || 0}`)}
          {RowAmount("أتعاب الاستشاري ضمن إجمالي حصة تمويل المالك", owner.fee, "owner_fee")}
          {RowAmount("مبلغ المقاولة الفعلية من حصة تمويل المالك", owner.net, "owner_net")}
        </tbody>
      </table>

      <div style={S.gap} />

      {/* التفاصيل المالية شامل الضريبة */}
      <div style={S.y}>
        📊 التفاصيل المالية لعقد المشروع شامل الضريبة / Contract Financial Details
      </div>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>البيان</th>
            <th style={S.th}>القيمة (AED) غير شاملة الضريبة</th>
            <th style={S.th}>قيمة الضريبة 5%</th>
            <th style={S.th}>الإجمالي شامل الضريبة</th>
          </tr>
        </thead>
        <tbody>
          {RowVAT("إجمالي مبلغ حصة تمويل البنك", grossBank)}
          {RowVAT("إجمالي مبلغ حصة تمويل المالك", grossOwner)}
          {RowVAT("إجمالي مبلغ المقاولة التعاقدي", grossTotal)}
          {RowVAT("أتعاب الاستشاري ضمن إجمالي حصة تمويل البنك", bank.fee)}
          {RowVAT("أتعاب الاستشاري ضمن إجمالي حصة تمويل المالك", owner.fee)}
          {RowVAT("إجمالي مبلغ أتعاب الاستشاري", total.fee)}
          {RowVAT("مبلغ المقاولة الفعلية من حصة تمويل البنك", bank.net)}
          {RowVAT("مبلغ المقاولة الفعلية من حصة تمويل المالك", owner.net)}
          {RowVAT("إجمالي مبلغ المقاولة الفعلية", total.net)}
        </tbody>
      </table>
    </div>
  );
}

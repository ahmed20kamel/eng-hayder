// src/pages/ProjectView.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

function Card({ title, subtitle, children, actions }) {
  return (
    <div className="card p-14">
      <div className="row row--space-between row--align-center">
        <div>
          <div className="fw-700">{title}</div>
          {subtitle ? <div className="mini">{subtitle}</div> : null}
        </div>
        <div className="row row--gap-8">{actions}</div>
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}

const fmtAED = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "—";
  return `AED ${Math.round(n).toLocaleString("en-US")}`;
};

export default function ProjectView() {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [siteplan, setSiteplan] = useState(null);
  const [license, setLicense] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [pRes, spRes, lcRes, ctRes] = await Promise.allSettled([
          api.get(`projects/${projectId}/`),
          api.get(`projects/${projectId}/siteplan/`),
          api.get(`projects/${projectId}/license/`),
          api.get(`projects/${projectId}/contract/`),
        ]);
        if (!mounted) return;
        if (pRes.status === "fulfilled") setProject(pRes.value?.data || null);

        if (spRes.status === "fulfilled") {
          const d = spRes.value?.data;
          setSiteplan(Array.isArray(d) ? d[0] : (d || null));
        }
        if (lcRes.status === "fulfilled") {
          const d = lcRes.value?.data;
          setLicense(Array.isArray(d) ? d[0] : (d || null));
        }
        if (ctRes.status === "fulfilled") {
          const d = ctRes.value?.data;
          setContract(Array.isArray(d) ? d[0] : (d || null));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId]);

  const hasSiteplan = !!siteplan;
  const hasLicense  = !!license;
  const hasContract = !!contract;

  return (
    <div className="container">
      <div className="card card--page">
        <div className="content">
          <div className="row row--space-between row--align-center">
            <h2 className="page-title">
              {project?.name ? `📦 ${project.name}` : `📦 مشروع #${projectId}`}
            </h2>
            <div className="row row--gap-8">
              <Link className="btn secondary" to="/">الرئيسية ←</Link>
              <Link className="btn" to={`/projects/${projectId}/wizard?step=setup&mode=edit`}>تعديل المشروع</Link>
            </div>
          </div>

          {loading ? (
            <div className="mini mt-12">⏳ جاري التحميل…</div>
          ) : (
            <div className="stack mt-12 stack--gap-12">
              {/* معلومات المشروع */}
              <Card
                title="🧱 معلومات المشروع (عرض)"
                subtitle="بيانات المشروع الأساسية"
                actions={
                  <>
                    <Link className="btn" to={`/projects/${projectId}/setup/view`}>فتح العرض</Link>
                    <Link className="btn secondary" to={`/projects/${projectId}/wizard?step=setup&mode=edit`}>تعديل</Link>
                  </>
                }
              >
                <div className="mini lh-18">
                  <div>تصنيف: {project?.project_type || "—"}</div>
                  {project?.villa_category ? <div>الفئة الفرعية: {project.villa_category}</div> : null}
                  <div>نوع العقد: {project?.contract_type || "—"}</div>
                </div>
              </Card>

              {/* مخطط الأرض */}
              <Card
                title="📐 مخطط الأرض"
                subtitle={hasSiteplan ? "بيانات متاحة" : "لا يوجد مخطط أرض بعد"}
                actions={
                  <>
                    <Link
                      className={`btn ${hasSiteplan ? "" : "disabled"}`}
                      to={`/projects/${projectId}/siteplan/view`}
                      aria-disabled={!hasSiteplan}
                      onClick={(e) => { if (!hasSiteplan) e.preventDefault(); }}
                    >
                      فتح العرض
                    </Link>
                    <Link className="btn secondary" to={`/projects/${projectId}/wizard?step=siteplan&mode=edit`}>تعديل</Link>
                  </>
                }
              >
                <div className="mini">
                  {hasSiteplan
                    ? <>البلدية: {siteplan?.municipality || "—"} • المنطقة: {siteplan?.zone || "—"} • رقم الأرض: {siteplan?.land_no || "—"}</>
                    : <>—</>}
                </div>
              </Card>

              {/* ترخيص البناء */}
              <Card
                title="📄 ترخيص البناء"
                subtitle={hasLicense ? "بيانات متاحة" : "لا يوجد ترخيص بعد"}
                actions={
                  <>
                    <Link
                      className={`btn ${hasLicense ? "" : "disabled"}`}
                      to={`/projects/${projectId}/license/view`}
                      aria-disabled={!hasLicense}
                      onClick={(e) => { if (!hasLicense) e.preventDefault(); }}
                    >
                      فتح العرض
                    </Link>
                    <Link className="btn secondary" to={`/projects/${projectId}/wizard?step=license&mode=edit`}>تعديل</Link>
                  </>
                }
              >
                <div className="mini">
                  {hasLicense
                    ? <>رقم الرخصة: {license?.license_no || "—"} • المقاول: {license?.contractor_name || "—"}</>
                    : <>—</>}
                </div>
              </Card>

              {/* معلومات العقد */}
              <Card
                title="📝 معلومات العقد"
                subtitle={hasContract ? "بيانات متاحة" : "لا يوجد عقد بعد"}
                actions={
                  <>
                    <Link
                      className={`btn ${hasContract ? "" : "disabled"}`}
                      to={`/projects/${projectId}/contract/view`}
                      aria-disabled={!hasContract}
                      onClick={(e) => { if (!hasContract) e.preventDefault(); }}
                    >
                      فتح العرض
                    </Link>
                    <Link className="btn secondary" to={`/projects/${projectId}/wizard?step=contract&mode=edit`}>تعديل</Link>
                  </>
                }
              >
                <div className="mini">
                  {hasContract
                    ? <>نوع العقد: {contract?.contract_type || "—"} • إجمالي المشروع: {fmtAED(contract?.total_project_value)}</>
                    : <>—</>}
                </div>
              </Card>

              {/* الملخص المالي */}
              <Card
                title="📊 الملخص المالي"
                subtitle="ملخص القيم المالية وأتعاب الاستشاري والضريبة (قابل للطباعة)"
                actions={
                  <Link className="btn secondary" to={`/projects/${projectId}/summary`}>
                    فتح الملخص
                  </Link>
                }
              >
                <div className="mini">استعراض مفصل لتوزيع التمويل (المالك/البنك) وصافي المقاول والضريبة.</div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

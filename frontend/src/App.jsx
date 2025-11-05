// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

// صفحات رئيسية
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";

// المعالج
import WizardPage from "./pages/wizard/WizardPage";

// صفحات العرض (موجودين عندك)
import ViewSitePlan from "./pages/ViewSitePlan";
import ViewLicense from "./pages/ViewLicense";
import ViewSummary from "./pages/ViewSummary";

// الصفحات الجديدة اللي عملناها
import ProjectView from "./pages/ProjectView";
import ViewSetup from "./pages/view/ViewSetup";
import ViewContract from "./pages/view/ViewContract";

// (اختياري) لو عندك صفحة ملخص مالي مستقلة:
// import ViewSummary from "./pages/ViewSummary";

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* الرئيسية */}
        <Route path="/" element={<HomePage />} />

        {/* قائمة المشاريع */}
        <Route path="/projects" element={<ProjectsPage />} />

        {/* محاولة فتح المعالج بدون projectId → رجوع للقائمة */}
        <Route path="/projects/wizard" element={<Navigate to="/projects" replace />} />

        {/* المعالج بمشروع محدد */}
        <Route path="/projects/:projectId/wizard" element={<WizardPage />} />

        {/* صفحة عرض المشروع (الكروت) */}
        <Route path="/projects/:projectId" element={<ProjectView />} />

        {/* صفحات العرض المنفصلة لكل مرحلة بنفس View تبع الـWizard */}
        <Route path="/projects/:projectId/setup/view" element={<ViewSetup />} />
        <Route path="/projects/:projectId/siteplan/view" element={<ViewSitePlan />} />
        <Route path="/projects/:projectId/license/view" element={<ViewLicense />} />
        <Route path="/projects/:projectId/contract/view" element={<ViewContract />} />

        {/* الملخص المالي (لو عندك صفحة له) */}
        {/* <Route path="/projects/:projectId/summary" element={<ViewSummary />} /> */}
        <Route path="/projects/:projectId/summary" element={<ViewSummary />} />

        {/* أي مسار غير معروف */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

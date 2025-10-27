// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import WizardPage from "./pages/wizard/WizardPage";
import ViewSitePlan from "./pages/ViewSitePlan";
import ViewLicense from "./pages/ViewLicense";

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* رئيسية */}
        <Route path="/" element={<HomePage />} />

        {/* قائمة المشاريع */}
        <Route path="/projects" element={<ProjectsPage />} />

        {/* أي محاولة لفتح المعالج بدون projectId → نوجّه لصفحة المشاريع */}
        <Route path="/projects/wizard" element={<Navigate to="/projects" replace />} />

        {/* المعالج الصحيح لازم projectId */}
        <Route path="/projects/:projectId/wizard" element={<WizardPage />} />

        {/* صفحات العرض */}
        <Route path="/projects/:projectId/siteplan/view" element={<ViewSitePlan />} />
        <Route path="/projects/:projectId/license/view" element={<ViewLicense />} />

        {/* مسارات غير معروفة */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

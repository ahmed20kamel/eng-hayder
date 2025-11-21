// Hook موحد لجلب بيانات المشروع الكاملة (project, siteplan, license, contract)
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function useProjectData(projectId) {
  const [data, setData] = useState({
    project: null,
    siteplan: null,
    license: null,
    contract: null,
    awarding: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    Promise.allSettled([
      api.get(`projects/${projectId}/`),
      api.get(`projects/${projectId}/siteplan/`),
      api.get(`projects/${projectId}/license/`),
      api.get(`projects/${projectId}/contract/`),
      api.get(`projects/${projectId}/awarding/`),
    ]).then(([pRes, spRes, lcRes, ctRes, awRes]) => {
      if (!mounted) return;

      const project = pRes.status === "fulfilled" ? pRes.value?.data || null : null;
      
      const siteplan = spRes.status === "fulfilled" 
        ? (Array.isArray(spRes.value?.data) ? spRes.value.data[0] : spRes.value?.data || null)
        : null;
      
      const license = lcRes.status === "fulfilled"
        ? (Array.isArray(lcRes.value?.data) ? lcRes.value.data[0] : lcRes.value?.data || null)
        : null;
      
      const contract = ctRes.status === "fulfilled"
        ? (Array.isArray(ctRes.value?.data) ? ctRes.value.data[0] : ctRes.value?.data || null)
        : null;

      const awarding = awRes.status === "fulfilled"
        ? (Array.isArray(awRes.value?.data) ? awRes.value.data[0] : awRes.value?.data || null)
        : null;

      setData({ project, siteplan, license, contract, awarding });
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  return { ...data, loading };
}


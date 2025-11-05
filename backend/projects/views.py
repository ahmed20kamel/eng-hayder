# backend/projects/views.py
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser  # ← أضفنا JSONParser

from .models import Project, SitePlan, BuildingLicense, Contract
from .serializers import (
    ProjectSerializer,
    SitePlanSerializer,
    BuildingLicenseSerializer,
    ContractSerializer,
)

# ===============================
# يزرع كوكي CSRF عند أول GET (علشان الفرونت يلقطه تلقائيًا)
# ===============================
@ensure_csrf_cookie
def csrf_ping(request):
    return JsonResponse({"ok": True})


# ===============================
# المشاريع
# ===============================
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-created_at")
    serializer_class = ProjectSerializer


# ===============================
# أساس موحّد للـ ViewSets التابعة لمشروع
# ===============================
class _ProjectChildViewSet(viewsets.ModelViewSet):
    """
    أساس موحّد لموارد تابعة لمشروع: يفلتر بالـ project_pk،
    ويثبّت الربط في create/update، ويفعّل parsers للملفات و JSON.
    """
    # ✅ أهم تعديل: دعم JSON كمان
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def _get_project(self):
        return get_object_or_404(Project, pk=self.kwargs["project_pk"])

    def get_queryset(self):
        return self.queryset.filter(project_id=self.kwargs["project_pk"])

    def perform_create(self, serializer):
        serializer.save(project=self._get_project())

    def perform_update(self, serializer):
        serializer.save(project=self._get_project())

    # ✅ مهم: تمرير request إلى serializer context (موجود أصلاً)
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


# ===============================
# SitePlan (OneToOne)
# ===============================
class SitePlanViewSet(_ProjectChildViewSet):
    queryset = SitePlan.objects.all().order_by("-created_at")
    serializer_class = SitePlanSerializer

    def create(self, request, *args, **kwargs):
        project = self._get_project()
        if hasattr(project, "siteplan"):
            return Response(
                {"detail": "SitePlan already exists for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


# ===============================
# BuildingLicense (OneToOne + Snapshot من SitePlan)
# ===============================
class BuildingLicenseViewSet(_ProjectChildViewSet):
    queryset = BuildingLicense.objects.all().order_by("-created_at")
    serializer_class = BuildingLicenseSerializer

    def create(self, request, *args, **kwargs):
        project = self._get_project()
        if hasattr(project, "license"):
            return Response(
                {"detail": "BuildingLicense already exists for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)


# ===============================
# Contract (OneToOne + Snapshot من License)
# ===============================
class ContractViewSet(_ProjectChildViewSet):
    queryset = Contract.objects.all().order_by("-created_at")
    serializer_class = ContractSerializer

    def create(self, request, *args, **kwargs):
        project = self._get_project()
        if hasattr(project, "contract"):
            return Response(
                {"detail": "Contract already exists for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

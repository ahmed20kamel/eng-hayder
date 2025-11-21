# backend/projects/views.py
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Project, SitePlan, SitePlanOwner, BuildingLicense, Contract, Awarding
from .serializers import (
    ProjectSerializer,
    SitePlanSerializer,
    BuildingLicenseSerializer,
    ContractSerializer,
    AwardingSerializer,
)
from decimal import Decimal
from datetime import datetime


# ===============================
# CSRF Cookie
# ===============================
@ensure_csrf_cookie
def csrf_ping(request):
    """زرع كوكي CSRF عند أول GET (للفرونت)"""
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
    أساس موحّد لموارد تابعة لمشروع:
    - يفلتر بالـ project_pk
    - يثبّت الربط في create/update
    - يدعم parsers للملفات و JSON
    """
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def _get_project(self):
        return get_object_or_404(Project, pk=self.kwargs["project_pk"])

    def get_queryset(self):
        return self.queryset.filter(project_id=self.kwargs["project_pk"])

    def perform_create(self, serializer):
        serializer.save(project=self._get_project())

    def perform_update(self, serializer):
        serializer.save(project=self._get_project())

    def get_serializer_context(self):
        """تمرير request إلى serializer context"""
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
    
    @action(detail=True, methods=["post"], url_path="restore-owners")
    def restore_owners(self, request, project_pk=None, pk=None):
        """استعادة الملاك من الرخصة إلى Site Plan"""
        license_obj = self.get_object()
        
        try:
            siteplan = license_obj.project.siteplan
        except SitePlan.DoesNotExist:
            return Response(
                {"detail": "SitePlan does not exist for this project."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # ✅ الحصول على الملاك من الرخصة
        owners_data = license_obj.owners
        if not owners_data or not isinstance(owners_data, list) or len(owners_data) == 0:
            return Response(
                {"detail": "No owners found in license."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # ✅ حذف الملاك الموجودين في Site Plan
        siteplan.owners.all().delete()
        
        # ✅ استعادة الملاك من الرخصة
        restored_count = 0
        for owner_data in owners_data:
            # ✅ تحويل التواريخ
            id_issue_date = None
            id_expiry_date = None
            if owner_data.get("id_issue_date"):
                try:
                    if isinstance(owner_data["id_issue_date"], str):
                        id_issue_date = datetime.fromisoformat(owner_data["id_issue_date"].replace('Z', '+00:00')).date()
                    else:
                        id_issue_date = owner_data["id_issue_date"]
                except:
                    pass
            
            if owner_data.get("id_expiry_date"):
                try:
                    if isinstance(owner_data["id_expiry_date"], str):
                        id_expiry_date = datetime.fromisoformat(owner_data["id_expiry_date"].replace('Z', '+00:00')).date()
                    else:
                        id_expiry_date = owner_data["id_expiry_date"]
                except:
                    pass
            
            # ✅ تحويل share_percent
            share_percent = owner_data.get("share_percent", "100.00")
            if isinstance(share_percent, str):
                try:
                    share_percent = Decimal(share_percent)
                except:
                    share_percent = Decimal("100.00")
            elif not isinstance(share_percent, Decimal):
                share_percent = Decimal(str(share_percent))
            
            # ✅ إنشاء المالك
            SitePlanOwner.objects.create(
                siteplan=siteplan,
                owner_name_ar=owner_data.get("owner_name_ar", ""),
                owner_name_en=owner_data.get("owner_name_en", ""),
                nationality=owner_data.get("nationality", ""),
                phone=owner_data.get("phone", ""),
                email=owner_data.get("email", ""),
                id_number=owner_data.get("id_number", ""),
                id_issue_date=id_issue_date,
                id_expiry_date=id_expiry_date,
                right_hold_type=owner_data.get("right_hold_type", "Ownership"),
                share_possession=owner_data.get("share_possession", ""),
                share_percent=share_percent,
            )
            restored_count += 1
        
        # ✅ تحديث اسم المشروع
        siteplan.refresh_from_db()
        serializer_instance = SitePlanSerializer()
        serializer_instance._update_project_name_from_owners(siteplan)
        
        # ✅ تحديث snapshot في الرخصة
        from .serializers import build_siteplan_snapshot
        license_obj.siteplan_snapshot = build_siteplan_snapshot(siteplan)
        license_obj.save(update_fields=["siteplan_snapshot"])
        
        return Response({
            "detail": f"Successfully restored {restored_count} owners to Site Plan.",
            "restored_count": restored_count
        })


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


# ===============================
# Awarding (OneToOne)
# ===============================
class AwardingViewSet(_ProjectChildViewSet):
    queryset = Awarding.objects.all().order_by("-created_at")
    serializer_class = AwardingSerializer

    def create(self, request, *args, **kwargs):
        project = self._get_project()
        if hasattr(project, "awarding"):
            return Response(
                {"detail": "Awarding already exists for this project."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

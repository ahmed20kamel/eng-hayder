import re
import json
from rest_framework import serializers
from .models import (
    Project, SitePlan, SitePlanOwner, BuildingLicense, Contract
)

# =========================
# Helpers (snapshots)
# =========================
def build_siteplan_snapshot(sp: SitePlan):
    """لقطة ثابتة من الـ SitePlan (بما فيها الملاك والملفات)."""
    owners = []
    for o in sp.owners.all().order_by("id"):
        owners.append({
            "owner_name_ar": o.owner_name_ar,
            "owner_name_en": o.owner_name_en,
            "nationality": o.nationality,
            "phone": o.phone,
            "email": o.email,
            "id_number": o.id_number,
            "id_issue_date": o.id_issue_date.isoformat() if o.id_issue_date else None,
            "id_expiry_date": o.id_expiry_date.isoformat() if o.id_expiry_date else None,
            "share_possession": o.share_possession,
            "right_hold_type": o.right_hold_type,
            "share_percent": float(o.share_percent) if o.share_percent is not None else None,
            "id_attachment": o.id_attachment.url if o.id_attachment else None,
        })
    return {
        "property": {
            "municipality": sp.municipality,
            "zone": sp.zone,
            "sector": sp.sector,
            "road_name": sp.road_name,
            "plot_area_sqm": float(sp.plot_area_sqm) if sp.plot_area_sqm is not None else None,
            "plot_area_sqft": float(sp.plot_area_sqft) if sp.plot_area_sqft is not None else None,
            "land_no": sp.land_no,
            "plot_address": sp.plot_address,
            "construction_status": sp.construction_status,
            "allocation_type": sp.allocation_type,
            "land_use": sp.land_use,
            "base_district": sp.base_district,
            "overlay_district": sp.overlay_district,
            "allocation_date": sp.allocation_date.isoformat() if sp.allocation_date else None,
        },
        "developer": {
            "developer_name": sp.developer_name,
            "project_no": sp.project_no,
            "project_name": sp.project_name,
        },
        "application": {
            "application_number": sp.application_number,
            "application_date": sp.application_date.isoformat() if sp.application_date else None,
            "application_file": sp.application_file.url if sp.application_file else None,
        },
        "owners": owners,
        "notes": sp.notes,
    }


def build_license_snapshot(lic: BuildingLicense):
    """لقطة ثابتة من الـ License تُحفظ داخل Contract.license_snapshot"""
    return {
        "license": {
            "license_type": lic.license_type,
            "project_no": lic.project_no,
            "license_no": lic.license_no,
            "issue_date": lic.issue_date.isoformat() if lic.issue_date else None,
            "last_issue_date": lic.last_issue_date.isoformat() if lic.last_issue_date else None,
            "expiry_date": lic.expiry_date.isoformat() if lic.expiry_date else None,
            "technical_decision_ref": lic.technical_decision_ref,
            "technical_decision_date": lic.technical_decision_date.isoformat() if lic.technical_decision_date else None,
            "license_notes": lic.license_notes,
            "building_license_file": lic.building_license_file.url if lic.building_license_file else None,
        },
        "land": {
            "city": lic.city,
            "zone": lic.zone,
            "sector": lic.sector,
            "plot_no": lic.plot_no,
            "plot_address": lic.plot_address,
            "plot_area_sqm": float(lic.plot_area_sqm) if lic.plot_area_sqm is not None else None,
            "land_use": lic.land_use,
            "land_use_sub": lic.land_use_sub,
            "land_plan_no": lic.land_plan_no,
        },
        "parties": {
            "consultant_name": lic.consultant_name,
            "consultant_license_no": lic.consultant_license_no,
            "contractor_name": lic.contractor_name,
            "contractor_license_no": lic.contractor_license_no,
        },
        "siteplan_snapshot": lic.siteplan_snapshot or {},
    }

# =========================
# Project
# =========================
class ProjectSerializer(serializers.ModelSerializer):
    has_siteplan = serializers.ReadOnlyField()
    has_license  = serializers.ReadOnlyField()
    completion   = serializers.ReadOnlyField()

    class Meta:
        model  = Project
        fields = [
            "id", "name",
            "project_type", "villa_category", "contract_type",
            "status", "has_siteplan", "has_license", "completion",
            "created_at", "updated_at",
        ]
        extra_kwargs = {
            "project_type": {"required": False},
            "villa_category": {"required": False},
            "contract_type": {"required": False},
        }

# =========================
# SitePlan + Owners
# =========================
class SitePlanOwnerSerializer(serializers.ModelSerializer):
    id_attachment = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = SitePlanOwner
        fields = [
            "id",
            "owner_name_ar", "owner_name_en",
            "nationality", "phone", "email",
            "id_number", "id_issue_date", "id_expiry_date", "id_attachment",
            "right_hold_type", "share_possession", "share_percent",
        ]


class SitePlanSerializer(serializers.ModelSerializer):
    owners = SitePlanOwnerSerializer(many=True, required=False)
    application_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = SitePlan
        fields = [
            "id", "project",
            # العقار
            "municipality", "zone", "sector", "road_name",
            "plot_area_sqm", "plot_area_sqft",
            "land_no", "plot_address",
            "construction_status", "allocation_type", "land_use",
            "base_district", "overlay_district",
            "allocation_date",
            # المطور
            "project_no", "project_name", "developer_name",
            # ملاحظات
            "notes",
            # المعاملة
            "application_number", "application_date", "application_file",
            # الملاك
            "owners",
            "created_at", "updated_at",
        ]
        read_only_fields = ["project", "created_at", "updated_at"]

    # ----- helpers -----
    _owner_allowed = {
        "owner_name_ar", "owner_name_en",
        "nationality", "phone", "email",
        "id_number", "id_issue_date", "id_expiry_date", "id_attachment",
        "right_hold_type", "share_possession", "share_percent",
    }
    _owners_key_re = re.compile(r"^owners\[(\d+)\]\[(\w+)\]$")

    @staticmethod
    def _normalize_owner(o: dict):
        """
        يطبع الاسم:
        - يدعم owner_name كـ alias.
        - يملأ الاسم الناقص من الآخر.
        """
        alias = (o.get("owner_name") or "").strip()
        ar = (o.get("owner_name_ar") or "").strip()
        en = (o.get("owner_name_en") or "").strip()
        if alias and not ar and not en:
            ar = en = alias
        if ar and not en:
            en = ar
        if en and not ar:
            ar = en

        c = {k: o.get(k) for k in SitePlanSerializer._owner_allowed if k in o}
        if ar:
            c["owner_name_ar"] = ar
        if en:
            c["owner_name_en"] = en
        # تنظيف share_percent الفارغ
        if "share_percent" in c and c["share_percent"] in ("", None):
            c["share_percent"] = None
        return c

    @staticmethod
    def _has_name(o: dict) -> bool:
        return bool((o.get("owner_name_ar") or "").strip() or (o.get("owner_name_en") or "").strip())

    def _extract_owners_from_request(self):
        """
        يدعم 3 أشكال للـ owners:
        1) list[dict] JSON عادي
        2) نص JSON داخل multipart: owners="[...]"
        3) مفاتيح مسطحة: owners[0][field]=... (اللي بيعملها الـ FormData)
        بالإضافة: يقبل owner_name كـ alias ويحوّله إلى AR/EN، ويملأ الاسم الناقص من الآخر.
        """
        req = self.context.get("request")
        if not req:
            return None

        data = req.data

        # (1) وصلت كقائمة فعلًا
        if isinstance(data.get("owners"), list):
            raw = data.get("owners")

        # (2) owners كسلسلة JSON
        elif isinstance(data.get("owners"), str):
            try:
                parsed = json.loads(data.get("owners"))
                raw = parsed if isinstance(parsed, list) else []
            except Exception:
                raw = []

        else:
            # (3) جمع المفاتيح المسطّحة owners[0][field]
            buckets = {}
            for k, v in data.items():
                m = self._owners_key_re.match(str(k))
                if not m:
                    continue
                idx = int(m.group(1))
                key = m.group(2)
                buckets.setdefault(idx, {})[key] = v
            raw = [buckets[i] for i in sorted(buckets.keys())] if buckets else None

        if raw is None:
            return None

        cleaned = []
        for o in raw:
            if not isinstance(o, dict):
                continue
            c = self._normalize_owner(o)
            if self._has_name(c):          # ← تجاهل الصفوف الفارغة
                cleaned.append(c)
        return cleaned

    # ----- validation (متسامحة لا توقف الحفظ) -----
    def validate(self, attrs):
        """
        تنظيف متسامح:
        - لو الملاك جايين داخل attrs (JSON) نطبّع ونفلتر الفارغين.
        - لو multipart هنقرأهم في create/update، فلا نرمي أخطاء هنا.
        - لا نرمي ValidationError علشان السيستم ما يعطّلش بسبب سطر فاضي.
        """
        owners_in_attrs = attrs.get("owners", None)
        if isinstance(owners_in_attrs, list):
            normalized = []
            for o in owners_in_attrs:
                c = self._normalize_owner(o or {})
                if self._has_name(c):
                    normalized.append(c)
            attrs["owners"] = normalized
        return attrs

    # ----- CRUD -----
    def create(self, validated_data):
        owners_data = validated_data.pop("owners", None)
        if owners_data is None:
            owners_data = self._extract_owners_from_request() or []

        # فلترة الملاك الفارغين
        owners_data = [od for od in owners_data if self._has_name(od)]

        siteplan = SitePlan.objects.create(**validated_data)
        for od in owners_data:
            SitePlanOwner.objects.create(siteplan=siteplan, **od)
        return siteplan

    def update(self, instance, validated_data):
        owners_data = validated_data.pop("owners", None)
        if owners_data is None:
            owners_data = self._extract_owners_from_request()

        # تحديث بقية الحقول
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # لو owners مبعوتين صراحة (حتى لو فاضي → امسح وأنشئ بعد الفلترة)
        if owners_data is not None:
            owners_data = [od for od in owners_data if self._has_name(od)]
            instance.owners.all().delete()
            for od in owners_data:
                SitePlanOwner.objects.create(siteplan=instance, **od)

        return instance

# =========================
# Building License
# =========================
class BuildingLicenseSerializer(serializers.ModelSerializer):
    building_license_file = serializers.FileField(required=False, allow_null=True)
    siteplan_snapshot     = serializers.JSONField(read_only=True)
    owners_names = serializers.SerializerMethodField()

    class Meta:
        model  = BuildingLicense
        fields = [
            "id", "project",
            "license_type", "project_no", "license_no",
            "issue_date", "last_issue_date", "expiry_date",
            "technical_decision_ref", "technical_decision_date", "license_notes",
            "building_license_file",
            "city", "zone", "sector", "plot_no", "plot_address",
            "plot_area_sqm", "land_use", "land_use_sub", "land_plan_no",
            "consultant_name", "consultant_license_no",
            "contractor_name", "contractor_license_no",
            "siteplan_snapshot", "owners_names",
            "created_at", "updated_at",
        ]
        read_only_fields = ["project", "siteplan_snapshot", "created_at", "updated_at"]

    def get_owners_names(self, obj):
        snap = obj.siteplan_snapshot or {}
        owners_data = snap.get("owners", [])
        result = []
        for o in owners_data:
            ar = (o.get("owner_name_ar") or "").strip()
            en = (o.get("owner_name_en") or "").strip()
            if ar or en:
                result.append({"ar": ar, "en": en})
        return result

    def validate(self, attrs):
        issue = attrs.get("issue_date") or getattr(self.instance, "issue_date", None)
        last  = attrs.get("last_issue_date") or getattr(self.instance, "last_issue_date", None)
        if issue and last and last < issue:
            raise serializers.ValidationError({"last_issue_date": "يجب أن يكون بعد/يساوي تاريخ الإصدار."})
        return attrs

    def create(self, validated_data):
        lic = BuildingLicense.objects.create(**validated_data)
        try:
            sp = lic.project.siteplan
        except SitePlan.DoesNotExist:
            sp = None
        if sp:
            lic.siteplan_snapshot = build_siteplan_snapshot(sp)
            lic.save(update_fields=["siteplan_snapshot"])
        return lic

    def update(self, instance, validated_data):
        # لا نلمس snapshot في التحديث
        return super().update(instance, validated_data)

# =========================
# Contract
# =========================
class ContractSerializer(serializers.ModelSerializer):
    # الفرونت يرسل owners للعرض فقط → نتجاهلها في التخزين
    owners = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    license_snapshot = serializers.JSONField(read_only=True)

    class Meta:
        model  = Contract
        fields = [
            "id", "project",
            # تصنيف ونوع
            "contract_classification", "contract_type",
            # تفاصيل
            "tender_no", "contract_date",
            # الأطراف
            "owners",  # write-only
            "contractor_name", "contractor_trade_license",
            # القيم والمدة
            "total_project_value", "total_bank_value", "total_owner_value", "project_duration_months",
            # أتعاب (المالك)
            "owner_includes_consultant", "owner_fee_design_percent", "owner_fee_supervision_percent",
            "owner_fee_extra_mode", "owner_fee_extra_value",
            # أتعاب (البنك)
            "bank_includes_consultant", "bank_fee_design_percent", "bank_fee_supervision_percent",
            "bank_fee_extra_mode", "bank_fee_extra_value",
            # اللقطة
            "license_snapshot",
            "created_at", "updated_at",
        ]
        read_only_fields = ["project", "license_snapshot", "created_at", "updated_at"]

    def validate(self, attrs):
        total = attrs.get("total_project_value") or getattr(self.instance, "total_project_value", None)
        bank  = attrs.get("total_bank_value")  or getattr(self.instance, "total_bank_value", 0)
        if total is not None and float(total) <= 0:
            raise serializers.ValidationError({"total_project_value": "يجب أن يكون أكبر من صفر."})
        if bank is not None and float(bank) < 0:
            raise serializers.ValidationError({"total_bank_value": "لا يمكن أن يكون سالبًا."})
        return attrs

    def _fill_snapshot(self, contract: Contract):
        try:
            lic = contract.project.license
        except BuildingLicense.DoesNotExist:
            return
        contract.license_snapshot = build_license_snapshot(lic)
        contract.save(update_fields=["license_snapshot"])

    def create(self, validated_data):
        validated_data.pop("owners", None)  # عرض فقط
        obj = Contract.objects.create(**validated_data)
        self._fill_snapshot(obj)
        return obj

    def update(self, instance, validated_data):
        validated_data.pop("owners", None)
        return super().update(instance, validated_data)

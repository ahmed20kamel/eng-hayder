from django.contrib import admin
from .models import Project, SitePlan, SitePlanOwner, BuildingLicense, Contract

# ---------- Project ----------
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "project_type", "status", "completion_pct", "created_at")
    list_filter = ("project_type", "status")
    search_fields = ("name",)

    def completion_pct(self, obj):
        # نحسبها من وجود SitePlan/License/Contract
        steps = 0
        done = 0
        for rel in ("siteplan", "license", "contract"):
            steps += 1
            if hasattr(obj, rel):
                done += 1
        pct = int(done / steps * 100) if steps else 0
        return f"{pct}%"
    completion_pct.short_description = "Completion"


# ---------- SitePlan ----------
class SitePlanOwnerInline(admin.TabularInline):
    model = SitePlanOwner
    extra = 0

@admin.register(SitePlan)
class SitePlanAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "municipality", "zone", "sector", "land_no", "plot_area_sqm", "created_at")
    list_filter = ("municipality", "zone", "sector")
    search_fields = ("project__name", "land_no", "plot_address")
    inlines = [SitePlanOwnerInline]


# ---------- BuildingLicense ----------
@admin.register(BuildingLicense)
class BuildingLicenseAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "license_no", "license_type", "issue_date", "contractor_name", "created_at")
    list_filter = ("license_type", "city", "zone", "sector")
    search_fields = ("license_no", "project__name", "contractor_name", "consultant_name")


# ---------- Contract ----------
@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "contract_type", "contract_date", "total_project_value", "created_at")
    list_filter = ("contract_type",)
    search_fields = ("project__name", "tender_no", "contractor_name")

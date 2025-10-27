from django.contrib import admin
from .models import Project, SitePlan, SitePlanOwner, BuildingLicense

class SitePlanOwnerInline(admin.TabularInline):
    model = SitePlanOwner
    extra = 0

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'type', 'status', 'completion', 'created_at')
    search_fields = ('name',)

@admin.register(SitePlan)
class SitePlanAdmin(admin.ModelAdmin):
    inlines = [SitePlanOwnerInline]
    list_display = ('project', 'municipality', 'zone', 'sector', 'plot_address')

@admin.register(BuildingLicense)
class BuildingLicenseAdmin(admin.ModelAdmin):
    list_display = ('project', 'license_no', 'issue_date', 'license_status')

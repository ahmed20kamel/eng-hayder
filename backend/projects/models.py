from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator

# ====== أساس timestamps ======
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ====== المشروع ======
class Project(TimeStampedModel):
    PROJECT_TYPE_CHOICES = [
        ('villa', 'Villa'),
        ('commercial', 'Commercial'),
        ('maintenance', 'Maintenance'),
        ('governmental', 'Governmental'),
        ('fitout', 'Fit-out / Renovation'),
    ]
    VILLA_CATEGORY_CHOICES = [
        ('residential', 'Residential Villa'),
        ('commercial', 'Commercial Villa'),
    ]
    CONTRACT_TYPE_CHOICES = [
        ('new', 'New Contract'),
        ('continue', 'Continuation Contract'),
    ]

    # ↓↓↓ السماح بإنشاء مشروع بدون اسم
    name = models.CharField(max_length=200, blank=True, default="")
    project_type = models.CharField(max_length=40, choices=PROJECT_TYPE_CHOICES, blank=True)
    villa_category = models.CharField(max_length=40, choices=VILLA_CATEGORY_CHOICES, blank=True)
    contract_type = models.CharField(max_length=40, choices=CONTRACT_TYPE_CHOICES, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
        ],
        default='draft',
    )

    # ✨ جديد: الكود الداخلي للمشروع — يبدأ بـ M ثم أرقام فردية فقط
    internal_code = models.CharField(
        max_length=40,
        blank=True,
        db_index=True,
        validators=[RegexValidator(
            regex=r"^M[13579]*$",
            message="Internal code must start with 'M' and contain odd digits only (1,3,5,7,9)."
        )],
        help_text="Starts with M, followed by odd digits only (1,3,5,7,9).",
    )

    def __str__(self):
        return self.name or f"Project #{self.id}"


# ====== مخطط الأرض ======
class SitePlan(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="siteplan")

    municipality = models.CharField(max_length=120, blank=True)
    zone = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=120, blank=True)
    road_name = models.CharField(max_length=120, blank=True)
    plot_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    plot_area_sqft = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    land_no = models.CharField(max_length=120, blank=True)
    plot_address = models.CharField(max_length=255, blank=True)
    construction_status = models.CharField(max_length=120, blank=True)
    allocation_type = models.CharField(max_length=120, blank=True)
    land_use = models.CharField(max_length=120, blank=True)
    base_district = models.CharField(max_length=120, blank=True)
    overlay_district = models.CharField(max_length=120, blank=True)
    allocation_date = models.DateField(null=True, blank=True)

    # Developer info (for investment)
    developer_name = models.CharField(max_length=200, blank=True)
    project_no = models.CharField(max_length=120, blank=True)
    project_name = models.CharField(max_length=200, blank=True)

    # Notes
    notes = models.TextField(blank=True)

    # Application / transaction info
    application_number = models.CharField(max_length=120, blank=True)
    application_date = models.DateField(null=True, blank=True)
    application_file = models.FileField(upload_to="siteplans/applications/", null=True, blank=True)

    def __str__(self):
        return f"SitePlan #{self.id} for {self.project.name or self.project_id}"


class SitePlanOwner(TimeStampedModel):
    siteplan = models.ForeignKey(SitePlan, on_delete=models.CASCADE, related_name="owners")
    owner_name_ar = models.CharField(max_length=200, blank=True)
    owner_name_en = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    id_number = models.CharField(max_length=50, blank=True)
    id_issue_date = models.DateField(null=True, blank=True)
    id_expiry_date = models.DateField(null=True, blank=True)
    id_attachment = models.FileField(upload_to="owners/ids/", null=True, blank=True)
    right_hold_type = models.CharField(max_length=120, blank=True, default="Ownership")
    share_possession = models.CharField(max_length=120, blank=True)
    share_percent = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)], default=100
    )

    def __str__(self):
        return self.owner_name_ar or self.owner_name_en or "Unnamed Owner"


# ====== ترخيص البناء ======
class BuildingLicense(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="license")

    # General license data
    license_type = models.CharField(max_length=120, blank=True)

    # (المطور) سنابشوت من الـ SitePlan
    project_no = models.CharField(max_length=120, blank=True)
    project_name = models.CharField(max_length=200, blank=True)  # ✨ جديد

    # (الرخصة) الحقلان الجداد
    license_project_no = models.CharField(max_length=120, blank=True)     # ✨ جديد
    license_project_name = models.CharField(max_length=200, blank=True)   # ✨ جديد

    license_no = models.CharField(max_length=120, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    last_issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    technical_decision_ref = models.CharField(max_length=120, blank=True)
    technical_decision_date = models.DateField(null=True, blank=True)
    license_notes = models.TextField(blank=True)
    building_license_file = models.FileField(upload_to="licenses/", null=True, blank=True)

    # Plot / land data
    city = models.CharField(max_length=120, blank=True)
    zone = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=120, blank=True)
    plot_no = models.CharField(max_length=120, blank=True)
    plot_address = models.CharField(max_length=255, blank=True)
    plot_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    land_use = models.CharField(max_length=120, blank=True)
    land_use_sub = models.CharField(max_length=120, blank=True)
    land_plan_no = models.CharField(max_length=120, blank=True)

    # Parties
    consultant_name = models.CharField(max_length=200, blank=True)
    consultant_license_no = models.CharField(max_length=120, blank=True)
    contractor_name = models.CharField(max_length=200, blank=True)
    contractor_license_no = models.CharField(max_length=120, blank=True)

    # Owners snapshot داخل الرخصة
    owners = models.JSONField(default=list, blank=True)  # ✨ جديد

    # Read-only snapshot من SitePlan
    siteplan_snapshot = models.JSONField(default=dict, editable=False)

    def __str__(self):
        return f"Building License {self.license_no or self.id}"


# ====== العقد ======
class Contract(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="contract")

    contract_classification = models.CharField(max_length=120, blank=True)
    contract_type = models.CharField(max_length=120, blank=True)
    tender_no = models.CharField(max_length=120, blank=True)
    contract_date = models.DateField(null=True, blank=True)
    contractor_name = models.CharField(max_length=200, blank=True)
    contractor_trade_license = models.CharField(max_length=120, blank=True)

    total_project_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    total_bank_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    total_owner_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    project_duration_months = models.PositiveIntegerField(default=0)

    # Owner consultant fees
    owner_includes_consultant = models.BooleanField(default=False)
    owner_fee_design_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    owner_fee_supervision_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    owner_fee_extra_mode = models.CharField(max_length=40, blank=True)
    owner_fee_extra_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)

    # Bank consultant fees
    bank_includes_consultant = models.BooleanField(default=False)
    bank_fee_design_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bank_fee_supervision_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bank_fee_extra_mode = models.CharField(max_length=40, blank=True)
    bank_fee_extra_value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)

    # Read-only snapshot من License
    license_snapshot = models.JSONField(default=dict, editable=False)

    def __str__(self):
        return f"Contract for {self.project.name or self.project_id}"

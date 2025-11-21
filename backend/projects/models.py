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

    # الكود الداخلي للمشروع — يبدأ بـ M ثم أرقام، مع شرط أن يكون آخر رقم فردياً
    internal_code = models.CharField(
        max_length=40,
        blank=True,
        db_index=True,
        validators=[RegexValidator(
            # M ثم أرقام، وآخر رقم فردي (يسمح بوجود أرقام زوجية في المنتصف)
            regex=r"^M[0-9]*[13579]$",
            message="Internal code must start with 'M' and end with an odd digit (1,3,5,7,9)."
        )],
        help_text="Starts with M, digits allowed, last digit must be odd (1,3,5,7,9).",
    )

    def __str__(self):
        return self.name or f"Project #{self.id}"

    # Properties للـ serializer
    @property
    def has_siteplan(self):
        """تحقق من وجود SitePlan للمشروع"""
        # ✅ التحقق من وجود related object
        if not hasattr(self, '_state') or self._state.adding or not self.pk:
            # ✅ إذا كان المشروع جديداً (لم يُحفظ بعد)، نرجع False
            return False
        # ✅ استخدام query مباشر لتجنب DoesNotExist exception
        return SitePlan.objects.filter(project_id=self.pk).exists()

    @property
    def has_license(self):
        """تحقق من وجود BuildingLicense للمشروع"""
        # ✅ التحقق من وجود related object
        if not hasattr(self, '_state') or self._state.adding or not self.pk:
            # ✅ إذا كان المشروع جديداً (لم يُحفظ بعد)، نرجع False
            return False
        # ✅ استخدام query مباشر لتجنب DoesNotExist exception
        return BuildingLicense.objects.filter(project_id=self.pk).exists()

    @property
    def completion(self):
        """نسبة إكمال المشروع بناءً على الخطوات المكتملة"""
        if not hasattr(self, '_state') or self._state.adding or not self.pk:
            return 0
        completed = 0
        if self.has_siteplan:
            completed += 1
        if self.has_license:
            completed += 1
        if Contract.objects.filter(project_id=self.pk).exists():
            completed += 1
        return int((completed / 3) * 100) if completed > 0 else 0


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
    project_name = models.CharField(max_length=200, blank=True)

    # (الرخصة) الحقلان الجديدان
    license_project_no = models.CharField(max_length=120, blank=True)
    license_project_name = models.CharField(max_length=200, blank=True)

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
    # ===== استشاري التصميم / الإشراف =====
    consultant_same = models.BooleanField(default=True)

    # استشاري التصميم
    design_consultant_name = models.CharField(max_length=200, blank=True)
    design_consultant_license_no = models.CharField(max_length=120, blank=True)

    # استشاري الإشراف
    supervision_consultant_name = models.CharField(max_length=200, blank=True)
    supervision_consultant_license_no = models.CharField(max_length=120, blank=True)

    contractor_name = models.CharField(max_length=200, blank=True)
    contractor_license_no = models.CharField(max_length=120, blank=True)

    # Owners snapshot داخل الرخصة
    owners = models.JSONField(default=list, blank=True)

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

    start_order_date = models.DateField(null=True, blank=True)
    project_end_date = models.DateField(null=True, blank=True)

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

    # Snapshot
    license_snapshot = models.JSONField(default=dict, editable=False)

    # الملفات
    contract_file = models.FileField(upload_to="contracts/main/", null=True, blank=True)
    contract_appendix_file = models.FileField(upload_to="contracts/appendix/", null=True, blank=True)
    contract_explanation_file = models.FileField(upload_to="contracts/explanations/", null=True, blank=True)
    start_order_file = models.FileField(upload_to="contracts/start_orders/", null=True, blank=True)

    def __str__(self):
        return f"Contract for {self.project.name or self.project_id}"



# ====== أمر الترسية ======
class Awarding(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name="awarding")

    # تاريخ أمر الترسية
    award_date = models.DateField(null=True, blank=True)
    
    # رقم تسجيل الاستشاري (VR-xxxx)
    consultant_registration_number = models.CharField(max_length=120, blank=True)
    
    # رقم المشروع
    project_number = models.CharField(max_length=120, blank=True)
    
    # رقم تسجيل المقاول (VR-xxxx)
    contractor_registration_number = models.CharField(max_length=120, blank=True)
    
    # ملف أمر الترسية
    awarding_file = models.FileField(upload_to="awarding/", null=True, blank=True)

    def __str__(self):
        return f"Awarding for {self.project.name or self.project_id}"

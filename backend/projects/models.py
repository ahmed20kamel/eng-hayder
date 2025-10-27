from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Project(TimeStampedModel):
    class ProjectType(models.TextChoices):
        RESIDENTIAL = 'residential', 'Residential'
        COMMERCIAL = 'commercial', 'Commercial'
        MIXED = 'mixed', 'Mixed'

    class ProjectStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=ProjectType.choices, default=ProjectType.RESIDENTIAL)
    status = models.CharField(max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.DRAFT)

    def __str__(self):
        return self.name

    @property
    def has_siteplan(self) -> bool:
        return hasattr(self, 'siteplan')

    @property
    def has_license(self) -> bool:
        return hasattr(self, 'license')

    @property
    def completion(self) -> int:
        """نسبة اكتمال سريعة على حسب المراحل المتاحة."""
        steps = [self.has_siteplan, self.has_license]
        return int(sum(1 for s in steps if s) / len(steps) * 100) if steps else 0


class SitePlan(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='siteplan')

    municipality = models.CharField(max_length=120, blank=True)
    zone = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=120, blank=True)
    road_name = models.CharField(max_length=120, blank=True)

    plot_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    plot_area_sqft = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    land_no = models.CharField(max_length=120, blank=True)
    plot_address = models.CharField(max_length=120, blank=True)

    construction_status = models.CharField(max_length=120, blank=True)
    allocation_type = models.CharField(max_length=120, blank=True)
    land_use = models.CharField(max_length=200, blank=True)
    base_district = models.CharField(max_length=200, blank=True)
    overlay_district = models.CharField(max_length=200, blank=True)

    allocation_date = models.DateField(null=True, blank=True)
    project_no = models.CharField(max_length=120, blank=True)
    project_name = models.CharField(max_length=200, blank=True)
    developer_name = models.CharField(max_length=200, blank=True)

    notes = models.TextField(blank=True)
    application_number = models.CharField(max_length=120, blank=True)
    application_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"SitePlan for {self.project_id}"


class SitePlanOwner(TimeStampedModel):
    siteplan = models.ForeignKey(SitePlan, on_delete=models.CASCADE, related_name='owners')
    owner_name = models.CharField(max_length=200)
    nationality = models.CharField(max_length=120, blank=True)
    right_hold_type = models.CharField(max_length=120, blank=True)  # Ownership...
    share_and_acquisition = models.CharField(max_length=120, blank=True)  # Allotment 100% / Release...

    def __str__(self):
        return self.owner_name


class BuildingLicense(TimeStampedModel):
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='license')

    # License details
    license_no = models.CharField(max_length=120)
    license_file_ref = models.CharField(max_length=120, blank=True)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    license_stage_or_worktype = models.CharField(max_length=120, blank=True)
    license_status = models.CharField(max_length=60, blank=True)
    project_description = models.CharField(max_length=300, blank=True)

    # Plot / land
    city = models.CharField(max_length=120, blank=True)
    zone = models.CharField(max_length=120, blank=True)
    sector = models.CharField(max_length=120, blank=True)
    plot_no = models.CharField(max_length=120, blank=True)
    plot_address = models.CharField(max_length=120, blank=True)
    plot_area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Parties
    owner_name = models.CharField(max_length=200, blank=True)
    consultant_name = models.CharField(max_length=200, blank=True)
    consultant_license_no = models.CharField(max_length=120, blank=True)
    contractor_name = models.CharField(max_length=200, blank=True)
    contractor_license_no = models.CharField(max_length=120, blank=True)

    # Technical
    technical_decision_ref = models.CharField(max_length=120, blank=True)
    technical_decision_date = models.DateField(null=True, blank=True)
    license_notes = models.TextField(blank=True)

    def __str__(self):
        return f"License {self.license_no}"

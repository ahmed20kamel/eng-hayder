from rest_framework import serializers
from .models import Project, SitePlan, SitePlanOwner, BuildingLicense


class SitePlanOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SitePlanOwner
        fields = ['id', 'owner_name', 'nationality', 'right_hold_type', 'share_and_acquisition']


class SitePlanSerializer(serializers.ModelSerializer):
    owners = SitePlanOwnerSerializer(many=True, required=False)

    class Meta:
        model = SitePlan
        fields = [
            'id', 'project',
            'municipality', 'zone', 'sector', 'road_name',
            'plot_area_sqm', 'plot_area_sqft',
            'land_no', 'plot_address',
            'construction_status', 'allocation_type', 'land_use',
            'base_district', 'overlay_district',
            'allocation_date', 'project_no', 'project_name', 'developer_name',
            'notes', 'application_number', 'application_date',
            'owners',
        ]
        read_only_fields = ['project']  # هنعينها من الـ URL

    def create(self, validated_data):
        owners_data = validated_data.pop('owners', [])
        siteplan = SitePlan.objects.create(**validated_data)
        for od in owners_data:
            SitePlanOwner.objects.create(siteplan=siteplan, **od)
        return siteplan

    def update(self, instance, validated_data):
        owners_data = validated_data.pop('owners', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if owners_data is not None:
            instance.owners.all().delete()
            for od in owners_data:
                SitePlanOwner.objects.create(siteplan=instance, **od)
        return instance


class BuildingLicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingLicense
        fields = '__all__'
        read_only_fields = ['project']


class ProjectSerializer(serializers.ModelSerializer):
    has_siteplan = serializers.ReadOnlyField()
    has_license = serializers.ReadOnlyField()
    completion = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'type', 'status', 'has_siteplan', 'has_license', 'completion', 'created_at', 'updated_at']

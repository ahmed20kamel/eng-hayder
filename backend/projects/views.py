from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Project, SitePlan, BuildingLicense
from .serializers import (
    ProjectSerializer, SitePlanSerializer, BuildingLicenseSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer


class SitePlanViewSet(viewsets.ModelViewSet):
    serializer_class = SitePlanSerializer

    def get_queryset(self):
        return SitePlan.objects.filter(project_id=self.kwargs['project_pk'])

    def perform_create(self, serializer):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        serializer.save(project=project)


class BuildingLicenseViewSet(viewsets.ModelViewSet):
    serializer_class = BuildingLicenseSerializer

    def get_queryset(self):
        return BuildingLicense.objects.filter(project_id=self.kwargs['project_pk'])

    def perform_create(self, serializer):
        project = get_object_or_404(Project, pk=self.kwargs['project_pk'])
        serializer.save(project=project)

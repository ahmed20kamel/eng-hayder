from django.urls import path
from .views import ProjectViewSet, SitePlanViewSet, BuildingLicenseViewSet

# نعرّف الواجهات يدويًا بدون أي باكدج إضافية

project_list = ProjectViewSet.as_view({'get': 'list', 'post': 'create'})
project_detail = ProjectViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})

siteplan_list = SitePlanViewSet.as_view({'get': 'list', 'post': 'create'})
siteplan_detail = SitePlanViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})

license_list = BuildingLicenseViewSet.as_view({'get': 'list', 'post': 'create'})
license_detail = BuildingLicenseViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = [
    path('projects/', project_list, name='project-list'),
    path('projects/<int:pk>/', project_detail, name='project-detail'),

    path('projects/<int:project_pk>/siteplan/', siteplan_list, name='siteplan-list'),
    path('projects/<int:project_pk>/siteplan/<int:pk>/', siteplan_detail, name='siteplan-detail'),

    path('projects/<int:project_pk>/license/', license_list, name='license-list'),
    path('projects/<int:project_pk>/license/<int:pk>/', license_detail, name='license-detail'),
]

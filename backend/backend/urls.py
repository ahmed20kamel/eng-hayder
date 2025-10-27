# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.generic import RedirectView
import os

# اختياري: لو حددت FRONTEND_URL كمتغير بيئة (في Render) سيحوِّل الجذر إليه
FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()  # مثال: https://eng-hayder-frontend.onrender.com/

def healthz(_):
    return JsonResponse({"status": "ok"})

urlpatterns = []

# تحويل الجذر للفرونت فقط لو FRONTEND_URL موجود
if FRONTEND_URL:
    urlpatterns.append(path("", RedirectView.as_view(url=FRONTEND_URL, permanent=False)))
else:
    # لو ما فيش FRONTEND_URL، خليه يرجّع JSON بسيط بدل 404
    urlpatterns.append(path("", lambda r: JsonResponse({"detail": "backend ok", "set_FRONTEND_URL_to_redirect": True})))

urlpatterns += [
    path("healthz/", healthz),
    path("admin/", admin.site.urls),
    path("api/", include("projects.urls")),  # API كما هو
]

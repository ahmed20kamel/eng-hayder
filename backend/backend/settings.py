from pathlib import Path
import os

# =========================
# Paths & Base
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent

# =========================
# Security (تطوير فقط)
# =========================
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-prod')
DEBUG = True

# أثناء التطوير يمكنك السماح للجميع، أو حدد عناوينك:
ALLOWED_HOSTS = ["*", "localhost", "127.0.0.1", "192.168.1.26"]

# =========================
# Applications
# =========================
INSTALLED_APPS = [
    # Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'corsheaders',

    # Local apps
    'projects',
]

# =========================
# Middleware (ترتيب مهم)
# =========================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    # ضع CorsMiddleware قبل CommonMiddleware وCsrfViewMiddleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =========================
# URLs / WSGI / ASGI
# =========================
ROOT_URLCONF = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

# =========================
# Templates
# =========================
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],   # مجلد قوالب اختياري
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]

# =========================
# Database (تطوير)
# =========================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []  # للتطوير فقط

# =========================
# I18N / TZ
# =========================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dubai'
USE_I18N = True
USE_TZ = True

# =========================
# Static & Media (تطوير)
# =========================
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []
STATIC_ROOT = BASE_DIR / 'staticfiles'  # مفيد عند الجمع

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =========================
# Django REST Framework
# =========================
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
    # أضف Auth/Permissions لاحقًا حسب الحاجة
}

# =========================
# CORS / CSRF للتطوير عبر الشبكة
# =========================
# إذا تريد السماح للجميع أثناء التطوير:
CORS_ALLOW_ALL_ORIGINS = True

# لو احتجت تحديد أصول معيّنة بدلاً من السماح للجميع، علّق السطر أعلاه
# واستخدم التالي وعدّل IP ومنفذ Vite حسب جهازك:
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:5174",
#     "http://127.0.0.1:5174",
#     "http://192.168.1.26:5174",
# ]

# لو تستخدم Cookies/Session من الواجهة الأمامية:
CORS_ALLOW_CREDENTIALS = True

# لحماية CSRF، يجب تحديد الأصول الموثوقة عند POST من Origin مختلف.
# لا توجد Wildcards لعناوين IP، لذا حدّدها صراحةً، وعدّل IP عند تغيّره.
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://192.168.1.26:5174",
]

# =========================
# Cookies للتطوير
# =========================
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# =========================
# Logging (اختياري لكنه مفيد)
# =========================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {'format': '[{levelname}] {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'simple'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

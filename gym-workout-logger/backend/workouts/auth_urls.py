"""URL routes for authentication endpoints."""

from django.urls import include, path

from . import views

app_name = "auth"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("user/", views.CurrentUserView.as_view(), name="user"),
]

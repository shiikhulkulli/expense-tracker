
from django.urls import path

from .views import (
    CategoryListCreateView,
    TransactionListCreateView,
    TransactionDetailView,
    csrf_token_view,
    login_view,
    logout_view,
)

urlpatterns = [
    path("csrf/", csrf_token_view, name="csrf-token"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path(
        "categories/",
        CategoryListCreateView.as_view(),
        name="category-list-create",
    ),
    path(
        "transactions/",
        TransactionListCreateView.as_view(),
        name="transaction-list-create",
    ),
    path(
        "transactions/<int:pk>/",
        TransactionDetailView.as_view(),
        name="transaction-detail",
    ),
]

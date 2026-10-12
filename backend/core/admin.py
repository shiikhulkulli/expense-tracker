
from django.contrib import admin
from .models import Category, Transaction


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "user", "created_at")
    list_filter = ("type", "created_at")
    search_fields = ("name", "user__username")


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("type", "amount", "category", "user", "date")
    list_filter = ("type", "date", "category")
    search_fields = ("description", "user__username")
    date_hierarchy = "date"

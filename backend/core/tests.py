# from django.test import TestCase

# Create your tests here.



from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Transaction


User = get_user_model()


class ExpenseTrackerAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="expense_test_user",
            password="TestPassword123!",
        )
        self.other_user = User.objects.create_user(
            username="other_test_user",
            password="OtherPassword123!",
        )

        self.food = Category.objects.create(
            user=self.user,
            name="Food",
            type="expense",
        )
        self.salary = Category.objects.create(
            user=self.user,
            name="Salary",
            type="income",
        )
        self.other_category = Category.objects.create(
            user=self.other_user,
            name="Private Category",
            type="expense",
        )

        self.transaction = Transaction.objects.create(
            user=self.user,
            category=self.food,
            type="expense",
            amount=Decimal("25.00"),
            description="Test lunch",
            date=date(2026, 10, 1),
        )

        self.client.force_authenticate(user=self.user)

    def test_categories_require_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/categories/")

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_user_sees_only_own_categories(self):
        response = self.client.get("/api/categories/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertIn(self.food.id, returned_ids)
        self.assertIn(self.salary.id, returned_ids)
        self.assertNotIn(self.other_category.id, returned_ids)

    def test_user_cannot_view_another_users_category(self):
        response = self.client.get(
            f"/api/categories/{self.other_category.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_duplicate_category_is_rejected(self):
        response = self.client.post(
            "/api/categories/",
            {
                "name": "food",
                "type": "expense",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertFalse(
            Category.objects.filter(
                user=self.user,
                name__iexact="food",
                type="expense",
            ).count() > 1
        )

    def test_user_sees_only_own_transactions(self):
        response = self.client.get("/api/transactions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {
            item["id"] for item in response.data
        }

        self.assertIn(self.transaction.id, returned_ids)
        self.assertFalse(
            Transaction.objects.filter(
                user=self.other_user
            ).exists()
        )

    def test_user_cannot_view_another_users_transaction(self):
        other_transaction = Transaction.objects.create(
            user=self.other_user,
            category=self.other_category,
            type="expense",
            amount=Decimal("40.00"),
            description="Private transaction",
            date=date(2026, 10, 2),
        )

        response = self.client.get(
            f"/api/transactions/{other_transaction.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_transaction_rejects_another_users_category(self):
        response = self.client.post(
            "/api/transactions/",
            {
                "category": self.other_category.id,
                "type": "expense",
                "amount": "10.00",
                "description": "Invalid category test",
                "date": "2026-10-03",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_transaction_rejects_category_type_mismatch(self):
        response = self.client.post(
            "/api/transactions/",
            {
                "category": self.food.id,
                "type": "income",
                "amount": "10.00",
                "description": "Type mismatch test",
                "date": "2026-10-03",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_category_with_transactions_cannot_be_deleted(self):
        response = self.client.delete(
            f"/api/categories/{self.food.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertTrue(
            Category.objects.filter(id=self.food.id).exists()
        )

    def test_user_cannot_delete_another_users_transaction(self):
        other_transaction = Transaction.objects.create(
            user=self.other_user,
            category=self.other_category,
            type="expense",
            amount=Decimal("40.00"),
            description="Private transaction",
            date=date(2026, 10, 2),
        )

        response = self.client.delete(
            f"/api/transactions/{other_transaction.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertTrue(
            Transaction.objects.filter(
                id=other_transaction.id
            ).exists()
        )

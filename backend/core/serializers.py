
from rest_framework import serializers

from .models import Category, Transaction



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "type",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return value

        category_type = self.initial_data.get("type")

        queryset = Category.objects.filter(
            user=request.user,
            name__iexact=value.strip(),
            type=category_type,
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "You already have a category with this name and type."
            )

        return value.strip()


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.none()
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "category",
            "category_name",
            "type",
            "amount",
            "description",
            "date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            fields["category"].queryset = Category.objects.filter(
                user=request.user
            )

        return fields

    def validate(self, attrs):
        category = attrs.get(
            "category",
            getattr(self.instance, "category", None),
        )
        transaction_type = attrs.get(
            "type",
            getattr(self.instance, "type", None),
        )

        if category and transaction_type and category.type != transaction_type:
            raise serializers.ValidationError({
                "category": "The category type must match the transaction type."
            })

        return attrs


# Admin@12345
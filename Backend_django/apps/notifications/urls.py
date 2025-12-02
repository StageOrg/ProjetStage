from django.urls import path
from .apiView import (
    MyNotificationsAPIView,
    MarkNotificationAsReadAPIView,
    MarkAllNotificationsAsReadAPIView,
    SendNotificationAPIView,
    SendNotificationToManyAPIView,
    UnreadNotificationCountAPIView
)

urlpatterns = [
    path("mes-notifications/", MyNotificationsAPIView.as_view()),
    path("mark-as-read/<int:notif_id>/", MarkNotificationAsReadAPIView.as_view()),
    path("mark-all-as-read/", MarkAllNotificationsAsReadAPIView.as_view()),
    path("unread-count/", UnreadNotificationCountAPIView.as_view()),
    path("send-notification/", SendNotificationAPIView.as_view()),
    path("send-many-notifications/", SendNotificationToManyAPIView.as_view()),
]

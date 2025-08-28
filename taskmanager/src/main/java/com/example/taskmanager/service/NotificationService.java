package com.example.taskmanager.service;

import com.example.taskmanager.model.Event;
import com.example.taskmanager.model.Notification;
import com.example.taskmanager.repository.EventRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private final EventRepository eventRepository;

    public NotificationService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<Notification> getPendingNotifications(Long userId) {
        List<Event> userEvents = eventRepository.findByUserId(userId);
        List<Notification> notifications = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Event event : userEvents) {
            // 🔔 За 5 минут до события
            if (isFiveMinutesBefore(event, now)) {
                notifications.add(createNotification(event, "FIVE_MINUTES_BEFORE",
                        "🔔 Скоро событие",
                        event.getTitle() + " начнется через 5 минут"));
            }

            // ⏰ В момент события (±1 минута)
            if (isEventStartingNow(event, now)) {
                notifications.add(createNotification(event, "EVENT_STARTED",
                        "⏰ Событие началось!",
                        event.getTitle() + " начинается сейчас"));
            }

            // ⚠️ Просроченное событие (10+ минут назад)
            if (isEventExpired(event, now)) {
                notifications.add(createNotification(event, "EVENT_EXPIRED",
                        "⚠️ Событие просрочено",
                        event.getTitle() + " должно было начаться " + formatDateTime(event.getEventTime())));
            }
        }

        return notifications;
    }

    private boolean isFiveMinutesBefore(Event event, LocalDateTime now) {
        LocalDateTime fiveMinutesBefore = event.getEventTime().minusMinutes(5);
        LocalDateTime eventTime = event.getEventTime();
        return now.isAfter(fiveMinutesBefore) && now.isBefore(eventTime);
    }

    private boolean isEventStartingNow(Event event, LocalDateTime now) {
        LocalDateTime oneMinuteBefore = event.getEventTime().minusMinutes(1);
        LocalDateTime oneMinuteAfter = event.getEventTime().plusMinutes(1);
        return now.isAfter(oneMinuteBefore) && now.isBefore(oneMinuteAfter);
    }

    private boolean isEventExpired(Event event, LocalDateTime now) {
        LocalDateTime tenMinutesAfter = event.getEventTime().plusMinutes(10);
        return now.isAfter(tenMinutesAfter) && now.isBefore(event.getEventTime().plusDays(1));
    }

    private Notification createNotification(Event event, String type, String title, String message) {
        Notification notification = new Notification();
        notification.setEventId(event.getId());
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setEventTime(event.getEventTime());
        return notification;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.toString(); // Можно улучшить форматирование
    }
}
package com.example.taskmanager.service;

import com.example.taskmanager.model.Event;
import com.example.taskmanager.repository.EventRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;


@Service
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public List<Event> getUserEvents(Long userId) {
        return eventRepository.findByUserId(userId);
    }

    public List<Event> getUpcomingEvents(Long userId) {
        return eventRepository.findUpcomingEvents(userId, LocalDateTime.now());
    }

    public boolean deleteEvent(Long id) {
        return eventRepository.deleteById(id) > 0;
    }
}


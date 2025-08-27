package com.example.taskmanager.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;


@Getter
@Setter
public class Event {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime eventTime;
    private Long userId;

    public Event() {}

    public Event(Long id, String title, String description, LocalDateTime eventTime, Long userId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.eventTime = eventTime;
        this.userId = userId;
    }
}
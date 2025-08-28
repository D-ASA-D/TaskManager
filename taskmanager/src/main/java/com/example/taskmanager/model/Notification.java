package com.example.taskmanager.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class Notification {
    private Long eventId;
    private String type;
    private String title;
    private String message;
    private LocalDateTime eventTime;
}
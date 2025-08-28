package com.example.taskmanager.repository;

import com.example.taskmanager.model.Event;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class EventRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Event> eventRowMapper = (rs, rowNum) -> {
        Event event = new Event();
        event.setId(rs.getLong("id"));
        event.setTitle(rs.getString("title"));
        event.setDescription(rs.getString("description"));
        event.setEventTime(rs.getTimestamp("event_time").toLocalDateTime());
        event.setUserId(rs.getLong("user_id"));
        return event;
    };

    public EventRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Event save(Event event) {
        String sql = "INSERT INTO events (title, description, event_time, user_id) VALUES (?, ?, ?, ?) RETURNING id";
        Long id = jdbcTemplate.queryForObject(sql, Long.class,
                event.getTitle(),
                event.getDescription(),
                event.getEventTime(),
                event.getUserId());
        event.setId(id);
        return event;
    }

    public Event findById(Long id) {
        String sql = "SELECT * FROM events WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, eventRowMapper, id);
    }

    public List<Event> findByUserId(Long userId) {
        String sql = "SELECT * FROM events WHERE user_id = ? ORDER BY event_time";
        return jdbcTemplate.query(sql, eventRowMapper, userId);
    }

    public List<Event> findUpcomingEvents(Long userId, LocalDateTime from) {
        String sql = "SELECT * FROM events WHERE user_id = ? AND event_time >= ? ORDER BY event_time";
        return jdbcTemplate.query(sql, eventRowMapper, userId, from);
    }

    public int update(Event event) {
        String sql = "UPDATE events SET title = ?, description = ?, event_time = ?, user_id = ? WHERE id = ?";
        return jdbcTemplate.update(sql,
                event.getTitle(),
                event.getDescription(),
                event.getEventTime(),
                event.getUserId(),
                event.getId());
    }

    public int deleteById(Long id) {
        String sql = "DELETE FROM events WHERE id = ?";
        return jdbcTemplate.update(sql, id);
    }
}
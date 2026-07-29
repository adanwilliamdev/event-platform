package com.eventplatform.repository;

import com.eventplatform.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByOrganizerId(String organizerId);
    
    @Query("SELECT e FROM Event e WHERE e.date > :now ORDER BY e.date ASC")
    List<Event> findUpcomingEvents(@Param("now") LocalDateTime now);
}

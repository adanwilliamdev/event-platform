package com.eventplatform.repository;

import com.eventplatform.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    Optional<Order> findByStripePaymentIntent(String paymentIntentId);
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
}

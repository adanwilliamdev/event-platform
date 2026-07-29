package com.eventplatform.dto;

import com.eventplatform.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String orderId;
    private BigDecimal totalAmount;
    private String paymentIntentId;
    private String clientSecret;
    private OrderStatus status;
}

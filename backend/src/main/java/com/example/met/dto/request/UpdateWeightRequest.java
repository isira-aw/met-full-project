package com.example.met.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWeightRequest {

    @NotNull(message = "Weight limit is required")
    @Min(value = 1, message = "Weight limit must be at least 1")
    @Max(value = 10, message = "Weight limit must be at most 10")
    private Integer weightLimit;
}

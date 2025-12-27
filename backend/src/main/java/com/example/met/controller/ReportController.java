package com.example.met.controller;

import com.example.met.dto.request.OTTimeReportRequest;
import com.example.met.dto.request.EmployeeTimeReportRequest;
import com.example.met.dto.response.OTTimeReportResponse;
import com.example.met.dto.response.EmployeeTimeReportResponse;
import com.example.met.service.ReportService;
import com.example.met.service.OTTimeCalculatorService;
import com.example.met.service.PdfGeneratorService;
import com.itextpdf.text.DocumentException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/reports")
@Slf4j
public class ReportController {

    private final ReportService reportService;
    private final OTTimeCalculatorService otTimeCalculatorService;
    private final PdfGeneratorService pdfGeneratorService;

    public ReportController(ReportService reportService,
                           OTTimeCalculatorService otTimeCalculatorService,
                           PdfGeneratorService pdfGeneratorService) {
        this.reportService = reportService;
        this.otTimeCalculatorService = otTimeCalculatorService;
        this.pdfGeneratorService = pdfGeneratorService;
    }

    @PostMapping("/employee-time-report")
    public ResponseEntity<EmployeeTimeReportResponse> generateEmployeeTimeReport(
            @Valid @RequestBody EmployeeTimeReportRequest request) {
        try {
            log.info("Generating time report for employee: {} from {} to {}",
                    request.getEmployeeEmail(), request.getStartDate(), request.getEndDate());

            EmployeeTimeReportResponse report = reportService.generateEmployeeTimeReport(request);

            log.info("Successfully generated report for employee: {} with {} job cards",
                    request.getEmployeeEmail(), report.getJobCards().size());

            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for time report: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error generating time report for employee: {}", request.getEmployeeEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/employee-ot-report")
    public ResponseEntity<OTTimeReportResponse> generateOTTimeReport(
            @Valid @RequestBody OTTimeReportRequest request) {
        try {
            log.info("Generating OT time report for employee: {} from {} to {}",
                    request.getEmployeeEmail(), request.getStartDate(), request.getEndDate());

            OTTimeReportResponse report = otTimeCalculatorService.generateOTTimeReport(request);

            log.info("Successfully generated OT report for employee: {} with {} records",
                    request.getEmployeeEmail(), report.getOtRecords().size());

            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for OT time report: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error generating OT time report for employee: {}", request.getEmployeeEmail(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Download Employee Time Tracking Report as PDF.
     * ADMIN only endpoint.
     *
     * @param request Report request parameters
     * @return PDF file as byte array
     */
    @PostMapping("/employee-time-report/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadEmployeeTimeReportPdf(
            @Valid @RequestBody EmployeeTimeReportRequest request) {
        try {
            log.info("Generating PDF for employee time report: {} from {} to {}",
                    request.getEmployeeEmail(), request.getStartDate(), request.getEndDate());

            // Generate report data
            EmployeeTimeReportResponse report = reportService.generateEmployeeTimeReport(request);

            // Generate PDF
            byte[] pdfBytes = pdfGeneratorService.generateEmployeeTimeReportPdf(report);

            // Create filename with timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("time-report_%s_%s.pdf",
                    sanitizeFilename(report.getEmployeeEmail()),
                    timestamp);

            // Set response headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            log.info("Successfully generated PDF for employee time report: {}, size: {} bytes",
                    request.getEmployeeEmail(), pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (DocumentException e) {
            log.error("Error generating PDF document for employee: {}", request.getEmployeeEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for PDF time report: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error generating PDF for employee time report: {}", request.getEmployeeEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download Employee Overtime Report as PDF.
     * ADMIN only endpoint.
     *
     * @param request Report request parameters
     * @return PDF file as byte array
     */
    @PostMapping("/employee-ot-report/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadOvertimeReportPdf(
            @Valid @RequestBody OTTimeReportRequest request) {
        try {
            log.info("Generating PDF for OT report: {} from {} to {}",
                    request.getEmployeeEmail(), request.getStartDate(), request.getEndDate());

            // Generate report data
            OTTimeReportResponse report = otTimeCalculatorService.generateOTTimeReport(request);

            // Generate PDF
            byte[] pdfBytes = pdfGeneratorService.generateOvertimeReportPdf(report);

            // Create filename with timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = String.format("overtime-report_%s_%s.pdf",
                    sanitizeFilename(report.getEmployeeEmail()),
                    timestamp);

            // Set response headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            log.info("Successfully generated PDF for OT report: {}, size: {} bytes",
                    request.getEmployeeEmail(), pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (DocumentException e) {
            log.error("Error generating PDF document for employee: {}", request.getEmployeeEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for PDF OT report: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error generating PDF for OT report: {}", request.getEmployeeEmail(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Sanitizes filename by replacing invalid characters.
     */
    private String sanitizeFilename(String filename) {
        return filename.replaceAll("[^a-zA-Z0-9.-]", "_");
    }
}
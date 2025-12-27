package com.example.met.service;

import com.example.met.dto.JobCardTimeDetails;
import com.example.met.dto.response.EmployeeTimeReportResponse;
import com.example.met.dto.response.OTTimeReportResponse;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for generating PDF reports.
 * Uses iText PDF library to create formatted PDF documents.
 */
@Service
@Slf4j
public class PdfGeneratorService {

    private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.DARK_GRAY);
    private static final Font HEADER_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.WHITE);
    private static final Font NORMAL_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.BLACK);
    private static final Font BOLD_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.BLACK);
    private static final BaseColor HEADER_COLOR = new BaseColor(41, 128, 185); // Professional blue

    /**
     * Generates PDF for Employee Time Tracking Report.
     *
     * @param report The time report data
     * @return PDF document as byte array
     * @throws DocumentException if PDF generation fails
     */
    public byte[] generateEmployeeTimeReportPdf(EmployeeTimeReportResponse report) throws DocumentException {
        log.info("Generating PDF for employee time report: {}", report.getEmployeeEmail());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // Title
            Paragraph title = new Paragraph("Employee Time Tracking Report", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Employee Info Section
            document.add(createEmployeeInfoSection(
                    report.getEmployeeName(),
                    report.getEmployeeEmail(),
                    report.getReportStartDate().toString(),
                    report.getReportEndDate().toString()
            ));

            // Summary Section
            document.add(createTimeSummarySection(
                    report.getTotalJobCards(),
                    report.getTotalTimeSpent()
            ));

            // Job Cards Table
            if (report.getJobCards() != null && !report.getJobCards().isEmpty()) {
                document.add(new Paragraph("Job Card Details", BOLD_FONT));
                document.add(Chunk.NEWLINE);
                document.add(createJobCardsTable(report.getJobCards()));
            }

            // Footer
            document.add(createFooter());

            log.info("Successfully generated PDF for employee time report: {}", report.getEmployeeEmail());

        } catch (DocumentException e) {
            log.error("Error generating PDF for employee time report", e);
            throw e;
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }

        return baos.toByteArray();
    }

    /**
     * Generates PDF for Employee Overtime Report.
     *
     * @param report The overtime report data
     * @return PDF document as byte array
     * @throws DocumentException if PDF generation fails
     */
    public byte[] generateOvertimeReportPdf(OTTimeReportResponse report) throws DocumentException {
        log.info("Generating PDF for overtime report: {}", report.getEmployeeEmail());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 36, 36, 54, 36); // Landscape for wider table

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // Title
            Paragraph title = new Paragraph("Employee Overtime Report", TITLE_FONT);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Employee Info Section
            document.add(createEmployeeInfoSection(
                    report.getEmployeeName(),
                    report.getEmployeeEmail(),
                    report.getStartDate().toString(),
                    report.getEndDate().toString()
            ));

            // OT Summary Section
            document.add(createOTSummarySection(
                    report.getTotalMorningOT(),
                    report.getTotalEveningOT(),
                    report.getTotalOT()
            ));

            // Status Time Summary
            document.add(createStatusTimeSummarySection(
                    report.getTotalOnHoldTime(),
                    report.getTotalAssignedTime(),
                    report.getTotalInProgressTime()
            ));

            // OT Records Table
            if (report.getOtRecords() != null && !report.getOtRecords().isEmpty()) {
                document.add(new Paragraph("Daily Overtime Records", BOLD_FONT));
                document.add(Chunk.NEWLINE);
                document.add(createOTRecordsTable(report.getOtRecords()));
            }

            // Footer
            document.add(createFooter());

            log.info("Successfully generated PDF for overtime report: {}", report.getEmployeeEmail());

        } catch (DocumentException e) {
            log.error("Error generating PDF for overtime report", e);
            throw e;
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }

        return baos.toByteArray();
    }

    /**
     * Creates employee information section.
     */
    private PdfPTable createEmployeeInfoSection(String name, String email, String startDate, String endDate) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);

        addInfoRow(table, "Employee Name:", name);
        addInfoRow(table, "Employee Email:", email);
        addInfoRow(table, "Report Period:", startDate + " to " + endDate);

        return table;
    }

    /**
     * Creates time summary section.
     */
    private PdfPTable createTimeSummarySection(int totalJobCards, com.example.met.dto.TimeSpentSummary totalTime) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);

        addInfoRow(table, "Total Job Cards:", String.valueOf(totalJobCards));
        if (totalTime != null) {
            addInfoRow(table, "Total On Hold Time:", totalTime.getTotalOnHoldTime() != null ? totalTime.getTotalOnHoldTime() : "00:00");
            addInfoRow(table, "Total Assigned Time:", totalTime.getTotalAssignedTime() != null ? totalTime.getTotalAssignedTime() : "00:00");
            addInfoRow(table, "Total In Progress Time:", totalTime.getTotalInProgressTime() != null ? totalTime.getTotalInProgressTime() : "00:00");
            addInfoRow(table, "Total Combined Time:", totalTime.getTotalCombinedTime() != null ? totalTime.getTotalCombinedTime() : "00:00");
        } else {
            addInfoRow(table, "Total Time Spent:", "N/A");
        }

        return table;
    }

    /**
     * Creates OT summary section.
     */
    private PdfPTable createOTSummarySection(String morningOT, String eveningOT, String totalOT) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);

        addInfoRow(table, "Total Morning OT:", morningOT != null ? morningOT : "0h 0m");
        addInfoRow(table, "Total Evening OT:", eveningOT != null ? eveningOT : "0h 0m");
        addInfoRow(table, "Total Overtime:", totalOT != null ? totalOT : "0h 0m");

        return table;
    }

    /**
     * Creates status time summary section.
     */
    private PdfPTable createStatusTimeSummarySection(String onHold, String assigned, String inProgress) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);
        table.setSpacingBefore(10);

        addInfoRow(table, "On Hold Time:", onHold != null ? onHold : "00:00");
        addInfoRow(table, "Assigned Time:", assigned != null ? assigned : "00:00");
        addInfoRow(table, "In Progress Time:", inProgress != null ? inProgress : "00:00");

        return table;
    }

    /**
     * Adds an info row to a table.
     */
    private void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, BOLD_FONT));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, NORMAL_FONT));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    /**
     * Creates job cards table.
     */
    private PdfPTable createJobCardsTable(java.util.List<JobCardTimeDetails> jobCards) throws DocumentException {
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.5f, 2f, 1.5f, 1.5f, 1.5f, 1.5f});
        table.setSpacingAfter(15);

        // Headers
        addTableHeader(table, "Job Card");
        addTableHeader(table, "Location");
        addTableHeader(table, "Date");
        addTableHeader(table, "On Hold");
        addTableHeader(table, "In Progress");
        addTableHeader(table, "Status");

        // Data rows
        for (JobCardTimeDetails jobCard : jobCards) {
            addTableCell(table, jobCard.getJobCardTitle() != null ? jobCard.getJobCardTitle() : "N/A");
            addTableCell(table, jobCard.getLocation() != null ? jobCard.getLocation() : "N/A");
            addTableCell(table, jobCard.getDate() != null ? jobCard.getDate().toString() : "N/A");
            addTableCell(table, jobCard.getTimeSpentOnHold() != null ? jobCard.getTimeSpentOnHold() : "00:00");
            addTableCell(table, jobCard.getTimeSpentInProgress() != null ? jobCard.getTimeSpentInProgress() : "00:00");
            addTableCell(table, jobCard.getCurrentStatus() != null ? jobCard.getCurrentStatus().toString() : "N/A");
        }

        return table;
    }

    /**
     * Creates OT records table.
     */
    private PdfPTable createOTRecordsTable(java.util.List<OTTimeReportResponse.OTRecord> records) throws DocumentException {
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1.5f, 1.5f, 1.5f, 1.5f, 2.5f});
        table.setSpacingAfter(15);

        // Headers
        addTableHeader(table, "Date");
        addTableHeader(table, "First Time");
        addTableHeader(table, "Last Time");
        addTableHeader(table, "Morning OT");
        addTableHeader(table, "Evening OT");
        addTableHeader(table, "Daily Total OT");

        // Data rows
        for (OTTimeReportResponse.OTRecord record : records) {
            addTableCell(table, record.getDate() != null ? record.getDate() : "N/A");
            addTableCell(table, record.getFirstTime() != null ? record.getFirstTime() : "N/A");
            addTableCell(table, record.getLastTime() != null ? record.getLastTime() : "N/A");
            addTableCell(table, record.getMorningOT() != null ? record.getMorningOT() : "0h 0m");
            addTableCell(table, record.getEveningOT() != null ? record.getEveningOT() : "0h 0m");
            addTableCell(table, record.getDailyTotalOT() != null ? record.getDailyTotalOT() : "0h 0m");
        }

        return table;
    }

    /**
     * Adds a header cell to the table.
     */
    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, HEADER_FONT));
        cell.setBackgroundColor(HEADER_COLOR);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8);
        table.addCell(cell);
    }

    /**
     * Adds a data cell to the table.
     */
    private void addTableCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", NORMAL_FONT));
        cell.setPadding(5);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        table.addCell(cell);
    }

    /**
     * Creates footer with generation timestamp.
     */
    private Paragraph createFooter() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        Paragraph footer = new Paragraph("Generated on: " + timestamp, new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, BaseColor.GRAY));
        footer.setAlignment(Element.ALIGN_RIGHT);
        footer.setSpacingBefore(20);
        return footer;
    }
}

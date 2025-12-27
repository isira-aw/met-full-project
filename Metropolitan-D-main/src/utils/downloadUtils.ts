/**
 * Utility functions for downloading files from blob data.
 */

/**
 * Downloads a blob as a file with a given filename.
 * Creates a temporary download link and triggers the download.
 *
 * @param blob The blob data to download
 * @param filename The filename to save as
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  // Create a URL for the blob
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  window.URL.revokeObjectURL(url);
};

/**
 * Downloads a PDF blob with automatic filename generation.
 *
 * @param blob The PDF blob
 * @param baseFilename Base filename without extension
 * @param timestamp Optional timestamp to append to filename
 */
export const downloadPdf = (
  blob: Blob,
  baseFilename: string,
  timestamp?: string
): void => {
  const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `${baseFilename}_${ts}.pdf`;
  downloadBlob(blob, filename);
};

/**
 * Extracts filename from Content-Disposition header.
 * Falls back to default filename if header is not present.
 *
 * @param contentDisposition The Content-Disposition header value
 * @param defaultFilename Fallback filename
 * @returns Extracted or default filename
 */
export const getFilenameFromHeader = (
  contentDisposition: string | null,
  defaultFilename: string
): string => {
  if (!contentDisposition) {
    return defaultFilename;
  }

  const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
  const matches = filenameRegex.exec(contentDisposition);

  if (matches != null && matches[1]) {
    return matches[1].replace(/['"]/g, '');
  }

  return defaultFilename;
};

/**
 * Downloads a ticket attachment.
 * Shows error alert if download fails.
 *
 * @param ticketId The ticket ID
 * @param filename The original filename to save as
 * @param downloadFunction The API function to call for downloading
 */
export const downloadTicketAttachment = async (
  ticketId: string,
  filename: string,
  downloadFunction: (ticketId: string) => Promise<Blob>
): Promise<void> => {
  try {
    const blob = await downloadFunction(ticketId);
    downloadBlob(blob, filename);
  } catch (error) {
    console.error('Failed to download attachment:', error);
    alert('Failed to download attachment. Please try again.');
  }
};

/**
 * Example usage:
 *
 * // Simple download
 * downloadBlob(pdfBlob, 'report.pdf');
 *
 * // PDF download with timestamp
 * downloadPdf(pdfBlob, 'employee-report');
 * // Results in: employee-report_2025-12-27T15-30-00.pdf
 *
 * // With Content-Disposition header
 * const filename = getFilenameFromHeader(
 *   response.headers['content-disposition'],
 *   'default-report.pdf'
 * );
 * downloadBlob(blob, filename);
 *
 * // Ticket attachment download
 * import { apiService } from '../services/api';
 * downloadTicketAttachment(
 *   ticketId,
 *   'attachment.pdf',
 *   apiService.downloadTicketAttachment
 * );
 */

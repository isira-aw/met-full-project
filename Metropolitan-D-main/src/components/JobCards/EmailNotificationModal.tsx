// components/JobCards/EmailNotificationModal.tsx
import React, { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";
import { JobCardResponse } from "../../types/api";
import { apiService } from "../../services/api";
import { Modal } from "../UI/Modal";

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobCard: JobCardResponse;
}

interface EmailData {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  jobCard,
}) => {
  const [emailData, setEmailData] = useState<EmailData>({
    recipientEmail: jobCard.generator.email || "",
    recipientName: jobCard.generator.description || "Generator Owner",
    subject: `${jobCard.jobType} Update - ${jobCard.generator.name}`,
    message: `Dear ${jobCard.generator.description || "Generator Owner"},

We are writing to inform you about the ${jobCard.jobType.toLowerCase()} scheduled for your generator "${jobCard.generator.name}".

Job Details:
- Generator: ${jobCard.generator.name}
- Capacity: ${jobCard.generator.capacity || "N/A"} KW
- Job Type: ${jobCard.jobType}
- Scheduled Date: ${new Date(jobCard.date).toLocaleDateString()}
- Assigned Team: ${jobCard.assignedEmployees.length} technicians

Our team will arrive at the scheduled time to perform the ${jobCard.jobType.toLowerCase()} work. Please ensure the generator area is accessible and safe for our technicians.

If you have any questions or need to reschedule, please contact us immediately.

Best regards,
Metropolitan Engineering Team`,
  });

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail || !emailData.subject || !emailData.message) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSending(true);
      setError(null);

      const response = await apiService.sendJobCardEmail({
        jobCardId: jobCard.jobCardId,
        recipientEmail: emailData.recipientEmail,
        recipientName: emailData.recipientName,
        subject: emailData.subject,
        message: emailData.message,
      });

      if (response.status) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(response.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError(null);
    setEmailData({
      recipientEmail: jobCard.generator.email || "",
      recipientName: jobCard.generator.description || "Generator Owner",
      subject: `${jobCard.jobType} Update - ${jobCard.generator.name}`,
      message: `Dear ${jobCard.generator.description || "Generator Owner"},

We are writing to inform you about the ${jobCard.jobType.toLowerCase()} scheduled for your generator "${jobCard.generator.name}".

Job Details:
- Generator: ${jobCard.generator.name}
- Capacity: ${jobCard.generator.capacity || "N/A"} KW
- Job Type: ${jobCard.jobType}
- Scheduled Date: ${new Date(jobCard.date).toLocaleDateString()}
- Assigned Team: ${jobCard.assignedEmployees.length} technicians

Our team will arrive at the scheduled time to perform the ${jobCard.jobType.toLowerCase()} work. Please ensure the generator area is accessible and safe for our technicians.

If you have any questions or need to reschedule, please contact us immediately.

Best regards,
Metropolitan Engineering Team`,
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Email Sent Successfully" size="md">
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Email Sent!</h3>
          <p className="text-slate-600 mb-4">
            Your notification has been sent to {emailData.recipientEmail}
          </p>
          <button
            onClick={handleClose}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Email Notification" size="lg">
  <div className="space-y-6">
    {/* Generator Info */}
    <div className="bg-blue-50 rounded-lg p-4 mb-4 col-span-2">
      <h4 className="font-medium text-blue-900 mb-2">Generator Information</h4>
      <div className="text-sm text-blue-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <p><span className="font-medium">Generator:</span> {jobCard.generator.name}</p>
        <p><span className="font-medium">Job Type:</span> {jobCard.jobType}</p>
        <p><span className="font-medium">Date:</span> {new Date(jobCard.date).toLocaleDateString()}</p>
      </div>
    </div>

    {/* Form Fields in Two Columns */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Recipient Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Recipient Email *
        </label>
        <input
          type="email"
          value={emailData.recipientEmail}
          onChange={(e) => setEmailData(prev => ({ ...prev, recipientEmail: e.target.value }))}
          placeholder="Enter recipient email"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Recipient Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Recipient Name
        </label>
        <input
          type="text"
          value={emailData.recipientName}
          onChange={(e) => setEmailData(prev => ({ ...prev, recipientName: e.target.value }))}
          placeholder="Enter recipient name"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Subject */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Subject *
        </label>
        <input
          type="text"
          value={emailData.subject}
          onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Enter email subject"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Message */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Message *
        </label>
        <textarea
          value={emailData.message}
          onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Enter your message"
          rows={10}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          Character count: {emailData.message.length}
        </p>
      </div>
    </div>

    {/* Error */}
    {error && (
      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm">{error}</span>
      </div>
    )}

    {/* Actions */}
    <div className="flex justify-end space-x-3 pt-4">
      <button
        onClick={handleClose}
        disabled={sending}
        className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleSendEmail}
        disabled={sending || !emailData.recipientEmail || !emailData.subject || !emailData.message}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors flex items-center space-x-2"
      >
        {sending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Send Email</span>
          </>
        )}
      </button>
    </div>
  </div>
</Modal>

  );
};

// Updated JobCardDetailView.tsx to include email functionality
// Add this import at the top
// import { EmailNotificationModal } from "./EmailNotificationModal";

// Add these state variables in the component
// const [showEmailModal, setShowEmailModal] = useState(false);

// Add this button in the header section, next to the close button
/*
{jobCard.generator.email && (
  <button
    onClick={() => setShowEmailModal(true)}
    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
    title="Send email notification to generator owner"
  >
    <Mail className="w-4 h-4" />
    <span>Send Email</span>
  </button>
)}
*/

// Add this modal at the end of the return statement
/*
<EmailNotificationModal
  isOpen={showEmailModal}
  onClose={() => setShowEmailModal(false)}
  jobCard={jobCard}
/>
*/
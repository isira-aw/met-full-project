# 🎯 Ticket Weight & Attachment Features

## 📋 Overview

Two new features have been added to the ticket (Mini Job Card) system:
1. **Weight Limit** (1-10 scale) for ticket prioritization and reporting
2. **File Attachments** for documentation and evidence

---

## ✅ Backend Implementation

### 1. Database Changes

**MiniJobCard Entity** - New Fields:
```java
@Column(name = "weight_limit")
private Integer weightLimit = 5;  // Default: 5

@Column(name = "attachment_path")
private String attachmentPath;

@Column(name = "attachment_original_name")
private String attachmentOriginalName;
```

**Migration**: Database will auto-update with `spring.jpa.hibernate.ddl-auto=update`

---

### 2. New API Endpoints

#### Weight Management

**Update Weight** (ADMIN Only)
```http
PATCH /api/minijobcards/{id}/weight
Authorization: Bearer {token}
Content-Type: application/json

{
  "weightLimit": 7
}
```

**Response:**
```json
{
  "status": true,
  "message": "Weight updated successfully",
  "data": {
    "miniJobCardId": "uuid",
    "weightLimit": 7,
    ...
  }
}
```

---

#### File Attachment Management

**Upload Attachment** (ADMIN/EMPLOYEE)
```http
POST /api/minijobcards/{id}/attachment
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary file data]
```

**Permissions:**
- **ADMIN**: Can upload to any ticket
- **EMPLOYEE**: Can only upload to their own tickets

**Supported Formats:**
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Images: JPG, JPEG, PNG, GIF
- **Max Size**: 10MB

**Response:**
```json
{
  "status": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "miniJobCardId": "uuid",
    "hasAttachment": true,
    "attachmentOriginalName": "report.pdf",
    ...
  }
}
```

---

**Download Attachment** (ADMIN/EMPLOYEE)
```http
GET /api/minijobcards/{id}/attachment/download
Authorization: Bearer {token}
```

**Response:** Binary file download with original filename

---

**Delete Attachment** (ADMIN Only)
```http
DELETE /api/minijobcards/{id}/attachment
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": true,
  "message": "Attachment deleted successfully",
  "data": {
    "miniJobCardId": "uuid",
    "hasAttachment": false,
    "attachmentOriginalName": null,
    ...
  }
}
```

---

### 3. Response DTO Updates

**MiniJobCardResponse** - New Fields:
```typescript
{
  // Existing fields...

  // NEW: Weight and attachment fields
  weightLimit: number;              // 1-10
  hasAttachment: boolean;            // true if file attached
  attachmentOriginalName: string | null;  // Original filename
}
```

---

### 4. Security Features

✅ **JWT Authentication** - All endpoints require valid JWT token
✅ **Role-Based Access** - Admins can do everything, employees have restrictions
✅ **File Validation** - Type and size checked before upload
✅ **Secure Storage** - Files stored with UUID names to prevent path traversal
✅ **Permission Checks** - Employees can only upload to their own tickets

---

### 5. File Storage

**Location:** `uploads/attachments/`

**Filename Format:** `{UUID}.{extension}`
- Example: `550e8400-e29b-41d4-a716-446655440000.pdf`

**Storage Logic:**
- Files uploaded → stored with UUID name
- Original filename preserved in database
- Old file automatically deleted when new file uploaded
- Files deleted when attachment removed

---

## 🎨 Frontend Implementation

### 1. New Component: FileUpload

**Location:** `src/components/ui/FileUpload.tsx`

**Features:**
- ✅ Drag & drop support
- ✅ Click to upload
- ✅ File size validation
- ✅ File type validation
- ✅ Preview selected file
- ✅ Download existing file
- ✅ Remove file
- ✅ Error handling

**Usage Example:**
```tsx
import { FileUpload } from '../components/ui';

const [file, setFile] = useState<File | null>(null);

<FileUpload
  label="Attach Document"
  onFileSelect={setFile}
  currentFile={{
    name: ticket.attachmentOriginalName,
  }}
  onDownload={() => downloadAttachment(ticket.id)}
  accept=".pdf,.jpg,.png"
  maxSize={10}
/>
```

---

### 2. Weight Selector Component

**For Admin Panels:**
```tsx
<Select
  label="Weight (Priority)"
  options={[
    { value: '1', label: '1 - Lowest' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5 - Medium' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10 - Highest' },
  ]}
  value={weight.toString()}
  onChange={(e) => setWeight(parseInt(e.target.value))}
  fullWidth
/>
```

---

### 3. API Service Methods

**Add these to `src/services/api.ts`:**

```typescript
// Update ticket weight (ADMIN only)
updateTicketWeight: async (ticketId: string, weight: number) => {
  const response = await apiClient.patch(
    `/minijobcards/${ticketId}/weight`,
    { weightLimit: weight }
  );
  return response.data;
},

// Upload attachment
uploadTicketAttachment: async (ticketId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(
    `/minijobcards/${ticketId}/attachment`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
},

// Download attachment
downloadTicketAttachment: async (ticketId: string) => {
  const response = await apiClient.get(
    `/minijobcards/${ticketId}/attachment/download`,
    {
      responseType: 'blob',
    }
  );
  return response.data;
},

// Delete attachment (ADMIN only)
deleteTicketAttachment: async (ticketId: string) => {
  const response = await apiClient.delete(
    `/minijobcards/${ticketId}/attachment`
  );
  return response.data;
},
```

---

## 🔄 Integration Guide

### Admin Panel - Ticket Management

**When Creating/Editing Ticket:**
1. Add weight selector (1-10 dropdown)
2. Add file upload component
3. On save: Update weight + upload file if selected

**Example Form:**
```tsx
const [formData, setFormData] = useState({
  ...existingFields,
  weightLimit: 5,
});
const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

// On submit
const handleSubmit = async () => {
  // 1. Create/update ticket
  const ticket = await api.createTicket(formData);

  // 2. Update weight if needed
  if (formData.weightLimit !== 5) {
    await api.updateTicketWeight(ticket.id, formData.weightLimit);
  }

  // 3. Upload attachment if file selected
  if (attachmentFile) {
    await api.uploadTicketAttachment(ticket.id, attachmentFile);
  }
};
```

---

### Employee Panel - MyTasks

**When Completing Ticket:**
1. Show file upload option
2. Allow file attachment before marking as complete
3. Upload file when status changes to COMPLETED

**Example:**
```tsx
<Modal title="Complete Task">
  <FileUpload
    label="Attach Completion Report (Optional)"
    onFileSelect={setAttachmentFile}
    helperText="Upload photos, reports, or documents"
  />

  <Button onClick={async () => {
    // 1. Update status to COMPLETED
    await api.updateTicketStatus(ticketId, 'COMPLETED');

    // 2. Upload attachment if provided
    if (attachmentFile) {
      await api.uploadTicketAttachment(ticketId, attachmentFile);
    }
  }}>
    Mark as Complete
  </Button>
</Modal>
```

---

### Reports Page - Display Weight Metrics

**Show Aggregated Weight Data:**
```tsx
// Fetch completed tickets
const completedTickets = tickets.filter(t => t.status === 'COMPLETED');

// Calculate metrics
const totalWeight = completedTickets.reduce((sum, t) => sum + t.weightLimit, 0);
const averageWeight = totalWeight / completedTickets.length;

// Display
<Card>
  <h3>Completed Tickets Metrics</h3>
  <div className="grid grid-cols-3 gap-4">
    <div>
      <p className="text-sm text-gray-500">Total Completed</p>
      <p className="text-2xl font-bold">{completedTickets.length}</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Total Weight</p>
      <p className="text-2xl font-bold">{totalWeight}</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Average Weight</p>
      <p className="text-2xl font-bold">{averageWeight.toFixed(1)}</p>
    </div>
  </div>
</Card>
```

---

## 📊 Use Cases

### Weight Limit (1-10)

**Purpose:** Prioritization and workload measurement

**Examples:**
- **1-3**: Low priority maintenance
- **4-6**: Standard repairs
- **7-9**: Urgent issues
- **10**: Critical emergency

**Benefits:**
- Helps prioritize employee workload
- Measures completed work value (not just count)
- Better resource allocation
- Performance metrics based on weight, not just quantity

---

### File Attachments

**Purpose:** Documentation and evidence

**Use Cases:**
- **Before photos**: Document initial generator condition
- **After photos**: Show completed work
- **Reports**: PDF maintenance reports
- **Invoices**: Attach service invoices
- **Diagrams**: Technical diagrams or schematics

**Benefits:**
- Complete documentation trail
- Evidence for billing/invoicing
- Better communication between admin and employees
- Historical reference for future maintenance

---

## 🔒 Security Considerations

✅ **Access Control:**
- ADMIN can set weight, upload/delete files on any ticket
- EMPLOYEE can only upload files to their own tickets
- Both roles can download attachments

✅ **File Validation:**
- Type whitelist (no executables allowed)
- Size limit (10MB max)
- Server-side validation (client + server)

✅ **Storage Security:**
- Files stored outside web root
- UUID filenames prevent guessing
- No directory traversal attacks
- Proper file permissions

✅ **Download Security:**
- JWT authentication required
- Content-Disposition header prevents XSS
- Binary response (not embedded in HTML)

---

## 🎯 Summary

### Backend Complete ✅
- Database schema updated
- API endpoints implemented
- File storage service created
- Security and validation in place

### Frontend Components ✅
- FileUpload component created
- Weight selector pattern documented
- API integration guide provided

### Next Steps (Implementation)
1. Add weight selector to admin ticket forms
2. Add FileUpload component to admin ticket forms
3. Add FileUpload to employee completion flow
4. Update Reports page to show weight metrics
5. Add download buttons for attachments in ticket lists

---

## 📝 Configuration

**Backend** (`application.properties`):
```properties
# File Upload Configuration
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
file.upload-dir=uploads/attachments
```

**Frontend** (No configuration needed, uses existing API client)

---

## 🐛 Troubleshooting

### File Upload Fails

**Error**: "File size exceeds maximum limit"
- **Solution**: Check file is under 10MB

**Error**: "File type not allowed"
- **Solution**: Only use: PDF, JPG, JPEG, PNG, GIF, DOC, DOCX, XLS, XLSX

**Error**: "Employees can only upload to their own tickets"
- **Solution**: Employee trying to upload to someone else's ticket (not allowed)

### Weight Update Fails

**Error**: "Weight limit must be between 1 and 10"
- **Solution**: Ensure weight value is 1-10

**Error**: "Unauthorized"
- **Solution**: Only ADMIN users can update weight

---

**Last Updated**: 2025-12-27
**Status**: ✅ Backend Complete | ⏳ Frontend Integration Pending
**Branch**: `claude/rebuild-project-architecture-K5lpO`

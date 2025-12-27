package com.example.met.service;

import com.example.met.exception.BadRequestException;
import com.example.met.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path fileStorageLocation;

    // Allowed file extensions
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "jpg", "jpeg", "png", "gif", "doc", "docx", "xls", "xlsx"
    );

    // Max file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public FileStorageService(@Value("${file.upload-dir:uploads/attachments}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("File storage directory created at: {}", this.fileStorageLocation);
        } catch (IOException ex) {
            log.error("Could not create the directory for file uploads", ex);
            throw new RuntimeException("Could not create the directory for file uploads", ex);
        }
    }

    /**
     * Store a file and return the generated filename
     */
    public String storeFile(MultipartFile file) {
        // Validate file
        validateFile(file);

        // Get original filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Check for invalid characters in filename
            if (originalFilename.contains("..")) {
                throw new BadRequestException("Filename contains invalid path sequence: " + originalFilename);
            }

            // Generate unique filename: UUID + original extension
            String fileExtension = getFileExtension(originalFilename);
            String storedFilename = UUID.randomUUID().toString() + "." + fileExtension;

            // Copy file to storage location
            Path targetLocation = this.fileStorageLocation.resolve(storedFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("File stored successfully: {} (original: {})", storedFilename, originalFilename);
            return storedFilename;

        } catch (IOException ex) {
            log.error("Failed to store file: {}", originalFilename, ex);
            throw new RuntimeException("Failed to store file: " + originalFilename, ex);
        }
    }

    /**
     * Load a file as Resource
     */
    public Resource loadFileAsResource(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + filename);
            }
        } catch (MalformedURLException ex) {
            log.error("File not found: {}", filename, ex);
            throw new ResourceNotFoundException("File not found: " + filename);
        }
    }

    /**
     * Delete a file
     */
    public void deleteFile(String filename) {
        try {
            Path filePath = this.fileStorageLocation.resolve(filename).normalize();
            Files.deleteIfExists(filePath);
            log.info("File deleted successfully: {}", filename);
        } catch (IOException ex) {
            log.error("Failed to delete file: {}", filename, ex);
            throw new RuntimeException("Failed to delete file: " + filename, ex);
        }
    }

    /**
     * Validate file size and type
     */
    private void validateFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload empty file");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum limit of 10MB");
        }

        // Check file extension
        String filename = file.getOriginalFilename();
        String extension = getFileExtension(filename);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException(
                    "File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS)
            );
        }

        log.debug("File validation passed: {} ({})", filename, formatFileSize(file.getSize()));
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            throw new BadRequestException("Filename is empty");
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            throw new BadRequestException("File has no extension");
        }

        return filename.substring(lastDotIndex + 1);
    }

    /**
     * Format file size for logging
     */
    private String formatFileSize(long size) {
        if (size < 1024) {
            return size + " B";
        } else if (size < 1024 * 1024) {
            return String.format("%.2f KB", size / 1024.0);
        } else {
            return String.format("%.2f MB", size / (1024.0 * 1024.0));
        }
    }
}

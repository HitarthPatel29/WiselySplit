package ca.mohawkCollege.wiselySplitServer.services.user;

import ca.mohawk_college.wiselysplit_server.exceptions.BusinessException;
import ca.mohawk_college.wiselysplit_server.jpa.constants.StatusCode;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class ImageUploadService {
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");

    private final Cloudinary cloudinary;

    public ImageUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadProfilePicture(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(StatusCode.INVALID_FILE_UPLOAD,
                    "Profile picture is missing or empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException(StatusCode.INVALID_FILE_UPLOAD,
                    "Rejected profile picture content type: " + contentType);
        }

        byte[] bytes = file.getBytes();
        if (!hasImageSignature(bytes)) {
            throw new BusinessException(StatusCode.INVALID_FILE_UPLOAD,
                    "Rejected profile picture: bytes do not match an allowed image format");
        }

        Map uploadResult = cloudinary.uploader().upload(bytes,
                ObjectUtils.asMap(
                        "folder", "wiselysplit/profile_pictures",
                        "resource_type", "image"));
        return (String) uploadResult.get("secure_url");
    }

    private static boolean hasImageSignature(byte[] bytes) {
        return isJpeg(bytes) || isPng(bytes) || isGif(bytes) || isWebp(bytes);
    }

    private static boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3
                && u(bytes[0]) == 0xFF
                && u(bytes[1]) == 0xD8
                && u(bytes[2]) == 0xFF;
    }

    private static boolean isPng(byte[] bytes) {
        return bytes.length >= 4
                && u(bytes[0]) == 0x89
                && bytes[1] == 'P'
                && bytes[2] == 'N'
                && bytes[3] == 'G';
    }

    private static boolean isGif(byte[] bytes) {
        return bytes.length >= 4
                && bytes[0] == 'G'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == '8';
    }

    private static boolean isWebp(byte[] bytes) {
        return bytes.length >= 12
                && bytes[0] == 'R'
                && bytes[1] == 'I'
                && bytes[2] == 'F'
                && bytes[3] == 'F'
                && bytes[8] == 'W'
                && bytes[9] == 'E'
                && bytes[10] == 'B'
                && bytes[11] == 'P';
    }

    private static int u(byte b) {
        return b & 0xFF;
    }
}

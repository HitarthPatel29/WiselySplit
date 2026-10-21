package ca.mohawk_college.wiselysplit_server.jpa.constants;

import org.springframework.beans.factory.annotation.Value;

public class AppConstants {
    /** Max rows accepted in a single CSV batch import. */
    public static final int MAX_ROWS_IN_CSV_BATCH = 150;

    @Value("${cloudinary.default_photo_link}")
    public static final String DEFAULT_PROFILE_PICTURE_URL = "";
}

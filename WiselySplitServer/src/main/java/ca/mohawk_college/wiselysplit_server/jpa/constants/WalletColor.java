package ca.mohawk_college.wiselysplit_server.jpa.constants;

import ca.mohawk_college.wiselysplit_server.jpa.utilities.WalletColorConverter;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Fixed set of wallet/card colors.
 * DB/API keep the frontend color id (e.g. {@code "emerald"});
 * use {@link WalletColorConverter} instead of {@code @Enumerated}.
 */
public enum WalletColor {
    EMERALD("emerald"),
    ROSE("rose"),
    BLUE("blue"),
    INDIGO("indigo"),
    PURPLE("purple"),
    AMBER("amber"),
    CYAN("cyan"),
    VIOLET("violet"),
    TEAL("teal"),
    ORANGE("orange"),
    LIME("lime"),
    FUCHSIA("fuchsia"),
    PINK("pink"),
    SLATE("slate"),
    STONE("stone"),
    BLACK("black"),
    SILVER("silver");

    public static final WalletColor DEFAULT = EMERALD;

    private final String colorId;

    WalletColor(String colorId) {
        this.colorId = colorId;
    }

    @JsonCreator
    public static WalletColor fromJson(String value) {
        return fromColorId(value);
    }

    @JsonValue
    public String getColorId() {
        return colorId;
    }

    /** Resolve from API/DB color id; falls back to {@link #DEFAULT}. */
    public static WalletColor fromColorId(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT;
        }
        String normalized = value.trim();
        for (WalletColor color : values()) {
            if (color.colorId.equalsIgnoreCase(normalized)
                    || color.name().equalsIgnoreCase(normalized)) {
                return color;
            }
        }
        return DEFAULT;
    }
}

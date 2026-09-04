package ca.mohawk_college.wiselysplit_server.jpa.utilities;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link WalletColor} as the frontend/DB color id
 * (e.g. {@code "emerald"}), not the enum constant name.
 */
@Converter(autoApply = true)
public class WalletColorConverter implements AttributeConverter<WalletColor, String> {

    // Converts the Enum to its colorId
    @Override
    public String convertToDatabaseColumn(WalletColor color) {
        return color == null ? null : color.getColorId();
    }

    // Converts the colorId to Enum
    @Override
    public WalletColor convertToEntityAttribute(String dbValue) {
        return WalletColor.fromColorId(dbValue);
    }
}

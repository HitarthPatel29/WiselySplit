package ca.mohawk_college.wiselysplit_server.jpa.utilities;

import ca.mohawk_college.wiselysplit_server.jpa.constants.WalletColor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class WalletColorConverterTest {

    private final WalletColorConverter converter = new WalletColorConverter();

    @Test
    void shouldPersistColorIdNotEnumConstant() {
        assertThat(converter.convertToDatabaseColumn(WalletColor.EMERALD))
                .isEqualTo("emerald");
    }

    @Test
    void shouldPersistNullAsNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @ParameterizedTest
    @CsvSource({
            "emerald, EMERALD",
            "Rose, ROSE",
            "BLUE, BLUE",
            "black, BLACK"
    })
    void shouldResolveColorIdOrConstant(String dbValue, WalletColor expected) {
        assertThat(converter.convertToEntityAttribute(dbValue)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "Unknown Color"})
    void shouldFallBackToEmeraldForBlankOrUnknown(String dbValue) {
        assertThat(converter.convertToEntityAttribute(dbValue)).isEqualTo(WalletColor.EMERALD);
    }
}

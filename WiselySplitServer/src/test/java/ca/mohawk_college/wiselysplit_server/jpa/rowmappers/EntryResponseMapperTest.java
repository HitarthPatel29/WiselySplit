package ca.mohawk_college.wiselysplit_server.jpa.rowmappers;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EntryResponseMapperTest {

    @Test
    void shouldReturnNullUntilEntryDispatchIsImplemented() {
        assertThat(EntryResponseMapper.toDtoList(List.of(), 1L)).isNull();
    }
}

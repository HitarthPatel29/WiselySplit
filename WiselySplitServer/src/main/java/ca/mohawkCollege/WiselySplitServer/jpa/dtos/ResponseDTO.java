package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class ResponseDTO {
    private Object data;
    private String StatusCode;
    private String statusDescription;
}

package ca.mohawkCollege.wiselySplitServer.jpa.dtos;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class ResponseDTO {
    private Object data;
    private String statusCode;
    private String statusDescription;
}

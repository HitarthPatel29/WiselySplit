package ca.mohawk_college.wiselysplit_server.jpa.dtos.invite;

public record InviteRequestDTO (Long senderId, String target, Long groupId){}

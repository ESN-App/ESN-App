using EsnApp.Domain.Events;

namespace EsnApp.Api.Contracts.Events;

public record PatchEventRequest(
    string? Title,
    string? ShortDescription,
    string? Description,
    string? Location,
    DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    string? RegistrationUrl,
    EventStatus? Status,
    int? MinimumParticipants,
    int? MaximumParticipants,
    int? CurrentParticipants,
    decimal? Price);

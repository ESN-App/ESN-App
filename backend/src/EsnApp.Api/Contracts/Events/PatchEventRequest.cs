using EsnApp.Domain.Events;

namespace EsnApp.Api.Contracts.Events;

public record PatchEventRequest(
    string? Title,
    string? ShortDescription,
    string? Description,
    string? Location,
    string? GoogleMapsUrl,
    decimal? Latitude,
    decimal? Longitude,
    DateTimeOffset? StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    string? RegistrationUrl,
    EventStatus? Status,
    int? MinimumParticipants,
    int? MaximumParticipants,
    int? CurrentParticipants,
    decimal? Price);

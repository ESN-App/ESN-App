using EsnApp.Domain.Events;

namespace EsnApp.Application.Events.Common;

public record EventDetailsDto(
    Guid Id,
    string Title,
    string ShortDescription,
    string Description,
    string Location,
    string? GoogleMapsUrl,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    string? RegistrationUrl,
    EventStatus Status,
    DateTimeOffset? PublishedAt,
    int? MinimumParticipants,
    int? MaximumParticipants,
    int? CurrentParticipants,
    decimal Price,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

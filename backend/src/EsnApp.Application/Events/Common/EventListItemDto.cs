namespace EsnApp.Application.Events.Common;

using EsnApp.Domain.Events;

public record EventListItemDto(
    Guid Id,
    string Title,
    string ShortDescription,
    string Location,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? ImagePath,
    int? CurrentParticipants,
    int? MaximumParticipants,
    decimal Price,
    EventStatus Status);

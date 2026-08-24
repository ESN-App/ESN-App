using EsnApp.Domain.Events;

namespace EsnApp.Application.Events.Common;

public static class EventMappings
{
    public static EventDetailsDto ToDetailsDto(this Event entity) => new(
        entity.Id,
        entity.Title,
        entity.ShortDescription,
        entity.Description,
        entity.Location,
        entity.GoogleMapsUrl?.ToString(),
        entity.StartsAt,
        entity.EndsAt,
        entity.ImagePath,
        entity.RegistrationUrl,
        entity.Status,
        entity.PublishedAt,
        entity.MinimumParticipants,
        entity.MaximumParticipants,
        entity.CurrentParticipants,
        entity.Price,
        entity.CreatedAt,
        entity.UpdatedAt);

    public static EventListItemDto ToListItemDto(this Event entity) => new(
        entity.Id,
        entity.Title,
        entity.ShortDescription,
        entity.Location,
        entity.StartsAt,
        entity.EndsAt,
        entity.ImagePath,
        entity.CurrentParticipants,
        entity.MaximumParticipants,
        entity.Price,
        entity.Status);
}

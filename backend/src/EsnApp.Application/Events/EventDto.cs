using EsnApp.Domain.Events;

namespace EsnApp.Application.Events;

public record EventDto(
    Guid Id,
    string Title,
    string Description,
    string Location,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt)
{
    public static EventDto FromEntity(Event entity) => new(
        entity.Id,
        entity.Title,
        entity.Description,
        entity.Location,
        entity.StartsAt,
        entity.EndsAt);
}

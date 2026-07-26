using EsnApp.Domain.Events;

namespace EsnApp.Application.Events.Abstractions;

public interface IEventRepository
{
    Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<EventPage> GetPublishedPageAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<EventPage> GetAdminPageAsync(
        EventStatus? status,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Event?> GetPublishedByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Event> AddAsync(Event entity, CancellationToken cancellationToken = default);

    Task<Event> UpdateAsync(Event entity, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

using EsnApp.Domain.Events;

namespace EsnApp.Application.Events.Abstractions;

public interface IEventRepository
{
    Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<EventPage> GetPublicPageAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<EventPage> GetAdminPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Event?> GetPublicByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Event> AddAsync(Event entity, CancellationToken cancellationToken = default);

    Task<Event> UpdateAsync(Event entity, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

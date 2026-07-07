using EsnApp.Domain.Events;

namespace EsnApp.Application.Events;

public interface IEventRepository
{
    Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Event> AddAsync(Event entity, CancellationToken cancellationToken = default);
}

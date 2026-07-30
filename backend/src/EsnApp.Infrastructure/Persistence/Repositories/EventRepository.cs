using EsnApp.Application.Events.Abstractions;
using EsnApp.Domain.Events;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class EventRepository(AppDbContext context)
    : RepositoryBase<Event>(context), IEventRepository
{
    public async Task<Event?> GetPublishedByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(
                entity => entity.Id == id && entity.Status == EventStatus.Published,
                cancellationToken);

    public async Task<EventPage> GetPublishedPageAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Events
            .AsNoTracking()
            .Where(entity =>
                entity.Status == EventStatus.Published
                && entity.StartsAt >= from
                && entity.StartsAt < to);

        return await ToPageAsync(query, page, pageSize, cancellationToken);
    }

    public async Task<EventPage> GetAdminPageAsync(
        EventStatus? status,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Events.AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(entity => entity.Status == status.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(entity => entity.StartsAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(entity => entity.StartsAt < to.Value);
        }

        return await ToPageAsync(query, page, pageSize, cancellationToken);
    }

    private static async Task<EventPage> ToPageAsync(
        IQueryable<Event> query,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(entity => entity.StartsAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new EventPage(items, totalCount);
    }
}
